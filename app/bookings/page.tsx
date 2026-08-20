'use client';

import { useEffect, useState } from 'react';
import { supabase, Booking, Show } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Calendar, Clock, QrCode, X, Loader2, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BookingWithShow extends Booking {
  shows?: Show;
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }
    fetchBookings();
  }, [user, authLoading]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        shows (
          id, title, type, show_date, show_time, venue_id
        )
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBookings(data as BookingWithShow[]);
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const { error } = await supabase.rpc('cancel_booking', { p_booking_id: cancelTarget });
    if (error) {
      toast({
        title: 'Cancellation failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Booking cancelled',
        description: 'Your seats have been released. Waitlisted customers will be notified.',
      });
      setCancelTarget(null);
      fetchBookings();
    }
    setCancelling(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p className="text-slate-500">Please sign in to view your bookings.</p>
        <Link href="/auth/sign-in" className="mt-4 inline-block text-amber-600 hover:underline">Sign in</Link>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <Ticket className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p className="text-slate-500">You have no bookings yet.</p>
        <Link href="/events" className="mt-4 inline-block text-amber-600 hover:underline">Browse events</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">My Bookings</h1>
      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className={`rounded-2xl border p-5 shadow-sm ${
              booking.status === 'cancelled'
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {booking.shows?.title || 'Unknown Event'}
                  </h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    booking.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : booking.status === 'cancelled'
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confirmed' : booking.status === 'cancelled' ? 'Cancelled' : 'Waitlist Offered'}
                  </span>
                </div>
                {booking.shows && (
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(booking.shows.show_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {booking.shows.show_time}
                    </span>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
                    <QrCode className="h-4 w-4 text-slate-400" />
                    <span className="font-mono text-sm font-medium text-slate-700">{booking.reference_code}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">${booking.total_amount.toFixed(2)}</span>
                </div>
              </div>
              {booking.status === 'confirmed' && (
                <Button
                  variant="outline"
                  onClick={() => setCancelTarget(booking.id)}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              This will release your seats and offer them to the next person on the waitlist.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Booking</Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
