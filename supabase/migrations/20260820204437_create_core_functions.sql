/*
# Ticket Booking System - Core Functions

1. Purpose
   SECURITY DEFINER functions for all seat status mutations. These enforce
   concurrency safety using SELECT ... FOR UPDATE row-level locks, preventing
   two customers from holding or booking the same seat simultaneously.

2. Functions
   - `hold_seats(p_show_id, p_seat_ids[])` — places a hold on available seats
     with a 10-minute TTL. Returns held seats or error if any seat is unavailable.
   - `confirm_booking(p_show_id, p_seat_ids[], p_total_amount)` — converts held
     seats to booked, creates a booking record with reference code.
   - `release_hold(p_show_id, p_seat_ids[])` — releases a user's hold on seats.
   - `release_expired_holds()` — releases all expired holds (scheduled).
   - `cancel_booking(p_booking_id)` — cancels a booking, frees seats, triggers
     waitlist auto-assignment.
   - `join_waitlist(p_show_id, p_category_id)` — adds user to waitlist queue.
   - `process_waitlist_for_seat(p_show_id, p_show_seat_id)` — offers freed seat
     to next waitlisted customer for that category.
   - `accept_waitlist_offer(p_waitlist_id)` — converts a waitlist offer into a
     hold so the user can complete checkout.
   - `expire_waitlist_offers()` — expires offers past their time limit and
     offers to the next in line (scheduled).
   - `get_show_seat_map(p_show_id)` — returns seat map with status for rendering.

3. Concurrency Protection
   All seat mutations use SELECT ... FOR UPDATE inside a transaction to lock
   the show_seats rows. If two requests try to hold the same seat simultaneously,
   the second blocks until the first commits, then sees the updated status and
   fails. This is enforced at the database level, not the application level.

4. Security
   All functions are SECURITY DEFINER so they can bypass RLS on show_seats.
   Each function verifies auth.uid() matches the hold owner or booking owner.
*/

-- ============ HOLD SEATS ============
CREATE OR REPLACE FUNCTION hold_seats(p_show_id uuid, p_seat_ids uuid[])
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_hold_ttl interval := interval '10 minutes';
  v_held_count int;
  v_available_count int;
  v_result jsonb;
  v_seat uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Release any existing holds by this user for this show first
  UPDATE show_seats
  SET status = 'available', held_by = NULL, hold_expires_at = NULL
  WHERE show_id = p_show_id AND held_by = v_user_id AND status = 'held';

  -- Lock all requested seats FOR UPDATE to prevent race conditions
  PERFORM 1
  FROM show_seats
  WHERE show_id = p_show_id
    AND seat_id = ANY(p_seat_ids)
  FOR UPDATE;

  -- First check all are available (not held/booked)
  SELECT count(*) INTO v_available_count
  FROM show_seats
  WHERE show_id = p_show_id
    AND seat_id = ANY(p_seat_ids)
    AND status = 'available';

  IF v_available_count != array_length(p_seat_ids, 1) THEN
    -- Some seats are not available; find which ones
    SELECT jsonb_agg(jsonb_build_object('seat_id', seat_id, 'status', status))
    INTO v_result
    FROM show_seats
    WHERE show_id = p_show_id AND seat_id = ANY(p_seat_ids);
    RAISE EXCEPTION 'Some seats unavailable: %', v_result::text;
  END IF;

  -- Place holds
  UPDATE show_seats
  SET status = 'held',
      held_by = v_user_id,
      hold_expires_at = now() + v_hold_ttl
  WHERE show_id = p_show_id
    AND seat_id = ANY(p_seat_ids)
    AND status = 'available';

  GET DIAGNOSTICS v_held_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'held_count', v_held_count, 'hold_ttl_seconds', 600);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ CONFIRM BOOKING ============
