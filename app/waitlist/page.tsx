'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Show, WaitlistEntry, SeatCategory } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Clock, Check, X, Loader2, ListOrdered, Calendar, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WaitlistWithDetails extends WaitlistEntry {
  shows?: Show;
  seat_categories?: SeatCategory;
}

export default function WaitlistPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [entries, setEntries] = useState<WaitlistWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('waitlist')
      .select(`
        *,
        shows (
          id, title, type, show_date, show_time
        ),
        seat_categories (
          id, name, color
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setEntries(data as WaitlistWithDetails[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }
      if (profile) {
        if (profile.role === 'admin') {
          router.push('/admin');
          return;
        }
        if (profile.role === 'organiser') {
          router.push('/organiser');
          return;
        }
      }
      fetchEntries();
    }
  }, [user, profile, authLoading, router, fetchEntries]);

  // Poll for offer status changes every 15 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchEntries, 15000);
    return () => clearInterval(interval);
  }, [user, fetchEntries]);

  const handleAcceptOffer = async (entryId: string) => {
    setAccepting(entryId);
    const { data, error } = await supabase.rpc('accept_waitlist_offer', { p_waitlist_id: entryId });

    if (error) {
      toast({
        title: 'Could not accept offer',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data?.success) {
      toast({
        title: 'Offer accepted!',
        description: 'A seat has been held for you. Complete your booking now.',
      });
      router.push(`/events/${data.show_id}`);
    }
    setAccepting(null);
    fetchEntries();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) return null;

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <ListOrdered className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p className="text-slate-500">You haven't joined any waitlists yet.</p>
        <p className="mt-1 text-sm text-slate-400">When an event is sold out, you can join the waitlist from its event page.</p>
        <Link href="/events" className="mt-4 inline-block text-amber-600 hover:underline">Browse events</Link>
      </div>
    );
  }

  const hasOffer = entries.some((e) => e.status === 'offered');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">My Waitlist</h1>

      {hasOffer && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <Bell className="h-5 w-5" />
            <span className="font-medium">You have a seat offer!</span>
          </div>
          <p className="mt-1 text-sm text-amber-700">
            Accept the offer below before it expires. You'll have 10 minutes to complete your booking.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {entries.map((entry) => {
          const isOffered = entry.status === 'offered';
          const isExpired = entry.status === 'expired';
          const isFulfilled = entry.status === 'fulfilled';
          const offerExpiringSoon = isOffered && entry.offer_expires_at && new Date(entry.offer_expires_at).getTime() - Date.now() < 120000;

          return (
            <div
              key={entry.id}
              className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                isOffered
                  ? offerExpiringSoon
                    ? 'border-rose-300 bg-rose-50'
                    : 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {entry.shows?.title || 'Unknown Event'}
                    </h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      entry.status === 'waiting' ? 'bg-slate-100 text-slate-600'
                      : isOffered ? 'bg-amber-200 text-amber-800'
                      : isExpired ? 'bg-rose-100 text-rose-600'
                      : isFulfilled ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                    }`}>
                      {entry.status === 'waiting' ? `Position #${entry.position}`
                      : isOffered ? 'Seat Offered!'
                      : isExpired ? 'Expired'
                      : isFulfilled ? 'Fulfilled'
                      : entry.status}
                    </span>
                  </div>
                  {entry.shows && (
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(entry.shows.show_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {entry.shows.show_time}
                      </span>
                    </div>
                  )}
                  {entry.seat_categories && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.seat_categories.color }} />
                      <span className="text-slate-600">{entry.seat_categories.name}</span>
                    </div>
                  )}
                  {isOffered && entry.offer_expires_at && (
                    <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      offerExpiringSoon ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <Clock className="h-4 w-4" />
                      Offer expires in {Math.max(0, Math.floor((new Date(entry.offer_expires_at).getTime() - Date.now()) / 1000 / 60))} min
                    </div>
                  )}
                </div>

                {isOffered && (
                  <button
                    onClick={() => handleAcceptOffer(entry.id)}
                    disabled={accepting === entry.id}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    {accepting === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {accepting === entry.id ? 'Accepting...' : 'Accept Offer'}
                  </button>
                )}
                {entry.status === 'waiting' && (
                  <span className="text-sm text-slate-400">Waiting for a seat...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
