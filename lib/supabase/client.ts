import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type UserRole = 'customer' | 'organiser' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  description: string | null;
  total_seats: number;
  created_at: string;
}

export interface SeatCategory {
  id: string;
  venue_id: string;
  name: string;
  price_modifier: number;
  color: string;
}

export interface Seat {
  id: string;
  venue_id: string;
  category_id: string | null;
  seat_row: string;
  seat_number: string;
  label: string | null;
}

export interface Show {
  id: string;
  title: string;
  description: string | null;
  type: 'movie' | 'concert';
  venue_id: string;
  organiser_id: string;
  show_date: string;
  show_time: string;
  poster_url: string | null;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
}

export interface ShowSeat {
  show_seat_id: string;
  seat_id: string;
  seat_row: string;
  seat_number: string;
  label: string | null;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  status: 'available' | 'held' | 'booked';
  price: number | null;
  hold_expires_at: string | null;
  is_mine?: boolean;
}

export interface Booking {
  id: string;
  reference_code: string;
  show_id: string;
  user_id: string;
  total_amount: number;
  status: 'confirmed' | 'cancelled' | 'waitlist_offered';
  qr_code_data: string | null;
  created_at: string;
  cancelled_at: string | null;
}

export interface WaitlistEntry {
  id: string;
  show_id: string;
  category_id: string;
  user_id: string;
  status: 'waiting' | 'offered' | 'expired' | 'fulfilled';
  position: number;
  offered_at: string | null;
  offer_expires_at: string | null;
  offered_show_seat_id: string | null;
  created_at: string;
}