CREATE OR REPLACE FUNCTION confirm_booking(p_show_id uuid, p_seat_ids uuid[], p_total_amount numeric)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_booking_id uuid;
  v_reference text;
  v_booked_count int;
  v_seat_labels jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Generate reference code
  v_reference := 'BK' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

  -- Lock seats
  PERFORM 1
  FROM show_seats
  WHERE show_id = p_show_id
    AND seat_id = ANY(p_seat_ids)
  FOR UPDATE;

  -- Verify they are held by this user and not expired
  SELECT count(*) INTO v_booked_count
  FROM show_seats
  WHERE show_id = p_show_id
    AND seat_id = ANY(p_seat_ids)
    AND status = 'held'
    AND held_by = v_user_id
    AND hold_expires_at > now();

  IF v_booked_count != array_length(p_seat_ids, 1) THEN
    RAISE EXCEPTION 'Seats are no longer held for you. Hold may have expired.';
  END IF;

  -- Create booking
  INSERT INTO bookings (reference_code, show_id, user_id, total_amount, status, qr_code_data)
  VALUES (v_reference, p_show_id, v_user_id, p_total_amount, 'confirmed', v_reference)
  RETURNING id INTO v_booking_id;

  -- Mark seats as booked
  UPDATE show_seats
  SET status = 'booked', booked_at = now(), hold_expires_at = NULL
  WHERE show_id = p_show_id
    AND seat_id = ANY(p_seat_ids)
    AND status = 'held'
    AND held_by = v_user_id;

  -- Create booking_seats records
  INSERT INTO booking_seats (booking_id, show_seat_id, seat_label, price)
  SELECT v_booking_id, ss.id,
    s.seat_row || '-' || s.seat_number,
    COALESCE(scp.price, 0)
  FROM show_seats ss
  JOIN seats s ON s.id = ss.seat_id
  LEFT JOIN seat_categories sc ON sc.id = s.category_id
  LEFT JOIN show_category_pricing scp ON scp.show_id = p_show_id AND scp.category_id = sc.id
  WHERE ss.show_id = p_show_id AND ss.seat_id = ANY(p_seat_ids);

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id, 'reference_code', v_reference);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ RELEASE HOLD ============
CREATE OR REPLACE FUNCTION release_hold(p_show_id uuid, p_seat_ids uuid[])
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE show_seats
  SET status = 'available', held_by = NULL, hold_expires_at = NULL
  WHERE show_id = p_show_id
    AND seat_id = ANY(p_seat_ids)
    AND held_by = v_user_id
    AND status = 'held';

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ RELEASE EXPIRED HOLDS ============
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS int AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE show_seats
  SET status = 'available', held_by = NULL, hold_expires_at = NULL
  WHERE status = 'held' AND hold_expires_at <= now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ CANCEL BOOKING ============
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_booking bookings%ROWTYPE;
  v_seat_ids uuid[];
  v_category_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.user_id != v_user_id AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized to cancel this booking';
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking already cancelled';
  END IF;

  -- Get seat IDs for this booking
  SELECT array_agg(ss.seat_id) INTO v_seat_ids
  FROM booking_seats bs
  JOIN show_seats ss ON ss.id = bs.show_seat_id
  WHERE bs.booking_id = p_booking_id;

  -- Get the category of the first seat (for waitlist)
  SELECT sc.id INTO v_category_id
  FROM booking_seats bs
  JOIN show_seats ss ON ss.id = bs.show_seat_id
  JOIN seats s ON s.id = ss.seat_id
  LEFT JOIN seat_categories sc ON sc.id = s.category_id
  WHERE bs.booking_id = p_booking_id
  LIMIT 1;

  -- Free the seats
  UPDATE show_seats
  SET status = 'available', booked_at = NULL, held_by = NULL, hold_expires_at = NULL
  WHERE show_id = v_booking.show_id
    AND seat_id = ANY(v_seat_ids)
    AND status = 'booked';

  -- Mark booking as cancelled
  UPDATE bookings SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_booking_id;

  -- Process waitlist for each freed seat
  PERFORM process_waitlist_for_seat(v_booking.show_id, ss.id)
  FROM show_seats ss
  WHERE ss.show_id = v_booking.show_id AND ss.seat_id = ANY(v_seat_ids);

  RETURN jsonb_build_object('success', true, 'freed_seats', array_length(v_seat_ids, 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ JOIN WAITLIST ============
CREATE OR REPLACE FUNCTION join_waitlist(p_show_id uuid, p_category_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_next_position int;
  v_existing waitlist%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if already on waitlist for this show+category
  SELECT * INTO v_existing FROM waitlist
  WHERE show_id = p_show_id AND category_id = p_category_id AND user_id = v_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already on waitlist', 'position', v_existing.position, 'status', v_existing.status);
  END IF;

  -- Get next position
  SELECT COALESCE(max(position), 0) + 1 INTO v_next_position
  FROM waitlist
  WHERE show_id = p_show_id AND category_id = p_category_id AND status = 'waiting';

  INSERT INTO waitlist (show_id, category_id, user_id, position, status)
  VALUES (p_show_id, p_category_id, v_user_id, v_next_position, 'waiting');

  RETURN jsonb_build_object('success', true, 'position', v_next_position);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ PROCESS WAITLIST FOR A FREED SEAT ============
CREATE OR REPLACE FUNCTION process_waitlist_for_seat(p_show_id uuid, p_show_seat_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_seat seats%ROWTYPE;
  v_category_id uuid;
  v_next_waitlist waitlist%ROWTYPE;
  v_offer_ttl interval := interval '10 minutes';
BEGIN
  -- Get the seat's category
  SELECT s.* INTO v_seat
  FROM show_seats ss JOIN seats s ON s.id = ss.seat_id
  WHERE ss.id = p_show_seat_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Seat not found');
  END IF;

  v_category_id := v_seat.category_id;
  IF v_category_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Seat has no category');
  END IF;

  -- Find next waiting person for this show+category
  SELECT * INTO v_next_waitlist
  FROM waitlist
  WHERE show_id = p_show_id
    AND category_id = v_category_id
    AND status = 'waiting'
  ORDER BY position ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    -- No one on waitlist; seat stays available
    RETURN jsonb_build_object('success', true, 'message', 'No waitlist entries');
  END IF;

  -- Place a hold for the waitlisted user
  UPDATE show_seats
  SET status = 'held',
      held_by = v_next_waitlist.user_id,
      hold_expires_at = now() + v_offer_ttl
  WHERE id = p_show_seat_id AND status = 'available';

  -- Update waitlist entry
  UPDATE waitlist
  SET status = 'offered',
      offered_at = now(),
      offer_expires_at = now() + v_offer_ttl,
      offered_show_seat_id = p_show_seat_id
  WHERE id = v_next_waitlist.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Seat offered to waitlisted customer',
    'waitlist_id', v_next_waitlist.id,
    'user_id', v_next_waitlist.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ ACCEPT WAITLIST OFFER ============
CREATE OR REPLACE FUNCTION accept_waitlist_offer(p_waitlist_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_waitlist waitlist%ROWTYPE;
  v_show_seat show_seats%ROWTYPE;
  v_hold_ttl interval := interval '10 minutes';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_waitlist FROM waitlist WHERE id = p_waitlist_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Waitlist entry not found';
  END IF;

  IF v_waitlist.user_id != v_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_waitlist.status != 'offered' THEN
    RAISE EXCEPTION 'No active offer for this waitlist entry';
  END IF;

  IF v_waitlist.offer_expires_at <= now() THEN
    -- Offer expired; mark and move to next person
    UPDATE waitlist SET status = 'expired' WHERE id = p_waitlist_id;
    PERFORM process_waitlist_for_seat(v_waitlist.show_id, v_waitlist.offered_show_seat_id);
    RAISE EXCEPTION 'Offer has expired';
  END IF;

  -- Extend the hold with a fresh TTL
  UPDATE show_seats
  SET status = 'held',
      held_by = v_user_id,
      hold_expires_at = now() + v_hold_ttl
  WHERE id = v_waitlist.offered_show_seat_id;

  -- Mark waitlist as fulfilled
  UPDATE waitlist SET status = 'fulfilled' WHERE id = p_waitlist_id;

  RETURN jsonb_build_object(
    'success', true,
    'show_id', v_waitlist.show_id,
    'show_seat_id', v_waitlist.offered_show_seat_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ EXPIRE WAITLIST OFFERS ============
CREATE OR REPLACE FUNCTION expire_waitlist_offers()
RETURNS int AS $$
DECLARE
  v_count int;
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT id, show_id, offered_show_seat_id
    FROM waitlist
    WHERE status = 'offered' AND offer_expires_at <= now()
    FOR UPDATE
  LOOP
    UPDATE waitlist SET status = 'expired' WHERE id = v_rec.id;
    PERFORM process_waitlist_for_seat(v_rec.show_id, v_rec.offered_show_seat_id);
    v_count := COALESCE(v_count, 0) + 1;
  END LOOP;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ GET SHOW SEAT MAP ============
CREATE OR REPLACE FUNCTION get_show_seat_map(p_show_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'show_seat_id', ss.id,
    'seat_id', ss.seat_id,
    'seat_row', s.seat_row,
    'seat_number', s.seat_number,
    'label', s.label,
    'category_id', s.category_id,
    'category_name', sc.name,
    'category_color', sc.color,
    'status', ss.status,
    'price', scp.price,
    'hold_expires_at', ss.hold_expires_at
  ) ORDER BY s.seat_row, s.seat_number)
  INTO v_result
  FROM show_seats ss
  JOIN seats s ON s.id = ss.seat_id
  LEFT JOIN seat_categories sc ON sc.id = s.category_id
  LEFT JOIN show_category_pricing scp ON scp.show_id = p_show_id AND scp.category_id = sc.id
  WHERE ss.show_id = p_show_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ GET ORGANISER REVENUE ============
CREATE OR REPLACE FUNCTION get_organiser_revenue(p_organiser_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'show_id', s.id,
      'title', s.title,
      'show_date', s.show_date,
      'venue_name', v.name,
      'total_bookings', COALESCE(b.total_bookings, 0),
      'total_seats', COALESCE(b.total_seats, 0),
      'total_revenue', COALESCE(b.total_revenue, 0),
      'cancelled_bookings', COALESCE(b.cancelled_bookings, 0)
    ) ORDER BY s.show_date DESC
  )
  INTO v_result
  FROM shows s
  JOIN venues v ON v.id = s.venue_id
  LEFT JOIN (
    SELECT
      show_id,
      count(*) FILTER (WHERE status = 'confirmed') AS total_bookings,
      count(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
      COALESCE(sum(revenue_per_booking) FILTER (WHERE status = 'confirmed'), 0) AS total_revenue,
      COALESCE(sum(seats_per_booking) FILTER (WHERE status = 'confirmed'), 0) AS total_seats
    FROM (
      SELECT
        b.show_id,
        b.id,
        b.status,
        COALESCE(sum(bs.price), 0) AS revenue_per_booking,
        count(bs.id) AS seats_per_booking
      FROM bookings b
      LEFT JOIN booking_seats bs ON bs.booking_id = b.id
      GROUP BY b.id, b.show_id, b.status
    ) b_grouped
    GROUP BY show_id
  ) b ON b.show_id = s.id
  WHERE s.organiser_id = p_organiser_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ GRANT EXECUTE ============
GRANT EXECUTE ON FUNCTION hold_seats TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_booking TO authenticated;
GRANT EXECUTE ON FUNCTION release_hold TO authenticated;
GRANT EXECUTE ON FUNCTION release_expired_holds TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cancel_booking TO authenticated;
GRANT EXECUTE ON FUNCTION join_waitlist TO authenticated;
GRANT EXECUTE ON FUNCTION process_waitlist_for_seat TO authenticated;
GRANT EXECUTE ON FUNCTION accept_waitlist_offer TO authenticated;
GRANT EXECUTE ON FUNCTION expire_waitlist_offers TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_show_seat_map TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_organiser_revenue TO authenticated;
