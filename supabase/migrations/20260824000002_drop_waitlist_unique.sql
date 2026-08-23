-- Drop the unique constraint so users can have multiple waitlist entries for different quantities
ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS waitlist_show_id_category_id_user_id_key;
