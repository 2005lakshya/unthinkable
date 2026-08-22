# BookSeat - Ticket Booking Platform

BookSeat is a modern, brutalist-styled ticket booking platform for movies and concerts featuring real-time interactive seat maps, concurrent seat holds, and an automated waitlist system.

## Features

- **Interactive Visual Seat Maps:** Select exact seats using visual grids for various venues.
- **Real-Time Seat Holding:** Select seats and hold them for 10 minutes to prevent others from booking them while you check out. 
- **Automated Smart Waitlist:** If an event is sold out, join the waitlist. When a seat becomes available (e.g., via cancellation), it is automatically offered to the next person in line.
- **Robust Role-Based Access:** `customer`, `organiser`, and `admin` roles, secured by Supabase RLS.
- **Dashboard Management:** Admins can create venues and seat grids; Organisers can create and manage their events.

---

## Setup Guide

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- A [Supabase](https://supabase.com/) project

### 2. Environment Variables
Clone the repository and set up your environment variables:
```bash
cp .env.example .env
```
Fill out the variables in `.env` using your Supabase project credentials (found under Project Settings -> API and Database). You will also need a [Resend](https://resend.com/) API key to send ticket confirmation emails.

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
Ensure you have the Supabase CLI installed, or run the migrations manually via the Supabase Dashboard SQL Editor. The project uses migrations located in `supabase/migrations/` to construct the schema, row-level security (RLS) policies, and database functions.

Using Supabase CLI:
```bash
npx supabase db push
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

The database uses PostgreSQL (via Supabase) and is heavily secured using Row-Level Security (RLS). 

- `profiles`: Extends Supabase auth users with `role` (customer, organiser, admin).
- `venues`: Venues created by admins.
- `seat_categories`: Classifications for seats (e.g. VIP, Standard) with dynamic pricing modifiers.
- `seats`: Master table for individual seats mapped to a venue.
- `shows`: Events (movies or concerts) created by organisers.
- `show_seats`: The state of each seat for a specific show (`available`, `held`, `booked`).
- `bookings` & `booking_seats`: Confirmed tickets, prices paid, and generated reference codes.
- `waitlist`: Queue of users waiting for a seat in a specific category for a show.

---

## Core Logic: Seat Holds and Concurrency

To prevent two users from booking the same seat simultaneously (race conditions), BookSeat utilizes Postgres row-level locks and `SECURITY DEFINER` functions.

### Seat Hold Process (`hold_seats`)
1. When a user selects a seat and initiates checkout, the app calls the RPC `hold_seats`.
2. The database uses `SELECT ... FOR UPDATE` to lock the rows in the `show_seats` table.
3. If the seats are strictly `available`, their status is changed to `held`, they are tied to the user's `auth.uid()`, and a `hold_expires_at` timestamp is set (Current Time + 10 mins).
4. If a different user attempts to book the same seat at the exact same millisecond, the Postgres lock forces them to wait. Once the first transaction finishes, the second transaction sees the seat is now `held` and safely aborts.
5. If the user does not complete checkout within 10 minutes, a scheduled Postgres CRON job (`release_expired_holds`) automatically resets the status back to `available`.

### Booking Confirmation (`confirm_booking`)
1. Upon successful payment/checkout, `confirm_booking` is called.
2. The database verifies the user still holds the seats and the hold has not expired.
3. The seats are marked `booked`, a `bookings` record is generated with a unique reference ID, and the hold is released permanently.

---

## Core Logic: Automated Waitlist

When an event is sold out, users can join the waitlist for a specific seat category.

1. **Joining:** User calls `join_waitlist`, receiving a queue `position`.
2. **Triggering:** If someone cancels a booking via `cancel_booking`, the seats are freed. 
3. **Processing:** The system immediately invokes `process_waitlist_for_seat` for each freed seat.
   - The database queries the `waitlist` table for the next user waiting for that specific seat category.
   - It updates the waitlist status to `offered` and automatically places a 10-minute hold on the seat for that waitlisted user.
4. **Accepting:** The waitlisted user is notified and must call `accept_waitlist_offer` within 10 minutes to move to checkout. If they do not, `expire_waitlist_offers` will revoke the offer and pass the seat to the *next* person on the waitlist.

---

## API Documentation

BookSeat relies heavily on Supabase client-side queries and Remote Procedure Calls (RPC) to enforce security and logic on the database side. Direct table updates to `show_seats` from the client are denied via RLS.

### Key Supabase RPCs
- **`hold_seats(p_show_id, p_seat_ids[])`**
  - Attempts to hold multiple seats. Returns `success: true` or throws an error.
- **`confirm_booking(p_show_id, p_seat_ids[], p_total_amount)`**
  - Finalizes checkout. Returns `{ success: true, booking_id: "...", reference_code: "..." }`.
- **`cancel_booking(p_booking_id)`**
  - Cancels a booking, frees seats, and triggers the waitlist pipeline.
- **`join_waitlist(p_show_id, p_category_id)`**
  - Enters the waitlist for a specific category.
- **`accept_waitlist_offer(p_waitlist_id)`**
  - Converts an active waitlist offer into a checkout hold.
- **`get_show_seat_map(p_show_id)`**
  - Retrieves the entire visual layout of a show, including seat labels, coordinates, categories, and real-time status.

### Backend APIs (Next.js App Router)
- **`POST /api/send-ticket-email`**
  - Body: `{ email, name, bookingDetails }`
  - Purpose: Sends a digital ticket and receipt to the customer via Resend.
