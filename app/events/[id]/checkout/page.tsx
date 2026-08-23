'use client';

export const runtime = 'edge';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, Show, Venue, ShowSeat } from '@/lib/supabase/client';
import { GridPlusBackground } from '@/components/landing/Grid';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Clock, Loader2, QrCode as QrCodeIcon } from 'lucide-react';
import QRCode from 'react-qr-code';
import { ruigslay, nostromoMedium, t012 } from '@/app/fonts';
import Link from 'next/link';

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const id = params.id;
  
  const searchParams = useSearchParams();
  const seatsParam = searchParams.get('seats');
  const seatIds = seatsParam ? seatsParam.split(',') : [];

  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [show, setShow] = useState<Show | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [selectedSeatsData, setSelectedSeatsData] = useState<ShowSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [holdTimeLeft, setHoldTimeLeft] = useState(600);
  const [bookingConfirmed, setBookingConfirmed] = useState<{ reference: string } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/sign-in?role=customer');
      return;
    }
    
    if (seatIds.length === 0) {
      toast({ title: 'No seats selected', variant: 'destructive' });
      router.push(`/events/${id}`);
      return;
    }

    const fetchData = async () => {
      // Fetch show and venue
      const { data: showData } = await supabase
        .from('shows')
        .select('*, venues(*)')
        .eq('id', id)
        .single();

      if (showData) {
        setShow(showData);
        setVenue(showData.venues);
      }

      // Fetch held seats for user
      const { data: seatsData } = await supabase.rpc('get_show_seat_map', { p_show_id: id });
      
      if (seatsData) {
        // Find seats that match our IDs and are currently held
        const myHeldSeats = seatsData.filter(
          (s: any) => seatIds.includes(s.seat_id) && s.status === 'held'
        );
        
        if (myHeldSeats.length === 0 && !bookingConfirmed) {
           // Hold expired or stolen
           toast({ title: 'Hold expired', description: 'Your seat hold has expired or is invalid.', variant: 'destructive' });
           router.push(`/events/${id}`);
           return;
        }
        
        // We know the seats are held, let's assume the hold was placed just now or soon.
        // Supabase function `hold_seats` doesn't return the exact expiry time to the client cleanly.
        // We will just start a 10m timer from page load (acceptable for this demo).
        setHoldExpiry(new Date(Date.now() + 10 * 60 * 1000));
        setSelectedSeatsData(myHeldSeats);
      }
      setLoading(false);
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, router, toast]);

  useEffect(() => {
    if (!holdExpiry || bookingConfirmed) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiry.getTime() - Date.now()) / 1000));
      setHoldTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        toast({ title: 'Hold Expired', description: 'Your seats have been released.', variant: 'destructive' });
        router.push(`/events/${id}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpiry, bookingConfirmed, router, id, toast]);

  const handleConfirmBooking = async () => {
    setActionLoading(true);
    const totalAmount = selectedSeatsData.reduce((sum, s) => sum + (s.price || 0), 0);
    const validSeatIds = selectedSeatsData.map(s => s.seat_id);

    const { data, error } = await supabase.rpc('confirm_booking', {
      p_show_id: id,
      p_seat_ids: validSeatIds,
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
      try {
        const response = await fetch(`/api/send-ticket-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: data.booking_id,
            email: user?.email,
            reference_code: data.reference_code,
            show_title: show?.title,
            show_date: show ? new Date(show.show_date).toLocaleDateString() : '',
            show_time: show?.show_time,
            venue_name: venue?.name,
            seats: selectedSeatsData.map((s) => `Row ${s.seat_row} Seat ${s.seat_number}`),
          }),
        });
        if (!response.ok) console.error('Email send failed');
      } catch (e) {
        console.error('Email send error:', e);
      }

      setBookingConfirmed({ reference: data.reference_code });
      setHoldExpiry(null);
      toast({
        title: 'Booking confirmed!',
        description: `Your reference code is ${data.reference_code}`,
      });
    }
    setActionLoading(false);
  };

  const handleReleaseHold = async () => {
    setActionLoading(true);
    const validSeatIds = selectedSeatsData.map(s => s.seat_id);
    await supabase.rpc('release_hold', { p_show_id: id, p_seat_ids: validSeatIds });
    toast({ title: 'Seats released' });
    router.push(`/events/${id}`);
  };

  if (loading) return <div className="min-h-screen bg-[#D5D1BE] flex items-center justify-center font-bold uppercase text-2xl border-8 border-black">Loading Checkout...</div>;

  const totalAmount = selectedSeatsData.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <main className="min-h-screen bg-[#D5D1BE]">
      <GridPlusBackground>
        <div className="mx-auto max-w-3xl px-4 py-8">
          
          <Link href={`/events/${id}`} className="inline-flex items-center gap-2 mb-8 border-b-4 border-black pb-1 font-bold uppercase text-black hover:text-[#EF6400] transition-colors">
            <ArrowLeft className="h-5 w-5" />
            BACK TO SEAT MAP
          </Link>

          {!bookingConfirmed ? (
            <div className="border-4 border-black bg-white p-6 md:p-8 shadow-[12px_12px_0_0_#000]">
              <h1 className={`mb-8 border-b-8 border-black pb-4 text-4xl md:text-5xl font-black text-black uppercase ${t012.className}`}>CHECKOUT</h1>
              
              <div className="mb-8 p-4 border-4 border-black bg-[#f8fafc] shadow-[4px_4px_0_0_#000]">
                <h2 className={`mb-2 text-2xl font-black uppercase text-[#EF6400] ${t012.className}`}>{show?.title}</h2>
                <p className={`font-bold uppercase text-black/70 ${nostromoMedium.className}`}>
                  {show && new Date(show.show_date).toLocaleDateString()} @ {show?.show_time}
                </p>
                <p className={`mt-1 font-bold uppercase text-black ${nostromoMedium.className}`}>{venue?.name}</p>
              </div>

              <div className="mb-8">
                <h3 className={`mb-4 text-xl font-black text-black uppercase ${nostromoMedium.className}`}>YOUR SEATS</h3>
                <div className="space-y-4">
                  {selectedSeatsData.map((seat) => (
                    <div key={seat.show_seat_id} className="flex flex-col border-2 border-black bg-white p-3 shadow-[2px_2px_0_0_#000]">
                      <div className="flex justify-between items-start">
                        <span className={`font-black text-black text-lg ${nostromoMedium.className}`}>ROW {seat.seat_row}, SEAT {seat.seat_number}</span>
                        <span className={`font-black text-black text-lg ${nostromoMedium.className}`}>${seat.price?.toFixed(2) || '0.00'}</span>
                      </div>
                      {seat.category_name && (
                        <span className="mt-1 text-xs font-bold uppercase text-black/60 bg-black/5 self-start px-2 py-0.5 border border-black/20">{seat.category_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-4 border-black bg-[#fcd34d] p-6 shadow-[8px_8px_0_0_#000]">
                <span className={`text-2xl font-black text-black ${nostromoMedium.className}`}>TOTAL</span>
                <span className={`text-5xl font-black text-black ${ruigslay.className}`}>${totalAmount.toFixed(2)}</span>
              </div>

              <div className="space-y-4">
                {holdExpiry && (
                  <div className="border-4 border-black bg-[#EF6400] px-4 py-3 text-center font-black text-black uppercase shadow-[4px_4px_0_0_#000]">
                    <Clock className="mr-2 inline h-5 w-5" />
                    HOLD EXPIRES IN {Math.floor(holdTimeLeft / 60)}:{(holdTimeLeft % 60).toString().padStart(2, '0')}
                  </div>
                )}
                <button
                  onClick={handleConfirmBooking}
                  disabled={actionLoading}
                  className={`flex w-full items-center justify-center gap-2 border-4 border-black bg-[#4ade80] py-6 text-2xl font-black text-black uppercase shadow-[8px_8px_0_0_#000] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[8px_8px_0_0_#000] ${nostromoMedium.className}`}
                >
                  {actionLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Check className="h-8 w-8" />}
                  {actionLoading ? 'PROCESSING...' : 'CONFIRM BOOKING'}
                </button>
                <button
                  onClick={handleReleaseHold}
                  disabled={actionLoading}
                  className={`w-full border-4 border-black bg-white py-4 text-sm font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:bg-black hover:text-white transition-colors disabled:opacity-50 ${nostromoMedium.className}`}
                >
                  RELEASE SEATS & CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div className="border-4 border-black bg-white p-6 md:p-12 shadow-[12px_12px_0_0_#000] text-center">
              <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center border-4 border-black bg-[#4ade80] shadow-[8px_8px_0_0_#000] rounded-full">
                <Check className="h-12 w-12 text-black" />
              </div>
              <h1 className={`mb-4 text-4xl md:text-5xl font-black text-black uppercase ${t012.className}`}>YOU'RE GOING!</h1>
              <p className={`mb-8 text-xl font-bold uppercase text-black/70 ${nostromoMedium.className}`}>
                BOOKING CONFIRMED FOR {show?.title}
              </p>

              <div className="mx-auto max-w-sm mb-8 border-4 border-black bg-[#fcd34d] p-8 shadow-[8px_8px_0_0_#000]">
                <div className="mx-auto mb-6 flex justify-center border-4 border-black p-4 bg-white">
                  <QRCode value={bookingConfirmed.reference} size={180} />
                </div>
                <div className={`text-sm font-bold uppercase text-black/60 mb-2 ${nostromoMedium.className}`}>REFERENCE CODE</div>
                <div className={`text-4xl font-black text-black ${ruigslay.className}`}>{bookingConfirmed.reference}</div>
              </div>

              <div className="border-t-4 border-black pt-8">
                <p className={`font-bold uppercase text-black ${nostromoMedium.className}`}>
                  We've emailed your tickets to <span className="text-[#EF6400]">{user?.email}</span>.
                </p>
                <Link href="/events" className={`mt-8 inline-block border-4 border-black bg-black px-8 py-4 text-lg font-black text-white uppercase shadow-[4px_4px_0_0_#EF6400] hover:bg-white hover:text-black transition-colors ${nostromoMedium.className}`}>
                  BROWSE MORE EVENTS
                </Link>
              </div>
            </div>
          )}
        </div>
      </GridPlusBackground>
    </main>
  );
}
