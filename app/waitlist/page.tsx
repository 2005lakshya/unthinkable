'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Show, WaitlistEntry, SeatCategory } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Clock, Check, X, Loader2, ListOrdered, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GridPlusBackground } from '@/components/landing/Grid';
import { ruigslay, nostromoMedium, t012 } from '@/app/fonts';

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
  const [now, setNow] = useState(Date.now());

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
        router.push('/auth/sign-in?role=customer');
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

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const [cancelling, setCancelling] = useState<string | null>(null);

  const handleCancelWaitlist = async (entryId: string) => {
    setCancelling(entryId);
    const { error } = await supabase.from('waitlist').delete().eq('id', entryId);
    if (error) {
      toast({
        title: 'Could not cancel waitlist',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Waitlist entry cancelled',
      });
      fetchEntries();
    }
    setCancelling(null);
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen w-full bg-[#D5D1BE] flex items-center justify-center relative overflow-hidden">
        <GridPlusBackground>
          <Loader2 className="h-12 w-12 animate-spin text-black relative z-10" />
        </GridPlusBackground>
      </main>
    );
  }

  if (!user) return null;

  if (entries.length === 0) {
    return (
      <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-hidden">
        <GridPlusBackground>
          <div className="mx-auto max-w-7xl px-4 py-12 text-center relative z-10">
            <div className="border-4 border-black bg-white shadow-[12px_12px_0_0_#000] p-16">
              <ListOrdered className="mx-auto mb-6 h-16 w-16 text-black" />
              <h2 className={`text-4xl font-black text-black uppercase ${t012.className}`}>NO WAITLISTS</h2>
              <p className={`mt-4 font-bold text-black border-l-4 border-black pl-4 bg-black/5 p-2 inline-block`}>
                When an event is sold out, you can join the waitlist from its event page.
              </p>
              <br />
              <Link href="/events" className={`mt-8 inline-block border-4 border-black bg-[#EF6400] px-6 py-3 text-black font-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}>
                BROWSE EVENTS
              </Link>
            </div>
          </div>
        </GridPlusBackground>
      </main>
    );
  }

  const hasOffer = entries.some((e) => e.status === 'offered');

  return (
    <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-hidden">
      <GridPlusBackground>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          <Link href="/events" className={`mb-8 inline-flex items-center gap-2 border-4 border-black bg-white px-4 py-2 font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}>
            <ArrowLeft className="h-5 w-5" />
            BACK TO EVENTS
          </Link>

          <div className="mb-12 border-4 border-black bg-[#c0a9fa] shadow-[12px_12px_0_0_#000] p-8">
            <h1 className={`text-4xl md:text-5xl font-black text-black uppercase ${t012.className}`}>MY WAITLIST</h1>
            <p className={`mt-2 text-black font-bold uppercase ${nostromoMedium.className}`}>TRACK YOUR SPOTS IN LINE</p>
          </div>

          {hasOffer && (
            <div className="mb-12 border-4 border-black bg-[#4ade80] shadow-[8px_8px_0_0_#000] p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <Bell className="h-8 w-8 text-black" />
                <span className={`text-2xl font-black uppercase text-black ${t012.className}`}>YOU HAVE A SEAT OFFER!</span>
              </div>
              <p className="font-bold text-black uppercase border-l-4 border-black pl-4 bg-white/50 py-2">
                Accept the offer below before it expires!
              </p>
            </div>
          )}

          <div className="space-y-6 pb-20">
            {entries.map((entry) => {
              const isOffered = entry.status === 'offered';
              const isExpired = entry.status === 'expired';
              const isFulfilled = entry.status === 'fulfilled';
              const offerExpiringSoon = isOffered && entry.offer_expires_at && new Date(entry.offer_expires_at).getTime() - now < 120000;

              return (
                <div
                  key={entry.id}
                  className={`flex flex-col md:flex-row border-4 border-black p-6 transition-all ${
                    isOffered
                      ? offerExpiringSoon
                        ? 'bg-rose-400 shadow-[8px_8px_0_0_#000] animate-pulse'
                        : 'bg-[#fcd34d] shadow-[8px_8px_0_0_#000]'
                      : 'bg-white shadow-[8px_8px_0_0_#000]'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h3 className={`text-2xl md:text-3xl font-black text-black uppercase ${t012.className}`}>
                        {entry.shows?.title || 'Unknown Event'}
                      </h3>
                      
                      <span className={`border-2 border-black px-3 py-1 text-sm font-black text-black uppercase ${nostromoMedium.className} ${
                        entry.status === 'waiting' ? 'bg-slate-200'
                        : isOffered ? 'bg-[#4ade80]'
                        : isExpired ? 'bg-rose-500 text-black'
                        : isFulfilled ? 'bg-[#c0a9fa]'
                        : 'bg-slate-200'
                      }`}>
                        {entry.status === 'waiting' ? `POSITION #${entry.position}`
                        : isOffered ? 'SEAT OFFERED!'
                        : isExpired ? 'EXPIRED'
                        : isFulfilled ? 'FULFILLED'
                        : entry.status}
                      </span>
                    </div>

                    {entry.shows && (
                      <div className="flex flex-wrap gap-4 mb-4">
                        <span className={`flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black ${nostromoMedium.className}`}>
                          <Calendar className="h-4 w-4" />
                          {new Date(entry.shows.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className={`flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase text-black ${nostromoMedium.className}`}>
                          <Clock className="h-4 w-4" />
                          {entry.shows.show_time}
                        </span>
                      </div>
                    )}

                    {entry.seat_categories && (
                      <div className={`flex items-center gap-2 text-sm font-black uppercase text-black ${nostromoMedium.className}`}>
                        <div className="h-4 w-4 border-2 border-black" style={{ backgroundColor: entry.seat_categories.color }} />
                        {entry.seat_categories.name} CATEGORY
                      </div>
                    )}

                    {isOffered && entry.offer_expires_at && (
                      <div className={`mt-4 inline-flex items-center gap-2 border-2 border-black px-4 py-2 font-black uppercase text-black ${
                        offerExpiringSoon ? 'bg-rose-500 animate-pulse' : 'bg-white'
                      }`}>
                        <Clock className="h-5 w-5" />
                        EXPIRES IN {
                          Math.max(0, Math.floor((new Date(entry.offer_expires_at).getTime() - now) / 1000 / 60))
                        }M {
                          Math.max(0, Math.floor(((new Date(entry.offer_expires_at).getTime() - now) / 1000) % 60)).toString().padStart(2, '0')
                        }S
                      </div>
                    )}
                  </div>

                  <div className="mt-6 md:mt-0 md:ml-6 flex items-center">
                    {isOffered && (
                      <button
                        onClick={() => handleAcceptOffer(entry.id)}
                        disabled={accepting === entry.id}
                        className={`w-full md:w-auto flex items-center justify-center gap-2 border-4 border-black bg-black text-white px-8 py-4 font-black uppercase hover:bg-white hover:text-black transition-all disabled:opacity-50 ${nostromoMedium.className}`}
                      >
                        {accepting === entry.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                        {accepting === entry.id ? 'ACCEPTING...' : 'ACCEPT OFFER'}
                      </button>
                    )}
                    {entry.status === 'waiting' && (
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className={`w-full text-center border-4 border-dashed border-slate-300 p-4 font-black uppercase text-slate-400 ${nostromoMedium.className}`}>
                          WAITING FOR A SEAT...
                        </div>
                        <button
                          onClick={() => handleCancelWaitlist(entry.id)}
                          disabled={cancelling === entry.id}
                          className={`w-full flex items-center justify-center gap-2 border-2 border-black bg-white text-black px-4 py-2 text-sm font-black uppercase hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50 ${nostromoMedium.className}`}
                        >
                          {cancelling === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          {cancelling === entry.id ? 'CANCELLING...' : 'OPT OUT'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GridPlusBackground>
    </main>
  );
}
