-- Fix for 'FOR UPDATE is not allowed with aggregate functions'

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
