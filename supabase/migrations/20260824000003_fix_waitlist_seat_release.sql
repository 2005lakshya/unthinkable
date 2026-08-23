-- Update accept_waitlist_offer to free seat before processing next in waitlist
CREATE OR REPLACE FUNCTION accept_waitlist_offer(p_waitlist_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_waitlist waitlist%ROWTYPE;
  v_hold_ttl interval := interval '10 minutes';
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  SELECT * INTO v_waitlist FROM waitlist WHERE id = p_waitlist_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Waitlist entry not found');
  END IF;

  IF v_waitlist.user_id != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not your waitlist entry');
  END IF;

  IF v_waitlist.status != 'offered' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Offer is not valid or already processed');
  END IF;

  IF v_waitlist.offer_expires_at <= now() THEN
    -- Offer expired; mark and move to next person
    UPDATE waitlist SET status = 'expired' WHERE id = p_waitlist_id;
    -- IMPORTANT: Must free the seat before process_waitlist_for_seat can pick it up again!
    UPDATE show_seats SET status = 'available', held_by = NULL, hold_expires_at = NULL WHERE id = v_waitlist.offered_show_seat_id;
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


-- Update expire_waitlist_offers to free seat before processing next in waitlist
CREATE OR REPLACE FUNCTION expire_waitlist_offers()
RETURNS int AS $$
DECLARE
  v_count int;
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT id, show_id, offered_show_seat_id, user_id
    FROM waitlist
    WHERE status = 'offered' AND offer_expires_at <= now()
    FOR UPDATE
  LOOP
    -- 1. Mark waitlist as expired
    UPDATE waitlist SET status = 'expired' WHERE id = v_rec.id;
    
    -- 2. Free the seat FIRST so the next person can grab it!
    UPDATE show_seats 
    SET status = 'available', held_by = NULL, hold_expires_at = NULL 
    WHERE id = v_rec.offered_show_seat_id;
    
    -- 3. Pass it to the next person in line
    PERFORM process_waitlist_for_seat(v_rec.show_id, v_rec.offered_show_seat_id);
    
    v_count := COALESCE(v_count, 0) + 1;
  END LOOP;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
