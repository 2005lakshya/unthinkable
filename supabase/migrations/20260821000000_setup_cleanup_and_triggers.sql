-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cleanup of expired holds and waitlist offers to run every minute
SELECT cron.schedule('release-expired-holds-cron', '* * * * *', 'SELECT release_expired_holds();');
SELECT cron.schedule('expire-waitlist-offers-cron', '* * * * *', 'SELECT expire_waitlist_offers();');

-- Webhook to trigger send-waitlist-email Edge Function
CREATE OR REPLACE FUNCTION trigger_waitlist_email()
RETURNS TRIGGER AS $$
DECLARE
  v_anon_key text := current_setting('app.settings.anon_key', true);
  v_supabase_url text := current_setting('app.settings.supabase_url', true);
BEGIN
  -- Fallback to hardcoded values if settings are not found
  IF v_anon_key IS NULL OR v_anon_key = '' THEN
    v_anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZ3lsdXpkcnl6ZmFheWp0ZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNDc4NTEsImV4cCI6MjEwMjgyMzg1MX0.K6QuY1ob7k-04pUhfTJwsEUHXyawd3hbhtEeEHRYGk8';
  END IF;
  
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://skgyluzdryzfaayjtfqj.supabase.co';
  END IF;

  IF NEW.status = 'offered' AND OLD.status = 'waiting' THEN
    PERFORM net.http_post(
      url:= v_supabase_url || '/functions/v1/send-waitlist-email',
      headers:= json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_anon_key
      )::jsonb,
      body:= json_build_object(
        'waitlist_id', NEW.id, 
        'user_id', NEW.user_id, 
        'show_id', NEW.show_id,
        'position', NEW.position
      )::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_waitlist_offered
  AFTER UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION trigger_waitlist_email();
