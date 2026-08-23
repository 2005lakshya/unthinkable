-- Update get_show_seat_map to include is_mine boolean
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
    'hold_expires_at', ss.hold_expires_at,
    'is_mine', (ss.held_by = auth.uid())
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
