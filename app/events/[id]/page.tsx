'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Show, Venue, ShowSeat } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, ArrowLeft, Check, X, Lock, Loader2, Users, QrCode, Bell, ListOrdered } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GridPlusBackground } from '@/components/landing/Grid';
import { ruigslay, nostromoMedium, t012 } from '@/app/fonts';
import BookingSummaryPanel from '@/components/BookingSummaryPanel';
interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  price: number | null;
  total: number;
  available: number;
  held: number;
  booked: number;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [show, setShow] = useState<Show | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [seatMap, setSeatMap] = useState<ShowSeat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [ticketQuantity, setTicketQuantity] = useState(2);
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<{ reference: string } | null>(null);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [userWaitlist, setUserWaitlist] = useState<{ category_id: string; position: number; status: string; offer_expires_at?: string }[]>([]);
  const [now, setNow] = useState(Date.now());

  const fetchSeatMap = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_show_seat_map', { p_show_id: id });
    if (!error && data) {
      const seats = data as ShowSeat[];
      setSeatMap(seats);
      
      // Clean up selectedSeats if any are no longer available or held by this user
      setSelectedSeats(prev => {
        const next = new Set(prev);
        let changed = false;

        // Auto-select seats that are held by the current user (e.g. from waitlist offer)
        for (const seat of seats) {
          if (seat.status === 'held' && seat.is_mine && !next.has(seat.seat_id)) {
            next.add(seat.seat_id);
            changed = true;
          }
        }

        for (const seatId of next) {
          const seat = seats.find(s => s.seat_id === seatId);
          // If the seat is gone, booked, or held by someone else (not 'available' or 'held' by me)
          if (!seat || (seat.status !== 'available' && !(seat.status === 'held' && seat.is_mine))) {
            next.delete(seatId);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [id]);

  const fetchUserWaitlist = useCallback(async () => {
    if (!user) {
      setUserWaitlist([]);
      return;
    }
    const { data } = await supabase
      .from('waitlist')
      .select('category_id, position, status, offer_expires_at')
      .eq('show_id', id)
      .eq('user_id', user.id)
      .in('status', ['waiting', 'offered']);
    if (data) setUserWaitlist(data as { category_id: string; position: number; status: string; offer_expires_at?: string }[]);
  }, [id, user]);

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

  useEffect(() => {
    fetchSeatMap();
    fetchUserWaitlist();
  }, [fetchSeatMap, fetchUserWaitlist]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role === 'admin') router.push('/admin');
      else if (profile.role === 'organiser') router.push('/organiser');
    }
  }, [profile, authLoading, router]);

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
  // handleHoldSeats has been moved or integrated into selectSeatBlock

  const handleReleaseHold = async () => {
    const seatIds = Array.from(selectedSeats);
    await supabase.rpc('release_hold', { p_show_id: id, p_seat_ids: seatIds });
    setSelectedSeats(new Set());
    await fetchSeatMap();
    toast({ title: 'Seats released' });
  };

  const handleJoinWaitlist = async (categoryId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to join the waitlist', variant: 'destructive' });
      router.push('/auth/sign-in?role=customer');
      return;
    }
    setJoiningWaitlist(true);
    const { data, error } = await supabase.rpc('join_waitlist', {
      p_show_id: id,
      p_category_id: categoryId,
      p_quantity: ticketQuantity,
    });

    if (error) {
      toast({
        title: 'Could not join waitlist',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data?.success) {
      toast({
        title: data.message || 'Added to waitlist!',
        description: data.quantity > 1 ? `You requested ${data.quantity} seats. You are in positions ${data.position} to ${data.position + data.quantity - 1}.` : `You are in position ${data.position}.`,
      });
      fetchUserWaitlist();
    }
    setJoiningWaitlist(false);
  };

  // Group seats by row for rendering
  const seatsByRow = seatMap.reduce((acc, seat) => {
    if (!acc[seat.seat_row]) acc[seat.seat_row] = [];
    acc[seat.seat_row].push(seat);
    return acc;
  }, {} as Record<string, ShowSeat[]>);

  // Sort seats in each row numerically to prevent '1, 10, 2' ordering
  Object.values(seatsByRow).forEach((rowSeats) => {
    rowSeats.sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true, sensitivity: 'base' }));
  });

  const rows = Object.keys(seatsByRow).sort();

  const getAdjacentSeatIds = (startSeatId: string) => {
    const startSeat = seatMap.find(s => s.seat_id === startSeatId);
    if (!startSeat) return [];
    
    if (startSeat.status !== 'available' && !(startSeat.status === 'held' && startSeat.is_mine) && !selectedSeats.has(startSeat.seat_id)) return [];

    const remainingToSelect = ticketQuantity - selectedSeats.size;
    if (remainingToSelect <= 0 && !selectedSeats.has(startSeat.seat_id)) return [];

    const rowSeats = seatsByRow[startSeat.seat_row] || [];
    const startIndex = rowSeats.findIndex(s => s.seat_id === startSeat.seat_id);
    if (startIndex === -1) return [];

    const result: string[] = [];
    // If it's already selected, just return itself (for deselection or hover)
    if (selectedSeats.has(startSeat.seat_id)) {
      return [startSeat.seat_id];
    }

    for (let i = startIndex; i < rowSeats.length && result.length < remainingToSelect; i++) {
      const s = rowSeats[i];
      if (s.status === 'available' || (s.status === 'held' && s.is_mine)) {
        result.push(s.seat_id);
      } else {
        break; // Stop contiguous block if we hit a booked/held seat
      }
    }
    return result;
  };

  const previewSeatIds = new Set(hoveredSeatId ? getAdjacentSeatIds(hoveredSeatId) : []);

  const selectSeatBlock = async (seat: ShowSeat) => {
    if (!user) {
      toast({ title: 'Please sign in to select seats', variant: 'destructive' });
      router.push('/auth/sign-in?role=customer');
      return;
    }

    if (actionLoading) return;

    if (selectedSeats.has(seat.seat_id)) {
      // Release just this seat
      setActionLoading(true);
      await supabase.rpc('release_hold', { p_show_id: id, p_seat_ids: [seat.seat_id] });
      const newSelected = new Set(selectedSeats);
      newSelected.delete(seat.seat_id);
      setSelectedSeats(newSelected);
      await fetchSeatMap();
      setActionLoading(false);
      return;
    }

    const remaining = ticketQuantity - selectedSeats.size;
    if (remaining <= 0) {
      toast({ title: `You can only select up to ${ticketQuantity} seats` });
      return;
    }

    const idsToSelect = getAdjacentSeatIds(seat.seat_id);
    if (idsToSelect.length > 0) {
      setActionLoading(true);

      const allIdsToHold = Array.from(selectedSeats).concat(idsToSelect);

      const { data, error } = await supabase.rpc('hold_seats', {
        p_show_id: id,
        p_seat_ids: allIdsToHold,
      });

      if (error) {
        toast({
          title: 'Could not hold seats',
          description: error.message,
          variant: 'destructive',
        });
        await fetchSeatMap();
      } else if (data?.success) {
        const newSelected = new Set(selectedSeats);
        idsToSelect.forEach(id => newSelected.add(id));
        setSelectedSeats(newSelected);
      }
      setActionLoading(false);
    }
  };

  // Compute per-category availability
  const categoryMap: Record<string, CategoryInfo> = {};
  seatMap.forEach((seat) => {
    const catId = seat.category_id || 'uncategorized';
    const catName = seat.category_name || 'General';
    const catColor = seat.category_color || '#6366f1';
    if (!categoryMap[catId]) {
      categoryMap[catId] = { id: catId, name: catName, color: catColor, price: seat.price, total: 0, available: 0, held: 0, booked: 0 };
    }
    categoryMap[catId].total++;
    if (seat.status === 'available') categoryMap[catId].available++;
    else if (seat.status === 'held') categoryMap[catId].held++;
    else if (seat.status === 'booked') categoryMap[catId].booked++;
  });
  const categoryList = Object.values(categoryMap);
  const allSoldOut = categoryList.length > 0 && categoryList.every((c) => c.available === 0);

  if (loading || authLoading) {
    return (
      <main className="min-h-screen w-full bg-[#D5D1BE] flex items-center justify-center relative overflow-x-hidden">
        <GridPlusBackground>
          <Loader2 className="h-12 w-12 animate-spin text-black relative z-10" />
        </GridPlusBackground>
      </main>
    );
  }

  if (!show) {
    return (
      <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-x-hidden">
        <GridPlusBackground>
          <div className="mx-auto max-w-7xl px-4 py-16 text-center relative z-10">
            <div className="border-4 border-black bg-white shadow-[12px_12px_0_0_#000] p-16">
              <p className={`text-4xl font-black text-black ${ruigslay.className}`}>EVENT NOT FOUND.</p>
              <Link href="/events" className={`mt-8 inline-block border-4 border-black bg-[#EF6400] px-6 py-3 text-black font-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}>
                BACK TO EVENTS
              </Link>
            </div>
          </div>
        </GridPlusBackground>
      </main>
    );
  }

  if (bookingConfirmed) {
    return (
      <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-x-hidden">
        <GridPlusBackground>
          <div className="mx-auto max-w-3xl px-4 py-16 relative z-10">
            <div className="border-4 border-black bg-white shadow-[16px_16px_0_0_#000] p-8 md:p-12">
              <div className="mb-8 border-b-4 border-black pb-8 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center border-4 border-black bg-[#4ade80] shadow-[4px_4px_0_0_#000]">
                  <Check className="h-12 w-12 text-black" />
                </div>
                <h1 className={`text-5xl font-black text-black uppercase ${t012.className}`}>BOOKING CONFIRMED!</h1>
                <p className={`mt-4 text-xl font-bold text-black/70 ${nostromoMedium.className}`}>YOUR SEATS HAVE BEEN SECURED.</p>
              </div>
              
              <div className="border-4 border-black bg-[#fcd34d] p-6 shadow-[8px_8px_0_0_#000] text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <QrCode className="h-6 w-6 text-black" />
                  <span className={`text-lg font-black uppercase text-black ${nostromoMedium.className}`}>REFERENCE CODE</span>
                </div>
                <p className={`mt-2 text-4xl font-black tracking-widest text-black ${ruigslay.className}`}>{bookingConfirmed.reference}</p>
              </div>
              
              <p className="mt-4 text-center font-bold text-black border-2 border-black p-4 bg-white/50">
                A CONFIRMATION EMAIL WITH YOUR QR CODE TICKET HAS BEEN SENT TO YOUR REGISTERED EMAIL. PRESENT THE QR CODE AT THE VENUE ENTRANCE.
              </p>
              
              <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/bookings" className={`border-4 border-black bg-[#c0a9fa] px-8 py-4 text-center font-black text-black uppercase shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}>
                  VIEW MY BOOKINGS
                </Link>
                <Link href="/events" className={`border-4 border-black bg-white px-8 py-4 text-center font-black text-black uppercase shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}>
                  BROWSE MORE EVENTS
                </Link>
              </div>
            </div>
          </div>
        </GridPlusBackground>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-x-hidden">
      <GridPlusBackground>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          <Link href="/events" className={`mb-8 inline-flex items-center gap-2 border-4 border-black bg-white px-4 py-2 font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}>
            <ArrowLeft className="h-5 w-5" />
            BACK TO EVENTS
          </Link>

          {/* Event Header */}
          <div className="mb-12 flex flex-col gap-0 border-4 border-black bg-white shadow-[12px_12px_0_0_#000] sm:flex-row">
            <div className="flex h-48 sm:h-auto sm:w-64 shrink-0 items-center justify-center border-b-4 sm:border-b-0 sm:border-r-4 border-black bg-black overflow-hidden relative">
              {show.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={show.poster_url} alt={show.title} className="h-full w-full object-cover opacity-90" />
              ) : (
                <div className="h-full w-full bg-[#c0a9fa] flex items-center justify-center">
                  {show.type === 'movie' ? <FilmIcon className="h-20 w-20 text-black" /> : <MusicIcon className="h-20 w-20 text-black" />}
                </div>
              )}
              <div className="absolute top-0 left-0 border-r-4 border-b-4 border-black">
                <span className={`inline-block px-4 py-2 text-sm font-black uppercase ${nostromoMedium.className} ${
                  show.type === 'movie' ? 'bg-[#3b82f6] text-white' : 'bg-[#f43f5e] text-white'
                }`}>
                  {show.type === 'movie' ? 'MOVIE' : 'CONCERT'}
                </span>
              </div>
            </div>
            
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
              <h1 className={`text-4xl md:text-6xl font-black text-black uppercase ${t012.className}`}>{show.title}</h1>
              {show.description && (
                <p className="mt-4 font-bold text-black border-l-4 border-black pl-4 bg-black/5 p-2">
                  {show.description}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-4">
                <span className={`flex items-center gap-2 border-2 border-black bg-[#fcd34d] px-4 py-2 text-sm font-black uppercase text-black shadow-[4px_4px_0_0_#000] ${nostromoMedium.className}`}>
                  <Calendar className="h-4 w-4" />
                  {new Date(show.show_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
                <span className={`flex items-center gap-2 border-2 border-black bg-[#A3E4D7] px-4 py-2 text-sm font-black uppercase text-black shadow-[4px_4px_0_0_#000] ${nostromoMedium.className}`}>
                  <Clock className="h-4 w-4" />
                  {show.show_time}
                </span>
                {venue && (
                  <span className={`flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase text-black shadow-[4px_4px_0_0_#000] ${nostromoMedium.className}`}>
                    <MapPin className="h-4 w-4" />
                    {venue.name}, {venue.city}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8 items-start">
            {/* Seat Map Area */}
            <div className={`transition-all duration-500 ${selectedSeats.size > 0 ? 'w-full xl:w-2/3' : 'w-full'}`}>
              <div className="border-4 border-black bg-white p-6 md:p-8 shadow-[12px_12px_0_0_#000]">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className={`text-3xl font-black text-black uppercase ${t012.className}`}>SELECT YOUR SEATS</h2>
                </div>

                {/* Ticket Quantity Selector */}
                <div className="mb-8 p-4 border-4 border-black bg-[#fcd34d] shadow-[8px_8px_0_0_#000]">
                  <h3 className={`mb-4 text-xl font-black text-black uppercase ${nostromoMedium.className}`}>HOW MANY TICKETS?</h3>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setTicketQuantity(num);
                          setSelectedSeats(new Set()); // Reset selection on quantity change
                        }}
                        className={`flex h-12 w-12 items-center justify-center border-4 border-black text-xl font-black transition-all ${
                          ticketQuantity === num
                            ? 'bg-[#EF6400] text-black shadow-[4px_4px_0_0_#000] scale-110'
                            : 'bg-white text-black hover:bg-black hover:text-white'
                        } ${ruigslay.className}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="mb-8 flex flex-wrap gap-4">
                  <div className={`flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0_0_#000] font-bold text-black uppercase text-xs ${nostromoMedium.className}`}>
                    <div className="h-4 w-4 border-2 border-black bg-white" />
                    AVAILABLE
                  </div>
                  <div className={`flex items-center gap-2 border-2 border-black bg-[#fcd34d] px-3 py-1.5 shadow-[2px_2px_0_0_#000] font-bold text-black uppercase text-xs ${nostromoMedium.className}`}>
                    <div className="h-4 w-4 border-2 border-black bg-[#EF6400]" />
                    SELECTED
                  </div>
                  <div className={`flex items-center gap-2 border-2 border-black bg-slate-200 px-3 py-1.5 shadow-[2px_2px_0_0_#000] font-bold text-black uppercase text-xs ${nostromoMedium.className}`}>
                    <div className="h-4 w-4 border-2 border-black bg-slate-400" />
                    HELD
                  </div>
                  <div className={`flex items-center gap-2 border-2 border-black bg-rose-200 px-3 py-1.5 shadow-[2px_2px_0_0_#000] font-bold text-black uppercase text-xs ${nostromoMedium.className}`}>
                    <div className="h-4 w-4 border-2 border-black bg-rose-500" />
                    BOOKED
                  </div>
                </div>

                {/* Stage */}
                <div className="mb-12 flex justify-center">
                  <div className={`w-3/4 border-4 border-black bg-black py-4 text-center text-xl font-black uppercase text-white shadow-[8px_8px_0_0_#000] ${t012.className}`}>
                    {show.type === 'concert' ? 'STAGE' : 'SCREEN'}
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="overflow-x-auto pb-4">
                  <div className="mx-auto flex min-w-max flex-col items-center gap-2">
                    {rows.map((row) => (
                      <div key={row} className="flex items-center gap-3">
                        <span className={`w-8 text-center text-sm font-black text-black ${nostromoMedium.className}`}>{row}</span>
                        <div className="flex gap-2">
                          {seatsByRow[row].map((seat) => {
                            const isSelected = selectedSeats.has(seat.seat_id);
                            const isPreviewed = previewSeatIds.has(seat.seat_id);
                            const isAvailable = seat.status === 'available' || (seat.status === 'held' && seat.is_mine);
                            const isHeld = seat.status === 'held' && !seat.is_mine;
                            const isBooked = seat.status === 'booked';

                            return (
                              <button
                                key={seat.seat_id}
                                onClick={() => selectSeatBlock(seat)}
                                onMouseEnter={() => setHoveredSeatId(seat.seat_id)}
                                onMouseLeave={() => setHoveredSeatId(null)}
                                disabled={!isAvailable && !isSelected}
                                title={`Row ${seat.seat_row}, Seat ${seat.seat_number}${seat.category_name ? ` (${seat.category_name})` : ''}${seat.price ? ` - $${seat.price}` : ''}`}
                                className={`flex h-10 w-10 items-center justify-center border-2 border-black text-xs font-black transition-all ${
                                  isSelected
                                    ? 'bg-[#EF6400] text-black scale-110 shadow-[4px_4px_0_0_#000]'
                                    : isPreviewed
                                    ? 'bg-[#fcd34d] text-black border-dashed border-[#EF6400] shadow-[4px_4px_0_0_#000]'
                                    : isAvailable
                                    ? 'bg-white text-black shadow-[2px_2px_0_0_#000] hover:bg-black hover:text-white'
                                    : isHeld
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                                    : 'bg-rose-500 text-black cursor-not-allowed'
                                }`}
                              >
                                {isBooked ? <X className="h-5 w-5" /> : isHeld ? <Lock className="h-4 w-4" /> : seat.seat_number}
                              </button>
                            );
                          })}
                        </div>
                        <span className={`w-8 text-center text-sm font-black text-black ${nostromoMedium.className}`}>{row}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category pricing & availability */}
                {categoryList.length > 0 && (
                  <div className="mt-12 border-t-4 border-black pt-8">
                    <h3 className={`mb-6 text-2xl font-black text-black uppercase ${t012.className}`}>CATEGORIES & AVAILABILITY</h3>
                    <div className="space-y-4">
                      {categoryList.map((cat) => {
                        const isSoldOut = cat.available === 0;
                        const userEntry = userWaitlist.find((w) => w.category_id === cat.id);
                        return (
                          <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="h-6 w-6 border-2 border-black" style={{ backgroundColor: cat.color }} />
                              <span className={`text-lg font-black text-black ${nostromoMedium.className}`}>{cat.name}</span>
                              {cat.price !== null && (
                                <span className="border-2 border-black px-2 py-1 text-sm font-bold bg-[#fcd34d]">
                                  ${cat.price.toFixed(2)}
                                </span>
                              )}
                              <span className="border-2 border-black px-2 py-1 text-sm font-bold bg-slate-100">
                                {cat.available} / {cat.total} AVAIL
                              </span>
                              {isSoldOut && (
                                <span className="border-2 border-black bg-rose-500 px-3 py-1 text-sm font-black text-black uppercase">SOLD OUT</span>
                              )}
                              {userEntry && (
                                <div className="flex items-center gap-2">
                                  <span className={`border-2 border-black px-3 py-1 text-sm font-black text-black uppercase ${userEntry.status === 'offered' ? 'bg-[#4ade80] animate-pulse' : 'bg-[#fcd34d]'}`}>
                                    {userEntry.status === 'offered' ? 'SEAT OFFERED!' : `WAITLIST #${userEntry.position}`}
                                  </span>
                                  {userEntry.status === 'offered' && userEntry.offer_expires_at && (
                                    <span className="border-2 border-black bg-rose-500 px-2 py-1 text-sm font-black text-white flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {Math.max(0, Math.floor((new Date(userEntry.offer_expires_at).getTime() - now) / 1000 / 60))}M {
                                        Math.max(0, Math.floor(((new Date(userEntry.offer_expires_at).getTime() - now) / 1000) % 60)).toString().padStart(2, '0')
                                      }S
                                    </span>
                                  )}
                                  {userEntry.status === 'offered' && (
                                    <Link href="/waitlist" className="border-2 border-black bg-black text-white px-3 py-1 text-sm font-black uppercase hover:bg-[#EF6400] transition-colors">
                                      View Offer
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                            {isSoldOut && !userEntry && (
                              <button
                                onClick={() => handleJoinWaitlist(cat.id)}
                                disabled={joiningWaitlist}
                                className={`flex items-center gap-2 border-4 border-black bg-[#c0a9fa] px-4 py-2 text-sm font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#000] ${nostromoMedium.className}`}
                              >
                                <Bell className="h-4 w-4" />
                                {joiningWaitlist ? 'JOINING...' : 'JOIN WAITLIST'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {allSoldOut && (
                      <div className="mt-6 border-4 border-black bg-[#fcd34d] p-4 text-black font-bold uppercase shadow-[4px_4px_0_0_#000]">
                        <ListOrdered className="mr-2 inline h-5 w-5" />
                        THIS EVENT IS FULLY SOLD OUT. JOIN A WAITLIST ABOVE — IF SOMEONE CANCELS, YOU'LL GET AN AUTOMATIC OFFER WITH A TIME-LIMITED LINK.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side panel */}
            {selectedSeats.size > 0 && (
              <div className="w-full xl:w-1/3 sticky top-8 animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col items-center p-4 sm:p-6">
                <h3 className={`mb-4 text-3xl font-black text-black uppercase text-center ${t012.className}`}>
                  SEATS HELD! YOU'RE ALMOST THERE...
                </h3>
                
                <BookingSummaryPanel 
                  show={show!} 
                  venue={venue!} 
                  selectedSeats={selectedSeats} 
                  seats={seatMap} 
                />
                
                <button
                  onClick={() => router.push(`/events/${id}/checkout?seats=${Array.from(selectedSeats).join(',')}`)}
                  className={`mt-8 w-full border-4 border-black bg-[#EF6400] py-6 text-2xl font-black text-black uppercase shadow-[8px_8px_0_0_#000] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#000] active:translate-x-2 active:translate-y-2 active:shadow-none ${nostromoMedium.className}`}
                >
                  CLICK TO PROCEED
                </button>
              </div>
            )}
          </div>
        </div>
      </GridPlusBackground>
    </main>
  );
}

function FilmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" strokeLinejoin="miter">
      <rect x="2" y="2" width="20" height="20" />
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

function MusicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" strokeLinejoin="miter">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
