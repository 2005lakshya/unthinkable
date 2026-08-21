'use client';

import { useEffect, useState } from 'react';
import { supabase, Booking, Show } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, QrCode, X, Loader2, Ticket, ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GridPlusBackground } from '@/components/landing/Grid';
import { ruigslay, nostromoMedium, t012 } from '@/app/fonts';

interface BookingSeat {
  id: string;
  seat_label: string;
  price: number;
}

interface BookingWithShow extends Booking {
  shows?: Show;
  booking_seats?: BookingSeat[];
}

export default function BookingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        router.push('/auth/sign-in');
      }
      return;
    }
    if (profile) {
      if (profile.role === 'admin') { router.push('/admin'); return; }
      if (profile.role === 'organiser') { router.push('/organiser'); return; }
    }
    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        shows(id, title, type, show_date, show_time, venue_id),
        booking_seats(id, seat_label, price)
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setBookings(data as BookingWithShow[]);
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const { error } = await supabase.rpc('cancel_booking', { p_booking_id: cancelTarget });
    if (error) {
      toast({ title: 'Cancellation failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Booking cancelled', description: 'Your seats have been released.' });
      setCancelTarget(null);
      fetchBookings();
    }
    setCancelling(false);
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#D5D1BE] flex items-center justify-center">
        <GridPlusBackground>
          <Loader2 className="h-12 w-12 animate-spin text-black relative z-10" />
        </GridPlusBackground>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#D5D1BE]">
      <GridPlusBackground>
        <div className="mx-auto max-w-4xl px-4 py-8 relative z-10">
          <Link
            href="/events"
            className={`inline-flex items-center gap-2 mb-8 border-b-4 border-black pb-1 font-bold uppercase text-black hover:text-[#EF6400] transition-colors ${nostromoMedium.className}`}
          >
            <ArrowLeft className="h-5 w-5" />
            BACK TO EVENTS
          </Link>

          <h1 className={`mb-8 text-5xl md:text-6xl font-black text-black uppercase border-b-8 border-black pb-4 ${t012.className}`}>
            MY BOOKINGS
          </h1>

          {bookings.length === 0 ? (
            <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] p-16 text-center">
              <Ticket className="mx-auto mb-6 h-16 w-16 text-black/20" />
              <p className={`text-2xl font-black uppercase text-black/40 ${nostromoMedium.className}`}>
                NO BOOKINGS YET
              </p>
              <Link
                href="/events"
                className={`mt-8 inline-block border-4 border-black bg-[#EF6400] px-8 py-4 text-lg font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
              >
                BROWSE EVENTS
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`border-4 border-black p-6 shadow-[6px_6px_0_0_#000] ${
                    booking.status === 'cancelled' ? 'bg-black/10 opacity-70' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      {/* Status badge + title */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 className={`text-2xl font-black uppercase text-black ${t012.className}`}>
                          {booking.shows?.title || 'Unknown Event'}
                        </h3>
                        <span className={`border-2 border-black px-3 py-1 text-xs font-black uppercase ${
                          booking.status === 'confirmed'
                            ? 'bg-[#4ade80] text-black'
                            : booking.status === 'cancelled'
                            ? 'bg-black text-white'
                            : 'bg-[#EF6400] text-black'
                        } ${nostromoMedium.className}`}>
                          {booking.status === 'confirmed' ? '✓ CONFIRMED' : booking.status === 'cancelled' ? '✗ CANCELLED' : 'WAITLIST OFFERED'}
                        </span>
                      </div>

                      {/* Date/Time */}
                      {booking.shows && (
                        <div className={`flex flex-wrap gap-6 text-sm font-bold uppercase text-black/60 mb-4 ${nostromoMedium.className}`}>
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.shows.show_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {booking.shows.show_time}
                          </span>
                        </div>
                      )}

                      {/* Seats */}
                      {booking.booking_seats && booking.booking_seats.length > 0 && (
                        <div className="mb-4">
                          <p className={`text-xs font-black uppercase text-black/40 mb-2 ${nostromoMedium.className}`}>SEATS</p>
                          <div className="flex flex-wrap gap-2">
                            {booking.booking_seats.map((seat) => (
                              <span
                                key={seat.id}
                                className={`border-2 border-black bg-[#fcd34d] px-3 py-1 text-sm font-black uppercase text-black ${nostromoMedium.className}`}
                              >
                                {seat.seat_label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reference + Amount */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 border-2 border-black bg-[#D5D1BE] px-3 py-2">
                          <QrCode className="h-4 w-4 text-black" />
                          <span className={`font-mono text-sm font-black text-black tracking-widest ${ruigslay.className}`}>
                            {booking.reference_code}
                          </span>
                        </div>
                        <span className={`text-2xl font-black text-black ${ruigslay.className}`}>
                          ${booking.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Cancel button */}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => setCancelTarget(booking.id)}
                        className={`mt-2 sm:mt-0 flex items-center gap-2 border-4 border-black bg-white px-4 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:bg-black hover:text-white transition-colors ${nostromoMedium.className}`}
                      >
                        <X className="h-4 w-4" />
                        CANCEL
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GridPlusBackground>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="border-4 border-black bg-[#D5D1BE] shadow-[12px_12px_0_0_#000] p-8 max-w-md w-full mx-4">
            <h2 className={`text-3xl font-black uppercase text-black mb-4 ${t012.className}`}>CANCEL BOOKING?</h2>
            <p className={`font-bold uppercase text-black/70 mb-8 ${nostromoMedium.className}`}>
              This will permanently release your seats and offer them to the waitlist. This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className={`flex-1 border-4 border-black bg-white py-4 font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
              >
                KEEP IT
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className={`flex-1 border-4 border-black bg-black py-4 font-black uppercase text-white shadow-[4px_4px_0_0_#EF6400] hover:bg-[#EF6400] hover:text-black transition-colors disabled:opacity-50 ${nostromoMedium.className}`}
              >
                {cancelling ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'YES, CANCEL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
