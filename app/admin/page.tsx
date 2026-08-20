'use client';

import { useEffect, useState } from 'react';
import { supabase, Venue, SeatCategory } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Plus, Loader2, LayoutGrid, Trash2, Edit, ChevronRight } from 'lucide-react';
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

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Venue form
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');

  // Seat layout form
  const [layoutVenue, setLayoutVenue] = useState<Venue | null>(null);
  const [categories, setCategories] = useState<SeatCategory[]>([]);
  const [seatCount, setSeatCount] = useState<{ row: string; count: number; categoryId: string }[]>([]);
  const [catName, setCatName] = useState('');
  const [catPrice, setCatPrice] = useState('1.0');
  const [catColor, setCatColor] = useState('#6366f1');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }
      if (profile && profile.role !== 'admin') {
        toast({
          title: 'Access denied',
          description: 'Only admins can access this page.',
          variant: 'destructive',
        });
        router.push('/events');
        return;
      }
      fetchVenues();
    }
  }, [user, profile, authLoading, router, toast]);

  const fetchVenues = async () => {
    setLoading(true);
    const { data } = await supabase.from('venues').select('*').order('created_at', { ascending: false });
    if (data) setVenues(data as Venue[]);
    setLoading(false);
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { error } = await supabase.from('venues').insert({
      name,
      address: address || null,
      city: city || null,
      description: description || null,
      created_by: user!.id,
    });
    if (error) {
      toast({ title: 'Failed to create venue', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Venue created! Now set up the seat layout.' });
      setName('');
      setAddress('');
      setCity('');
      setDescription('');
      setCreateOpen(false);
      fetchVenues();
    }
    setCreating(false);
  };

  const openLayout = async (venue: Venue) => {
    setLayoutVenue(venue);
    const { data } = await supabase
      .from('seat_categories')
      .select('*')
      .eq('venue_id', venue.id);
    if (data) {
      setCategories(data as SeatCategory[]);
      if (data.length > 0) {
        setSeatCount([{ row: 'A', count: 10, categoryId: data[0].id }]);
      } else {
        setSeatCount([]);
      }
    }
  };

  const handleAddCategory = async () => {
    if (!layoutVenue || !catName) return;
    const { data, error } = await supabase
      .from('seat_categories')
      .insert({
        venue_id: layoutVenue.id,
        name: catName,
        price_modifier: parseFloat(catPrice),
        color: catColor,
      })
      .select()
      .single();
    if (error) {
      toast({ title: 'Failed to add category', description: error.message, variant: 'destructive' });
    } else {
      setCategories([...categories, data as SeatCategory]);
      if (seatCount.length === 0) {
        setSeatCount([{ row: 'A', count: 10, categoryId: data.id }]);
      }
      setCatName('');
      setCatPrice('1.0');
      setCatColor('#6366f1');
      toast({ title: 'Category added' });
    }
  };

  const handleGenerateSeats = async () => {
    if (!layoutVenue || seatCount.length === 0) return;
    setCreating(true);

    const seatsToInsert: { venue_id: string; category_id: string; seat_row: string; seat_number: string }[] = [];
    for (const rowConfig of seatCount) {
      for (let i = 1; i <= rowConfig.count; i++) {
        seatsToInsert.push({
          venue_id: layoutVenue.id,
          category_id: rowConfig.categoryId,
          seat_row: rowConfig.row,
          seat_number: i.toString(),
        });
      }
    }

    // Delete existing seats first
    await supabase.from('seats').delete().eq('venue_id', layoutVenue.id);

    const { error } = await supabase.from('seats').insert(seatsToInsert);

    if (error) {
      toast({ title: 'Failed to generate seats', description: error.message, variant: 'destructive' });
    } else {
      // Update total_seats on venue
      await supabase.from('venues').update({ total_seats: seatsToInsert.length }).eq('id', layoutVenue.id);
      toast({ title: `Generated ${seatsToInsert.length} seats!` });
      setLayoutVenue(null);
      fetchVenues();
    }
    setCreating(false);
  };

  const addRow = () => {
    if (categories.length === 0) return;
    const lastRow = seatCount[seatCount.length - 1];
    const nextChar = String.fromCharCode(lastRow.row.charCodeAt(0) + 1);
    setSeatCount([...seatCount, { row: nextChar, count: 10, categoryId: categories[0].id }]);
  };

  const updateRow = (index: number, field: 'row' | 'count' | 'categoryId', value: string) => {
    const updated = [...seatCount];
    if (field === 'count') {
      updated[index].count = parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setSeatCount(updated);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="mt-1 text-slate-500">Manage venues and seat layouts</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-amber-500 to-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Create Venue
        </Button>
      </div>

      <div className="grid gap-4">
        {venues.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">No venues yet. Create your first venue to get started.</p>
          </div>
        ) : (
          venues.map((venue) => (
            <div key={venue.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{venue.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {venue.city && `${venue.city}`}
                    {venue.address && ` - ${venue.address}`}
                    {' · '}{venue.total_seats} seats
                  </p>
                </div>
                <Button variant="outline" onClick={() => openLayout(venue)}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Seat Layout
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Venue Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Venue</DialogTitle>
            <DialogDescription>Add a venue where events will be hosted.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVenue} className="space-y-4">
            <div>
              <Label htmlFor="vname">Venue Name</Label>
              <Input id="vname" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Grand Cinema Hall" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vcity">City</Label>
                <Input id="vcity" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
              </div>
              <div>
                <Label htmlFor="vaddress">Address</Label>
                <Input id="vaddress" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
              </div>
            </div>
            <div>
              <Label htmlFor="vdesc">Description</Label>
              <Textarea id="vdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the venue..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-gradient-to-r from-amber-500 to-orange-600">
                {creating ? 'Creating...' : 'Create Venue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Seat Layout Dialog */}
      <Dialog open={!!layoutVenue} onOpenChange={(open) => !open && setLayoutVenue(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seat Layout - {layoutVenue?.name}</DialogTitle>
            <DialogDescription>
              Define seat categories and generate the seat grid. Existing seats will be replaced.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Categories */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Seat Categories</h4>
              {categories.length > 0 && (
                <div className="mb-3 space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <span className="text-slate-400">×{cat.price_modifier} price</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Category name (e.g. Premium)" className="flex-1" />
                <Input value={catPrice} onChange={(e) => setCatPrice(e.target.value)} type="number" step="0.1" placeholder="Price modifier" className="w-28" />
                <Input value={catColor} onChange={(e) => setCatColor(e.target.value)} type="color" className="w-12 p-1" />
                <Button type="button" onClick={handleAddCategory} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Row configuration */}
            {categories.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Seat Rows</h4>
                  <Button type="button" onClick={addRow} variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Add Row
                  </Button>
                </div>
                <div className="space-y-2">
                  {seatCount.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input value={row.row} onChange={(e) => updateRow(idx, 'row', e.target.value)} className="w-16 text-center" placeholder="A" />
                      <Input value={row.count} onChange={(e) => updateRow(idx, 'count', e.target.value)} type="number" min="1" className="w-24" placeholder="Count" />
                      <Select value={row.categoryId} onValueChange={(v) => updateRow(idx, 'categoryId', v)}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSeatCount(seatCount.filter((_, i) => i !== idx))}
                        className="text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Total seats to generate: {seatCount.reduce((sum, r) => sum + r.count, 0)}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLayoutVenue(null)}>Cancel</Button>
            <Button onClick={handleGenerateSeats} disabled={creating || seatCount.length === 0} className="bg-gradient-to-r from-amber-500 to-orange-600">
              {creating ? 'Generating...' : 'Generate Seats'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
