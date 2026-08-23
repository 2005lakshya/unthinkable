-- Update join_waitlist to support quantity
CREATE OR REPLACE FUNCTION join_waitlist(p_show_id uuid, p_category_id uuid, p_quantity int DEFAULT 1)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_next_position int;
  v_existing waitlist%ROWTYPE;
  v_count int;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if already on waitlist for this show+category
  SELECT count(*) INTO v_count FROM waitlist
  WHERE show_id = p_show_id AND category_id = p_category_id AND user_id = v_user_id AND status = 'waiting';

  IF v_count > 0 THEN
    SELECT * INTO v_existing FROM waitlist
    WHERE show_id = p_show_id AND category_id = p_category_id AND user_id = v_user_id AND status = 'waiting' LIMIT 1;
    
    RETURN jsonb_build_object('success', true, 'message', 'Already on waitlist', 'position', v_existing.position, 'status', v_existing.status);
  END IF;

  -- Ensure valid quantity
  IF p_quantity < 1 OR p_quantity > 10 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  -- Get next position
  SELECT COALESCE(max(position), 0) INTO v_next_position
  FROM waitlist
  WHERE show_id = p_show_id AND category_id = p_category_id AND status = 'waiting';

  -- Insert multiple rows for the requested quantity
  FOR i IN 1..p_quantity LOOP
    v_next_position := v_next_position + 1;
    INSERT INTO waitlist (show_id, category_id, user_id, position, status)
    VALUES (p_show_id, p_category_id, v_user_id, v_next_position, 'waiting');
  END LOOP;

  RETURN jsonb_build_object('success', true, 'position', v_next_position - p_quantity + 1, 'quantity', p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
