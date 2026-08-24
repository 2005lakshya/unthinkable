# Unthinkable Seat Booking Platform

A high-performance, concurrent seat booking platform built with Next.js, Supabase, and Postgres. It features real-time seat reservations, TTL-based holds, and an automated, queue-based waitlist system.

## Live Demo
Hosted Application URL: **[https://unthinkable.lakshya05.dev](https://unthinkable.lakshya05.dev)**

**Demo Admin Credentials:**
- **Email:** `admin1@gmail.com`
- **Password:** `admin1`
(Use these to access the admin dashboard on the live website).

## Setup Guide

### 1. Prerequisites
- Node.js (v18+)
- Supabase CLI installed (`npm i -g supabase`)
- A Supabase Project
- A Resend Account (for transactional emails)

### 2. Environment Variables
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the variables with your Supabase project keys and Resend API key.

### 3. Database Setup
Link your Supabase CLI to your project:
```bash
supabase link --project-ref your-project-ref
```

Push the database schema, functions, and triggers:
```bash
supabase db push
```

Set your Resend secrets for the Edge Functions:
```bash
supabase secrets set RESEND_API_KEY=your-resend-api-key RESEND_FROM_EMAIL="BookSeat <tickets@your-domain.com>"
```

Deploy all background Edge Functions (used for ticket delivery, waitlist emails, etc.):
```bash
supabase functions deploy
```

### 4. Run Locally
Install dependencies and run the development server:
```bash
npm install
npm run dev
```

## Database Schema Overview

- **`shows`**: Represents the events/performances available for booking.
- **`seat_categories`**: Defines categories (VIP, Premium, Normal) and their pricing/colors.
- **`seats`**: The physical, immutable seats in the venue mapped to categories.
- **`show_seats`**: The state of a seat for a specific show (`available`, `held`, `booked`). It includes `hold_expires_at` and `held_by` to manage TTL locks.
- **`bookings`** & **`booking_seats`**: Records finalized purchases and maps them to `show_seats`.
- **`waitlist`**: Tracks users waiting for sold-out categories. It maintains `position`, `status` (`waiting`, `offered`, `fulfilled`, `expired`), and tracks ticket quantity requests by assigning one row per requested ticket.

## API Documentation (Supabase RPCs)

The platform relies on Supabase Postgres Functions (RPCs) to handle complex transactions securely.

- **`get_show_seat_map(p_show_id)`**: Returns a JSON array of all seats, their status, pricing, category, and ownership flags.
- **`hold_seats(p_show_id, p_seat_ids)`**: Attempts to lock a given array of seats for 10 minutes. Throws an exception if any seat is already held or booked.
- **`release_hold(p_show_id, p_seat_ids)`**: Releases a user's temporary hold on specific seats (array of IDs), returning them to `available`.
- **`confirm_booking(p_show_id, p_seat_ids, p_total_amount)`**: Converts `held` seats into finalized `booked` status. Generates a booking reference code.
- **`cancel_booking(p_booking_id)`**: Cancels a booking, marks seats as `available`, and instantly triggers the waitlist processor for each freed seat.
- **`join_waitlist(p_show_id, p_category_id, p_quantity)`**: Inserts the user into the waitlist queue `p_quantity` times, ensuring they receive the exact number of consecutive seat offers when seats free up.
- **`accept_waitlist_offer(p_waitlist_id)`**: Converts a valid `offered` waitlist entry into a `fulfilled` entry and secures a fresh 10-minute hold on the offered seat so the user can check out.

## Logic Explanations

### Seat Hold Logic
To prevent double-booking, the app uses a temporary locking mechanism:
1. When a user clicks a seat, `hold_seats` updates the `show_seats` row to `status = 'held'` and sets `hold_expires_at = now() + 10 mins`.
2. Other users see this seat as locked/grayed out via real-time Postgres changes.
3. If the user completes the checkout within 10 minutes, `book_held_seats` finalizes it.
4. If they don't, a pg_cron job (`expire_waitlist_offers`) or the next seat map fetch treats expired holds as implicitly `available`.

### Waitlist Logic
When an event category is fully sold out, users can join a waitlist:
1. Users specify how many tickets they want (`ticketQuantity`). The system inserts one row per ticket into the `waitlist` table to enforce granular, seat-by-seat queue progression.
2. When a booking is cancelled (`cancel_booking`), the system loops over the freed seats.
3. For each freed seat, `process_waitlist_for_seat` queries the `waitlist` table using `FOR UPDATE SKIP LOCKED` to safely grab the next person in line.
4. The seat is instantly `held` for the waitlisted user, and their waitlist status becomes `offered`. This triggers a real-time Postgres change that highlights the specific seat as "yours" on the map (`is_mine` flag).
5. An edge function emails them a time-limited (10 min) link to claim their seat. 
6. On the frontend, a live ticking MM:SS countdown visually enforces the urgency of the offer.

**Waitlist Opt-Out**: Users can cancel their waitlist at any time. To prevent partial cancellations on the event page, the cancellation function batch-deletes all of the user's waiting entries for that specific category at once. On the dedicated `/waitlist` dashboard, users have granular control to cancel individual tickets if they wish to keep a portion of their request.

### Ticket Delivery and QR Codes
Upon a successful booking (`confirm_booking` RPC), the system generates a unique booking reference. The frontend then automatically triggers the `/api/send-ticket-email` endpoint.
1. The endpoint queries the database for the finalized booking details and seat map coordinates.
2. It generates a unique QR code payload representing the ticket (which can be scanned at the venue door).
3. It bundles the QR code, event details, and seat information into a styled HTML email and sends it directly to the user's registered inbox via Resend.
