'use client';

import { useEffect, useState } from 'react';
import { supabase, Show, Venue } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, DollarSign, Ticket, Plus, Loader2, Building2, TrendingUp, Clock } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'movie' | 'concert'>('movie');
  const [venueId, setVenueId] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [posterUrl, setPosterUrl] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }
      if (profile && profile.role !== 'organiser' && profile.role !== 'admin') {
        toast({
          title: 'Access denied',
          description: 'Only organisers can access this page.',
          variant: 'destructive',
        });
        router.push('/events');
        return;
      }
      fetchData();
    }
  }, [user, profile, authLoading, router, toast]);

  const fetchData = async () => {
    setLoading(true);
    const [revenueRes, venuesRes, showsRes] = await Promise.all([
      supabase.rpc('get_organiser_revenue', { p_organiser_id: user!.id }),
      supabase.from('venues').select('*'),
      supabase.from('shows').select('*').eq('organiser_id', user!.id).order('show_date', { ascending: false }),
    ]);

    if (revenueRes.data) setRevenueData(revenueRes.data as RevenueData[]);
    if (venuesRes.data) setVenues(venuesRes.data as Venue[]);
    if (showsRes.data) setShows(showsRes.data as Show[]);
    setLoading(false);
  };

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

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const totalRevenue = revenueData.reduce((sum, r) => sum + Number(r.total_revenue), 0);
  const totalBookings = revenueData.reduce((sum, r) => sum + (r.total_bookings || 0), 0);
  const activeShows = shows.filter(s => s.status === 'active').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Organiser Dashboard</h1>
          <p className="mt-1 text-slate-500">Manage your events and track revenue</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} color="from-emerald-500 to-teal-500" />
        <StatCard icon={Ticket} label="Total Bookings" value={totalBookings.toString()} color="from-blue-500 to-cyan-500" />
        <StatCard icon={Calendar} label="Active Events" value={activeShows.toString()} color="from-amber-500 to-orange-500" />
      </div>

      {/* Events table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Your Events</h2>
        </div>
        {revenueData.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">No events yet. Create your first event to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Venue</th>
                  <th className="px-5 py-3 font-medium text-right">Bookings</th>
                  <th className="px-5 py-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((rev) => (
                  <tr key={rev.show_id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-900">{rev.title}</td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(rev.show_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-slate-500">{rev.venue_name}</td>
                    <td className="px-5 py-4 text-right text-slate-700">{rev.total_bookings || 0}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">${Number(rev.total_revenue || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Event Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Set up a movie or concert listing with a venue and schedule.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateShow} className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Summer Jazz Night" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell people what to expect..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'movie' | 'concert')}>
                  <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Movie</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Select value={venueId} onValueChange={setVenueId}>
                  <SelectTrigger id="venue"><SelectValue placeholder="Select venue" /></SelectTrigger>
                  <SelectContent>
                    {venues.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" value={showTime} onChange={(e) => setShowTime(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="poster">Poster URL (optional)</Label>
              <Input id="poster" value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} placeholder="https://..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-gradient-to-r from-amber-500 to-orange-600">
                {creating ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
