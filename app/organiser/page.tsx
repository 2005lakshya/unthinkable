'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, Show, Venue } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, DollarSign, Ticket, Plus, Loader2, Clock, Settings, X, ChevronDown, ChevronUp, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GridPlusBackground } from '@/components/landing/Grid';
import { ruigslay, nostromoMedium, t012 } from '@/app/fonts';

interface RevenueData {
  show_id: string;
  title: string;
  show_date: string;
  venue_name: string;
  total_bookings: number;
  total_seats: number;
  total_revenue: number;
  cancelled_bookings: number;
}

export default function OrganiserDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Pricing state
  const [pricingShowId, setPricingShowId] = useState<string | null>(null);
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Booking breakdown state
  const [bookingsShowId, setBookingsShowId] = useState<string | null>(null);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'movie' | 'concert'>('movie');
  const [venueId, setVenueId] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [posterUrl, setPosterUrl] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [revenueRes, venuesRes, showsRes] = await Promise.all([
      supabase.rpc('get_organiser_revenue', { p_organiser_id: user.id }),
      supabase.from('venues').select('*'),
      supabase.from('shows').select('*').eq('organiser_id', user.id).order('show_date', { ascending: false }),
    ]);
    if (revenueRes.data) setRevenueData(revenueRes.data as RevenueData[]);
    if (venuesRes.data) setVenues(venuesRes.data as Venue[]);
    if (showsRes.data) setShows(showsRes.data as Show[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }
      if (!profile) return;
      
      if (profile.role !== 'organiser') {
        toast({
          title: 'Access denied',
          description: 'Only organisers can access this page.',
          variant: 'destructive',
        });
        if (profile.role === 'admin') router.push('/admin');
        else router.push('/events');
        return;
      }
      fetchData();
    }
  }, [user, profile, authLoading, router, toast, fetchData]);

  // Real-time: re-fetch revenue/stats when any booking or seat changes
  useEffect(() => {
    if (!user || !profile || profile.role !== 'organiser') return;

    const channel = supabase
      .channel(`organiser_realtime_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => { fetchData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'show_seats' },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, profile, fetchData]);



  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) {
      toast({ title: 'Please select a venue', variant: 'destructive' });
      return;
    }
    setCreating(true);

    const { data, error } = await supabase
      .from('shows')
      .insert({
        title,
        description: description || null,
        type,
        venue_id: venueId,
        organiser_id: user!.id,
        show_date: showDate,
        show_time: showTime,
        poster_url: posterUrl || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Failed to create event',
        description: error.message,
        variant: 'destructive',
      });
      setCreating(false);
      return;
    }

    // Fetch seat categories for this venue and create default pricing
    const { data: categories } = await supabase
      .from('seat_categories')
      .select('*')
      .eq('venue_id', venueId);

    if (categories && categories.length > 0) {
      const pricingInserts = categories.map((cat: { id: string; price_modifier: number }) => ({
        show_id: data.id,
        category_id: cat.id,
        price: Math.round(cat.price_modifier * 50 * 100) / 100,
      }));
      await supabase.from('show_category_pricing').insert(pricingInserts);
    }

    toast({
      title: 'Event created!',
      description: 'Your event is now live. Set custom pricing per category if needed.',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setType('movie');
    setVenueId('');
    setShowDate('');
    setShowTime('');
    setPosterUrl('');
    setCreateOpen(false);
    setCreating(false);
    fetchData();
  };

  const toggleBookingsSection = async (showId: string) => {
    if (bookingsShowId === showId) {
      setBookingsShowId(null);
      return;
    }
    setBookingsShowId(showId);
    setBookingsLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('id, reference_code, total_amount, status, created_at, profiles(full_name, email: id)')
      .eq('show_id', showId)
      .order('created_at', { ascending: false });
    if (data) setBookingsList(data);
    setBookingsLoading(false);
  };

  const togglePricingSection = async (showId: string) => {
    if (pricingShowId === showId) {
      setPricingShowId(null);
      return;
    }
    
    setPricingShowId(showId);
    setPricingLoading(true);
    const { data } = await supabase
      .from('show_category_pricing')
      .select('id, price, seat_categories(name)')
      .eq('show_id', showId);
    if (data) {
      setPricingData(data);
    }
    setPricingLoading(false);
  };

  const savePricing = async () => {
    setPricingSaving(true);
    for (const item of pricingData) {
      await supabase.from('show_category_pricing').update({ price: item.price }).eq('id', item.id);
    }
    setPricingSaving(false);
    toast({ title: 'Pricing updated successfully' });
    setPricingShowId(null);
  };

  const updatePricingAmount = (id: string, newPrice: string) => {
    setPricingData(pricingData.map(p => p.id === id ? { ...p, price: parseFloat(newPrice) || 0 } : p));
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen w-full bg-[#D5D1BE] flex items-center justify-center relative overflow-x-hidden">
        <GridPlusBackground>
          <Loader2 className="h-12 w-12 animate-spin text-black relative z-10" />
        </GridPlusBackground>
      </main>
    );
  }

  const totalRevenue = revenueData.reduce((sum, r) => sum + Number(r.total_revenue), 0);
  const totalBookings = revenueData.reduce((sum, r) => sum + (r.total_bookings || 0), 0);
  const activeShows = shows.filter(s => s.status === 'active').length;

  return (
    <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-x-hidden pb-20">
      <GridPlusBackground>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
          
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className={`text-4xl md:text-6xl font-black text-black uppercase ${t012.className}`}>ORGANISER DASHBOARD</h1>
              <p className={`mt-2 text-xl font-bold text-black/70 uppercase ${nostromoMedium.className}`}>MANAGE YOUR EVENTS AND TRACK REVENUE</p>
            </div>
            <button
              onClick={() => setCreateOpen(!createOpen)}
              className={`flex items-center gap-2 border-4 border-black bg-[#EF6400] px-6 py-4 text-lg font-black text-black uppercase shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
            >
              {createOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
              {createOpen ? 'CLOSE' : 'CREATE EVENT'}
            </button>
          </div>

          {/* Create Event Inline Form */}
          {createOpen && (
            <div className="mb-12 border-4 border-black bg-white p-6 md:p-8 shadow-[12px_12px_0_0_#000]">
              <div className="mb-8 border-b-4 border-black pb-4">
                <h2 className={`text-3xl font-black text-black uppercase ${t012.className}`}>CREATE NEW EVENT</h2>
                <p className={`mt-2 text-black/70 font-bold ${nostromoMedium.className}`}>SET UP A MOVIE OR CONCERT LISTING</p>
              </div>
              <form onSubmit={handleCreateShow} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={`text-sm font-black text-black uppercase ${nostromoMedium.className}`}>Event Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      required 
                      placeholder="E.G. SUMMER JAZZ NIGHT"
                      className={`w-full border-4 border-black bg-[#f8fafc] p-3 outline-none focus:border-[#EF6400] font-black uppercase text-black ${nostromoMedium.className}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-black text-black uppercase ${nostromoMedium.className}`}>Poster URL (Optional)</label>
                    <input 
                      type="text" 
                      value={posterUrl} 
                      onChange={(e) => setPosterUrl(e.target.value)} 
                      placeholder="HTTPS://..."
                      className={`w-full border-4 border-black bg-[#f8fafc] p-3 outline-none focus:border-[#EF6400] font-black uppercase text-black ${nostromoMedium.className}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-black text-black uppercase ${nostromoMedium.className}`}>Description</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="TELL PEOPLE WHAT TO EXPECT..."
                    rows={3}
                    className={`w-full border-4 border-black bg-[#f8fafc] p-3 outline-none focus:border-[#EF6400] font-black uppercase text-black ${nostromoMedium.className}`}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={`text-sm font-black text-black uppercase ${nostromoMedium.className}`}>Event Type</label>
                    <select 
                      value={type} 
                      onChange={(e) => setType(e.target.value as 'movie' | 'concert')}
                      className={`w-full border-4 border-black bg-[#f8fafc] p-3 outline-none focus:border-[#EF6400] font-black uppercase text-black cursor-pointer ${nostromoMedium.className}`}
                    >
                      <option value="movie">MOVIE</option>
                      <option value="concert">CONCERT</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-black text-black uppercase ${nostromoMedium.className}`}>Venue</label>
                    <select 
                      value={venueId} 
                      onChange={(e) => setVenueId(e.target.value)}
                      required
                      className={`w-full border-4 border-black bg-[#f8fafc] p-3 outline-none focus:border-[#EF6400] font-black uppercase text-black cursor-pointer ${nostromoMedium.className}`}
                    >
                      <option value="">SELECT VENUE</option>
                      {venues.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={`text-sm font-black text-black uppercase ${nostromoMedium.className}`}>Date</label>
                    <input 
                      type="date" 
                      value={showDate} 
                      onChange={(e) => setShowDate(e.target.value)} 
                      required 
                      className={`w-full border-4 border-black bg-[#f8fafc] p-3 outline-none focus:border-[#EF6400] font-black uppercase text-black ${nostromoMedium.className}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-black text-black uppercase ${nostromoMedium.className}`}>Time</label>
                    <input 
                      type="time" 
                      value={showTime} 
                      onChange={(e) => setShowTime(e.target.value)} 
                      required 
                      className={`w-full border-4 border-black bg-[#f8fafc] p-3 outline-none focus:border-[#EF6400] font-black uppercase text-black ${nostromoMedium.className}`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t-4 border-black">
                  <button 
                    type="button" 
                    onClick={() => setCreateOpen(false)}
                    className={`border-4 border-black bg-white px-6 py-3 font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating}
                    className={`flex items-center gap-2 border-4 border-black bg-[#4ade80] px-8 py-3 font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#000] ${nostromoMedium.className}`}
                  >
                    {creating && <Loader2 className="h-5 w-5 animate-spin" />}
                    {creating ? 'CREATING...' : 'PUBLISH EVENT'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stats */}
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={DollarSign} label="TOTAL REVENUE" value={`$${totalRevenue.toFixed(2)}`} bgColor="bg-[#fcd34d]" />
            <StatCard icon={Ticket} label="TOTAL BOOKINGS" value={totalBookings.toString()} bgColor="bg-[#A3E4D7]" />
            <StatCard icon={Calendar} label="ACTIVE EVENTS" value={activeShows.toString()} bgColor="bg-[#c0a9fa]" />
            <StatCard icon={TrendingUp} label="AVG REVENUE/EVENT" value={revenueData.length > 0 ? `$${(totalRevenue / revenueData.length).toFixed(0)}` : '$0'} bgColor="bg-[#fda4af]" />
          </div>

          {/* Events list */}
          <div className="border-4 border-black bg-white shadow-[12px_12px_0_0_#000]">
            <div className="border-b-4 border-black bg-[#EF6400] p-6">
              <h2 className={`text-2xl font-black text-black uppercase ${t012.className}`}>YOUR EVENTS</h2>
            </div>
            
            {shows.length === 0 ? (
              <div className="p-16 text-center">
                <Calendar className="mx-auto mb-4 h-16 w-16 text-black/40" />
                <p className={`text-xl font-black text-black/60 uppercase ${ruigslay.className}`}>NO EVENTS YET. CREATE YOUR FIRST EVENT.</p>
              </div>
            ) : (
              <div className="divide-y-4 divide-black">
                {shows.map((show) => {
                  const rev = revenueData.find((r) => r.show_id === show.id) || {
                    total_bookings: 0,
                    total_revenue: 0,
                  };
                  const venue = venues.find((v) => v.id === show.venue_id);

                  return (
                    <div key={show.id} className="flex flex-col border-b-4 border-black last:border-b-0 bg-[#f8fafc] hover:bg-white transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                        <div className="flex-1">
                          <h3 className={`text-2xl font-black text-black uppercase ${ruigslay.className}`}>{show.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-3">
                            <span className={`inline-flex items-center gap-1 border-2 border-black bg-[#fcd34d] px-2 py-1 text-xs font-black uppercase text-black ${nostromoMedium.className}`}>
                              <Calendar className="h-3 w-3" />
                              {new Date(show.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className={`inline-flex items-center gap-1 border-2 border-black bg-white px-2 py-1 text-xs font-black uppercase text-black ${nostromoMedium.className}`}>
                              <Clock className="h-3 w-3" />
                              {venue?.name || 'Unknown Venue'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-6">
                          <div className="text-right">
                            <p className={`text-sm font-black text-black/60 uppercase ${nostromoMedium.className}`}>BOOKINGS</p>
                            <p className={`text-2xl font-black text-black ${ruigslay.className}`}>{rev.total_bookings || 0}</p>
                          </div>
                          <div className="text-right border-l-4 border-black pl-6">
                            <p className={`text-sm font-black text-black/60 uppercase ${nostromoMedium.className}`}>REVENUE</p>
                            <p className={`text-2xl font-black text-black ${ruigslay.className}`}>${Number(rev.total_revenue || 0).toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleBookingsSection(show.id)}
                              className={`flex items-center gap-2 border-4 border-black bg-[#c0a9fa] p-3 font-black text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
                              title="View Bookings"
                            >
                              <Users className="h-5 w-5" />
                              {bookingsShowId === show.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                            <button 
                              onClick={() => togglePricingSection(show.id)}
                              className={`flex items-center gap-2 border-4 border-black bg-[#A3E4D7] p-3 font-black text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
                              title="Manage Pricing"
                            >
                              <Settings className="h-5 w-5" />
                              {pricingShowId === show.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Booking Breakdown */}
                      {bookingsShowId === show.id && (
                        <div className="border-t-4 border-black bg-[#c0a9fa]/20 p-6 md:p-8">
                          <div className="mb-6 flex items-center justify-between border-b-4 border-black pb-4">
                            <h3 className={`text-2xl font-black text-black uppercase ${t012.className}`}>BOOKING SUMMARY</h3>
                            <span className={`border-2 border-black bg-[#c0a9fa] px-3 py-1 text-sm font-black uppercase ${nostromoMedium.className}`}>
                              {bookingsList.filter(b => b.status === 'confirmed').length} CONFIRMED
                            </span>
                          </div>
                          {bookingsLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-black" /></div>
                          ) : bookingsList.length === 0 ? (
                            <p className={`text-center font-black uppercase text-black/40 py-8 ${nostromoMedium.className}`}>NO BOOKINGS YET</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b-4 border-black bg-black text-white">
                                    <th className={`px-4 py-3 text-left text-xs font-black uppercase ${nostromoMedium.className}`}>REF CODE</th>
                                    <th className={`px-4 py-3 text-left text-xs font-black uppercase ${nostromoMedium.className}`}>AMOUNT</th>
                                    <th className={`px-4 py-3 text-left text-xs font-black uppercase ${nostromoMedium.className}`}>STATUS</th>
                                    <th className={`px-4 py-3 text-left text-xs font-black uppercase ${nostromoMedium.className}`}>DATE</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-black">
                                  {bookingsList.map((b) => (
                                    <tr key={b.id} className={`${b.status === 'cancelled' ? 'opacity-50 bg-black/5' : 'bg-white hover:bg-[#fcd34d]/30'} transition-colors`}>
                                      <td className={`px-4 py-3 font-mono text-sm font-black text-black ${ruigslay.className}`}>{b.reference_code}</td>
                                      <td className={`px-4 py-3 font-black text-black ${nostromoMedium.className}`}>${Number(b.total_amount).toFixed(2)}</td>
                                      <td className="px-4 py-3">
                                        <span className={`border-2 border-black px-2 py-0.5 text-xs font-black uppercase ${nostromoMedium.className} ${
                                          b.status === 'confirmed' ? 'bg-[#4ade80]' : 'bg-black text-white'
                                        }`}>{b.status}</span>
                                      </td>
                                      <td className={`px-4 py-3 text-xs font-bold text-black/60 ${nostromoMedium.className}`}>{new Date(b.created_at).toLocaleDateString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inline Pricing Section */}
                      {pricingShowId === show.id && (
                        <div className="border-t-4 border-black bg-[#D5D1BE]/30 p-6 md:p-8">
                          <div className="mb-6 flex items-center justify-between border-b-4 border-black pb-4">
                            <h3 className={`text-2xl font-black text-black uppercase ${t012.className}`}>MANAGE TICKET PRICING</h3>
                          </div>
                          
                          {pricingLoading ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-black" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {pricingData.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] gap-4">
                                  <span className={`text-lg font-black text-black uppercase ${nostromoMedium.className}`}>
                                    {item.seat_categories?.name}
                                  </span>
                                  <div className="flex items-center gap-2 border-4 border-black bg-[#fcd34d] px-3 py-2 w-48">
                                    <DollarSign className="h-5 w-5 text-black" />
                                    <input 
                                      type="number" 
                                      step="0.01" 
                                      min="0"
                                      value={item.price} 
                                      onChange={(e) => updatePricingAmount(item.id, e.target.value)}
                                      className={`w-full bg-transparent outline-none font-black text-black text-xl ${ruigslay.className}`}
                                    />
                                  </div>
                                </div>
                              ))}
                              <div className="mt-6 flex justify-end gap-4">
                                <button 
                                  onClick={() => setPricingShowId(null)}
                                  className={`border-4 border-black bg-white px-6 py-3 font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
                                >
                                  CANCEL
                                </button>
                                <button 
                                  onClick={savePricing}
                                  disabled={pricingSaving}
                                  className={`border-4 border-black bg-[#4ade80] px-8 py-3 font-black text-black uppercase shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 ${nostromoMedium.className}`}
                                >
                                  {pricingSaving ? 'SAVING...' : 'SAVE PRICING'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </GridPlusBackground>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, bgColor }: { icon: typeof DollarSign; label: string; value: string; bgColor: string }) {
  return (
    <div className={`border-4 border-black ${bgColor} p-6 shadow-[8px_8px_0_0_#000]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-black text-black/70 uppercase ${nostromoMedium.className}`}>{label}</p>
          <p className={`mt-2 text-4xl font-black text-black uppercase ${ruigslay.className}`}>{value}</p>
        </div>
        <div className="border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000]">
          <Icon className="h-8 w-8 text-black" />
        </div>
      </div>
    </div>
  );
}
