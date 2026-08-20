/*
# Ticket Booking System - Core Schema

1. Purpose
   A ticket booking platform for movies and concerts with visual seat maps,
   seat holds with TTL, waitlist auto-assignment, and QR code tickets.

2. New Tables
   - `profiles` — extends auth.users with role (customer/organiser/admin)
   - `venues` — venues created by admin, with layout metadata
   - `seat_categories` — categories within a venue (Premium, Standard, etc.)
   - `seats` — individual seats in a venue with row/number/category
   - `shows` — movie or concert listings created by organisers
   - `show_seats` — per-show seat status (available/held/booked) with hold expiry
   - `bookings` — confirmed bookings with reference code
   - `booking_seats` — seats within a booking
   - `waitlist` — per-show, per-category waitlist queue

3. Security
   - RLS enabled on all tables.
   - Profiles: users can read/update own profile; admins can read all.
   - Venues/seat_categories/seats: public read (anon+authenticated); admin-only write.
   - Shows: public read; organiser+admin write (own shows for organiser, all for admin).
   - Show_seats: public read; write only via SECURITY DEFINER functions (not direct client writes).
   - Bookings/booking_seats: owner read; insert via functions; update own booking status.
   - Waitlist: owner read; insert via function; updates via functions.

4. Important Notes
   - Role stored in profiles table, referenced via auth.uid().
   - Show_seats is the concurrency-critical table — all seat status transitions go through
     SECURITY DEFINER functions using SELECT ... FOR UPDATE to prevent race conditions.
   - Hold TTL stored as expires_at on show_seats; a scheduled function releases expired holds.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'organiser', 'admin')),
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ VENUES ============
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  description text,
  total_seats int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venues_select_all" ON venues;
CREATE POLICY "venues_select_all" ON venues FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "venues_insert_admin" ON venues;
CREATE POLICY "venues_insert_admin" ON venues FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "venues_update_admin" ON venues;
CREATE POLICY "venues_update_admin" ON venues FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "venues_delete_admin" ON venues;
CREATE POLICY "venues_delete_admin" ON venues FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ SEAT CATEGORIES ============
CREATE TABLE IF NOT EXISTS seat_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_modifier numeric(10,2) NOT NULL DEFAULT 1.0,
  color text DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seat_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seat_categories_select_all" ON seat_categories;
CREATE POLICY "seat_categories_select_all" ON seat_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "seat_categories_insert_admin" ON seat_categories;
CREATE POLICY "seat_categories_insert_admin" ON seat_categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "seat_categories_update_admin" ON seat_categories;
CREATE POLICY "seat_categories_update_admin" ON seat_categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "seat_categories_delete_admin" ON seat_categories;
CREATE POLICY "seat_categories_delete_admin" ON seat_categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ SEATS ============
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  category_id uuid REFERENCES seat_categories(id) ON DELETE SET NULL,
  seat_row text NOT NULL,
  seat_number text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(venue_id, seat_row, seat_number)
);
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seats_select_all" ON seats;
CREATE POLICY "seats_select_all" ON seats FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "seats_insert_admin" ON seats;
CREATE POLICY "seats_insert_admin" ON seats FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "seats_update_admin" ON seats;
CREATE POLICY "seats_update_admin" ON seats FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "seats_delete_admin" ON seats;
CREATE POLICY "seats_delete_admin" ON seats FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ SHOWS ============
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('movie', 'concert')),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  organiser_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  show_date date NOT NULL,
  show_time time NOT NULL,
  poster_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shows_select_all" ON shows;
CREATE POLICY "shows_select_all" ON shows FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "shows_insert_organiser" ON shows;
CREATE POLICY "shows_insert_organiser" ON shows FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organiser', 'admin'))
  );

DROP POLICY IF EXISTS "shows_update_organiser" ON shows;
CREATE POLICY "shows_update_organiser" ON shows FOR UPDATE
  TO authenticated USING (
    organiser_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    organiser_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "shows_delete_organiser" ON shows;
CREATE POLICY "shows_delete_organiser" ON shows FOR DELETE
  TO authenticated USING (
    organiser_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ SHOW CATEGORY PRICING ============
CREATE TABLE IF NOT EXISTS show_category_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES seat_categories(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL,
  UNIQUE(show_id, category_id)
);
ALTER TABLE show_category_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_select_all" ON show_category_pricing;
CREATE POLICY "pricing_select_all" ON show_category_pricing FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "pricing_insert_organiser" ON show_category_pricing;
CREATE POLICY "pricing_insert_organiser" ON show_category_pricing FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM shows WHERE id = show_id AND organiser_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "pricing_update_organiser" ON show_category_pricing;
CREATE POLICY "pricing_update_organiser" ON show_category_pricing FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM shows WHERE id = show_id AND organiser_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM shows WHERE id = show_id AND organiser_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "pricing_delete_organiser" ON show_category_pricing;
CREATE POLICY "pricing_delete_organiser" ON show_category_pricing FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM shows WHERE id = show_id AND organiser_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ SHOW SEATS (per-show seat status) ============
CREATE TABLE IF NOT EXISTS show_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'held', 'booked')),
  held_by uuid REFERENCES auth.users(id),
  hold_expires_at timestamptz,
  booked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(show_id, seat_id)
);
ALTER TABLE show_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "show_seats_select_all" ON show_seats;
CREATE POLICY "show_seats_select_all" ON show_seats FOR SELECT
  TO anon, authenticated USING (true);

-- No direct INSERT/UPDATE/DELETE policies — all mutations go through SECURITY DEFINER functions
-- to enforce concurrency safety. We still need an update policy for the functions to work
-- since SECURITY DEFINER bypasses RLS, but we deny direct client updates.
DROP POLICY IF EXISTS "show_seats_update_deny" ON show_seats;
CREATE POLICY "show_seats_update_deny" ON show_seats FOR UPDATE
  TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "show_seats_delete_deny" ON show_seats;
CREATE POLICY "show_seats_delete_deny" ON show_seats FOR DELETE
  TO authenticated USING (false);

DROP POLICY IF EXISTS "show_seats_insert_admin" ON show_seats;
CREATE POLICY "show_seats_insert_admin" ON show_seats FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'organiser'))
  );

-- ============ BOOKINGS ============
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE,
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlist_offered')),
  qr_code_data text,
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_own" ON bookings;
CREATE POLICY "bookings_select_own" ON bookings FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM shows WHERE id = bookings.show_id AND organiser_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookings_update_own" ON bookings;
CREATE POLICY "bookings_update_own" ON bookings FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "bookings_delete_own" ON bookings;
CREATE POLICY "bookings_delete_own" ON bookings FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ BOOKING SEATS ============
CREATE TABLE IF NOT EXISTS booking_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  show_seat_id uuid NOT NULL REFERENCES show_seats(id) ON DELETE CASCADE,
  seat_label text NOT NULL,
  price numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE booking_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_seats_select_own" ON booking_seats;
CREATE POLICY "booking_seats_select_own" ON booking_seats FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM bookings b JOIN shows s ON s.id = b.show_id WHERE b.id = booking_id AND s.organiser_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "booking_seats_insert_own" ON booking_seats;
CREATE POLICY "booking_seats_insert_own" ON booking_seats FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "booking_seats_delete_own" ON booking_seats;
CREATE POLICY "booking_seats_delete_own" ON booking_seats FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ WAITLIST ============
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES seat_categories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'offered', 'expired', 'fulfilled')),
  position int NOT NULL,
  offered_at timestamptz,
  offer_expires_at timestamptz,
  offered_show_seat_id uuid REFERENCES show_seats(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(show_id, category_id, user_id)
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist_select_own" ON waitlist;
CREATE POLICY "waitlist_select_own" ON waitlist FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM shows WHERE id = waitlist.show_id AND organiser_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "waitlist_insert_own" ON waitlist;
CREATE POLICY "waitlist_insert_own" ON waitlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "waitlist_update_own" ON waitlist;
CREATE POLICY "waitlist_update_own" ON waitlist FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "waitlist_delete_own" ON waitlist;
CREATE POLICY "waitlist_delete_own" ON waitlist FOR DELETE
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_seats_venue ON seats(venue_id);
CREATE INDEX IF NOT EXISTS idx_show_seats_show ON show_seats(show_id);
CREATE INDEX IF NOT EXISTS idx_show_seats_seat ON show_seats(seat_id);
CREATE INDEX IF NOT EXISTS idx_show_seats_status ON show_seats(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_show ON bookings(show_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_show_cat ON waitlist(show_id, category_id, status);
CREATE INDEX IF NOT EXISTS idx_shows_organiser ON shows(organiser_id);
CREATE INDEX IF NOT EXISTS idx_shows_venue ON shows(venue_id);
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(show_date);
CREATE INDEX IF NOT EXISTS idx_pricing_show ON show_category_pricing(show_id);

-- ============ TRIGGER: Auto-create profile on signup ============
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'customer'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============ TRIGGER: Auto-create show_seats when a show is created ============
CREATE OR REPLACE FUNCTION create_show_seats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO show_seats (show_id, seat_id, status)
  SELECT NEW.id, s.id, 'available'
  FROM seats s
  WHERE s.venue_id = NEW.venue_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_show_created ON shows;
CREATE TRIGGER on_show_created
  AFTER INSERT ON shows
  FOR EACH ROW EXECUTE FUNCTION create_show_seats();

-- ============ TRIGGER: Update updated_at on show_seats ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_show_seats_updated ON show_seats;
CREATE TRIGGER trg_show_seats_updated
  BEFORE UPDATE ON show_seats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
