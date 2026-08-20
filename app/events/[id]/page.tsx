'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Show, Venue, ShowSeat } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ArrowLeft, Check, X, Lock, Loader2, Users, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [show, setShow] = useState<Show | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [seatMap, setSeatMap] = useState<ShowSeat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [holdTimeLeft, setHoldTimeLeft] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<{ reference: string } | null>(null);

  const fetchSeatMap = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_show_seat_map', { p_show_id: id });
    if (!error && data) {
      setSeatMap(data as ShowSeat[]);
    }
  }, [id]);

  useEffect(() => {
    const fetchShow = async () => {
      setLoading(true);
      const { data: showData } = await supabase
        .from('shows')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (showData) {
        setShow(showData as Show);
        const { data: venueData } = await supabase
          .from('venues')
          .select('*')
          .eq('id', showData.venue_id)
          .maybeSingle();
        if (venueData) setVenue(venueData as Venue);
      }
      await fetchSeatMap();
      setLoading(false);
    };
    fetchShow();
  }, [id, fetchSeatMap]);

  // Real-time subscription for seat updates
  useEffect(() => {
    const channel = supabase
      .channel(`show_seats:${id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'show_seats', filter: `show_id=eq.${id}` },
        () => { fetchSeatMap(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchSeatMap]);

  // Hold countdown timer
  useEffect(() => {
    if (!holdExpiry) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiry.getTime() - Date.now()) / 1000));
      setHoldTimeLeft(remaining);
      if (remaining <= 0) {
        setHoldExpiry(null);
        setSelectedSeats(new Set());
        setShowCheckout(false);
        fetchSeatMap();
        toast({
          title: 'Seat hold expired',
          description: 'Your held seats have been released.',
          variant: 'destructive',
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiry, fetchSeatMap, toast]);

  const toggleSeat = (seat: ShowSeat) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'held' && seat.hold_expires_at) {
      // Could be held by this user or someone else
      // We don't expose held_by to the client for privacy, so we treat all held as unavailable
      return;
    }
    const newSelection = new Set(selectedSeats);
    if (newSelection.has(seat.show_seat_id)) {
      newSelection.delete(seat.show_seat_id);
    } else {
      newSelection.add(seat.show_seat_id);
    }
    setSelectedSeats(newSelection);
  };

  const handleHoldSeats = async () => {
    if (!user) {
      toast({ title: 'Please sign in to book seats', variant: 'destructive' });
      router.push('/auth/sign-in');
      return;
    }
    setActionLoading(true);
    const seatIds = Array.from(selectedSeats);
    const { data, error } = await supabase.rpc('hold_seats', {
      p_show_id: id,
      p_seat_ids: seatIds,
    });

    if (error) {
      toast({
        title: 'Could not hold seats',
        description: error.message,
        variant: 'destructive',
      });
      setActionLoading(false);
      return;
    }

    if (data?.success) {
      setHoldExpiry(new Date(Date.now() + 10 * 60 * 1000));
      setShowCheckout(true);
      await fetchSeatMap();
      toast({
        title: 'Seats held for 10 minutes',
        description: 'Complete your checkout before the timer runs out.',
      });
    }
    setActionLoading(false);
  };

  const handleConfirmBooking = async () => {
    setActionLoading(true);
    const seatIds = Array.from(selectedSeats);
    const totalAmount = selectedSeatsData.reduce((sum, s) => sum + (s.price || 0), 0);

    const { data, error } = await supabase.rpc('confirm_booking', {
      p_show_id: id,
      p_seat_ids: seatIds,
      p_total_amount: totalAmount,
    });

    if (error) {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
      setActionLoading(false);
      return;
    }

    if (data?.success) {
      setBookingConfirmed({ reference: data.reference_code });
      setSelectedSeats(new Set());
      setHoldExpiry(null);
      setShowCheckout(false);
      await fetchSeatMap();
      toast({
        title: 'Booking confirmed!',
        description: `Your reference code is ${data.reference_code}`,
      });
    }
    setActionLoading(false);
  };

  const handleReleaseHold = async () => {
    const seatIds = Array.from(selectedSeats);
    await supabase.rpc('release_hold', { p_show_id: id, p_seat_ids: seatIds });
    setSelectedSeats(new Set());
    setHoldExpiry(null);
    setShowCheckout(false);
    await fetchSeatMap();
    toast({ title: 'Seats released' });
  };

  const selectedSeatsData = seatMap.filter((s) => selectedSeats.has(s.show_seat_id));
  const totalAmount = selectedSeatsData.reduce((sum, s) => sum + (s.price || 0), 0);

  // Group seats by row for rendering
  const seatsByRow = seatMap.reduce((acc, seat) => {
    if (!acc[seat.seat_row]) acc[seat.seat_row] = [];
    acc[seat.seat_row].push(seat);
    return acc;
  }, {} as Record<string, ShowSeat[]>);

  const rows = Object.keys(seatsByRow).sort();
  const categories = Array.from(new Set(seatMap.filter(s => s.category_name).map(s => ({ name: s.category_name!, color: s.category_color! }))));

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-slate-500">Event not found.</p>
        <Link href="/events" className="mt-4 inline-block text-amber-600 hover:underline">Back to events</Link>
      </div>
    );
  }

  if (bookingConfirmed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Booking Confirmed!</h1>
        <p className="mt-2 text-slate-500">Your seats have been booked successfully.</p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center gap-3">
            <QrCode className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Reference Code</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tracking-wider text-slate-900">{bookingConfirmed.reference}</p>
          <p className="mt-4 text-sm text-slate-500">
            A confirmation email with your QR code ticket has been sent to your registered email.
            Present the QR code at the venue entrance.
          </p>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/bookings" className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white">View My Bookings</Link>
          <Link href="/events" className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600">Browse More Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/events" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      {/* Event Header */}
      <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row">
        <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 sm:w-48">
          {show.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={show.poster_url} alt={show.title} className="h-full w-full object-cover" />
          ) : (
            show.type === 'movie' ? <Film className="h-10 w-10 text-slate-600" /> : <Music className="h-10 w-10 text-slate-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              show.type === 'movie' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {show.type === 'movie' ? 'Movie' : 'Concert'}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{show.title}</h1>
          {show.description && <p className="mt-2 text-slate-500">{show.description}</p>}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              {new Date(show.show_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              {show.show_time}
            </span>
            {venue && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                {venue.name}, {venue.city}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Seat Map */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Select Your Seats</h2>
              {holdExpiry && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="font-mono text-sm font-semibold text-amber-700">
                    {Math.floor(holdTimeLeft / 60)}:{(holdTimeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="mb-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md border-2 border-emerald-400 bg-emerald-50" />
                <span className="text-slate-600">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-amber-400" />
                <span className="text-slate-600">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-slate-300" />
                <span className="text-slate-600">Held</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-rose-400" />
                <span className="text-slate-600">Booked</span>
              </div>
            </div>

            {/* Stage */}
            <div className="mb-6 flex justify-center">
              <div className="w-3/4 rounded-t-3xl bg-gradient-to-b from-slate-700 to-slate-800 py-3 text-center text-sm font-medium text-white">
                {show.type === 'concert' ? 'STAGE' : 'SCREEN'}
              </div>
            </div>

            {/* Seat Grid */}
            <div className="overflow-x-auto">
              <div className="mx-auto flex max-w-2xl flex-col items-center gap-2">
                {rows.map((row) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-medium text-slate-400">{row}</span>
                    <div className="flex gap-1.5">
                      {seatsByRow[row].map((seat) => {
                        const isSelected = selectedSeats.has(seat.show_seat_id);
                        const isAvailable = seat.status === 'available';
                        const isHeld = seat.status === 'held';
                        const isBooked = seat.status === 'booked';

                        return (
                          <button
                            key={seat.show_seat_id}
                            onClick={() => toggleSeat(seat)}
                            disabled={!isAvailable && !isSelected}
                            title={`Row ${seat.seat_row}, Seat ${seat.seat_number}${seat.category_name ? ` (${seat.category_name})` : ''}${seat.price ? ` - $${seat.price}` : ''}`}
                            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-amber-400 text-white scale-110 shadow-sm'
                                : isAvailable
                                ? 'border-2 border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105'
                                : isHeld
                                ? 'bg-slate-300 text-slate-400 cursor-not-allowed'
                                : 'bg-rose-400 text-white cursor-not-allowed'
                            }`}
                          >
                            {isBooked ? <X className="h-3 w-3" /> : isHeld ? <Lock className="h-3 w-3" /> : seat.seat_number}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-6 text-center text-xs font-medium text-slate-400">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category pricing */}
            {categories.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="mb-2 text-sm font-medium text-slate-700">Categories</h3>
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-600">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Booking Summary</h2>

            {selectedSeatsData.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500">Select seats from the map to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {selectedSeatsData.map((seat) => (
                    <div key={seat.show_seat_id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Row {seat.seat_row}, Seat {seat.seat_number}</span>
                        {seat.category_name && (
                          <span className="ml-2 text-xs text-slate-400">{seat.category_name}</span>
                        )}
                      </div>
                      <span className="font-medium text-slate-700">${seat.price?.toFixed(2) || '0.00'}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
                </div>

                {showCheckout ? (
                  <div className="mt-4 space-y-2">
                    {holdExpiry && (
                      <div className="rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
                        <Clock className="mr-1 inline h-4 w-4" />
                        Hold expires in {Math.floor(holdTimeLeft / 60)}:{(holdTimeLeft % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    <button
                      onClick={handleConfirmBooking}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {actionLoading ? 'Processing...' : 'Confirm Booking'}
                    </button>
                    <button
                      onClick={handleReleaseHold}
                      disabled={actionLoading}
                      className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Release Seats
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleHoldSeats}
                    disabled={actionLoading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    {actionLoading ? 'Holding seats...' : 'Hold Seats (10 min)'}
                  </button>
                )}
              </>
            )}

            {!user && selectedSeatsData.length > 0 && (
              <p className="mt-4 text-center text-sm text-slate-500">
                Please <Link href="/auth/sign-in" className="text-amber-600 hover:underline">sign in</Link> to book seats
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Film({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function Music({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
