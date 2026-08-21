'use client';

import { useEffect, useState } from 'react';
import { supabase, Venue, SeatCategory } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Loader2, LayoutGrid, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GridPlusBackground } from '@/components/landing/Grid';
import { ruigslay, nostromoMedium, t012 } from '@/app/fonts';

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
  const [catColor, setCatColor] = useState('#EF6400');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }
      if (!profile) return;
      
      if (profile.role !== 'admin') {
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

  const toggleLayout = async (venue: Venue) => {
    if (layoutVenue?.id === venue.id) {
      setLayoutVenue(null);
      return;
    }
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
      setCatColor('#EF6400');
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

    await supabase.from('seats').delete().eq('venue_id', layoutVenue.id);
    const { error } = await supabase.from('seats').insert(seatsToInsert);

    if (error) {
      toast({ title: 'Failed to generate seats', description: error.message, variant: 'destructive' });
    } else {
      await supabase.from('venues').update({ total_seats: seatsToInsert.length }).eq('id', layoutVenue.id);
      toast({ title: `Generated ${seatsToInsert.length} seats!` });
      setLayoutVenue(null);
      fetchVenues();
    }
    setCreating(false);
  };

  const addRow = () => {
    if (categories.length === 0) return;
    const lastRow = seatCount[seatCount.length - 1] || { row: '@' };
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
      <main className="min-h-screen w-full bg-[#D5D1BE] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-black" />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-x-hidden">
      <GridPlusBackground>
        <div className="w-full min-h-screen py-16 px-4 md:px-12 relative z-10 max-w-7xl mx-auto">
          
          <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className={`text-5xl md:text-7xl font-black text-black ${t012.className}`}>ADMIN PANEL</h1>
              <p className={`mt-2 text-xl text-black/80 font-bold ${nostromoMedium.className}`}>MANAGE VENUES AND SEAT LAYOUTS</p>
            </div>
            {!createOpen && (
              <button 
                onClick={() => setCreateOpen(true)} 
                className={`border-4 border-black bg-[#c0a9fa] text-black font-black uppercase shadow-[8px_8px_0_0_#000] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all px-8 py-4 flex items-center gap-2 ${nostromoMedium.className}`}
              >
                <Plus className="h-6 w-6" />
                CREATE VENUE
              </button>
            )}
          </div>

          {/* Create Venue Inline Section */}
          {createOpen && (
            <div className="mb-12 border-4 border-black bg-[#D5D1BE] p-8 shadow-[12px_12px_0_0_#000]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className={`text-4xl font-black text-black ${t012.className}`}>CREATE NEW VENUE</h2>
                  <p className={`text-black/70 font-bold ${nostromoMedium.className} mt-2`}>
                    ADD A VENUE WHERE EVENTS WILL BE HOSTED.
                  </p>
                </div>
                <button 
                  onClick={() => setCreateOpen(false)}
                  className="border-4 border-black bg-white p-2 hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0_0_#000]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateVenue} className="space-y-6">
                <div>
                  <label className="mb-2 block font-black text-black">VENUE NAME</label>
                  <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    placeholder="e.g. Grand Cinema Hall"
                    className="w-full border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000] focus:outline-none focus:border-[#EF6400]" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block font-black text-black">CITY</label>
                    <input 
                      value={city} 
                      onChange={(e) => setCity(e.target.value)} 
                      placeholder="New York" 
                      className="w-full border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000] focus:outline-none focus:border-[#EF6400]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-black text-black">ADDRESS</label>
                    <input 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder="123 Main St" 
                      className="w-full border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000] focus:outline-none focus:border-[#EF6400]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block font-black text-black">DESCRIPTION</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Describe the venue..." 
                    className="w-full border-4 border-black bg-white p-3 shadow-[4px_4px_0_0_#000] focus:outline-none focus:border-[#EF6400] min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end gap-4 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setCreateOpen(false)}
                    className="border-4 border-black bg-white text-black font-black uppercase shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all px-6 py-3"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating} 
                    className="border-4 border-black bg-[#4ade80] text-black font-black uppercase shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all px-6 py-3"
                  >
                    {creating ? 'CREATING...' : 'CREATE VENUE'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid gap-8">
            {venues.length === 0 ? (
              <div className="border-4 border-black bg-white shadow-[12px_12px_0_0_#000] p-16 text-center">
                <Building2 className="mx-auto mb-6 h-16 w-16 text-black/40" />
                <p className={`text-2xl font-bold text-black/60 ${ruigslay.className}`}>NO VENUES YET. CREATE YOUR FIRST VENUE.</p>
              </div>
            ) : (
              venues.map((venue) => (
                <div key={venue.id} className="border-4 border-black bg-[#A3E4D7] shadow-[12px_12px_0_0_#000] p-6 md:p-8 transition-all">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <h3 className={`text-4xl font-black text-black mb-4 ${ruigslay.className}`}>{venue.name}</h3>
                      <div className="flex flex-wrap gap-4">
                        {venue.city && (
                          <div className={`border-2 border-black bg-[#fcd34d] px-4 py-2 shadow-[4px_4px_0_0_#000] text-black font-bold ${nostromoMedium.className} text-sm`}>
                            CITY: {venue.city}
                          </div>
                        )}
                        {venue.address && (
                          <div className={`border-2 border-black bg-[#fcd34d] px-4 py-2 shadow-[4px_4px_0_0_#000] text-black font-bold ${nostromoMedium.className} text-sm`}>
                            ADDRESS: {venue.address}
                          </div>
                        )}
                        <div className={`border-2 border-black bg-[#fcd34d] px-4 py-2 shadow-[4px_4px_0_0_#000] text-black font-bold ${nostromoMedium.className} text-sm`}>
                          SEATS: {venue.total_seats || 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={() => toggleLayout(venue)}
                        className={`border-4 border-black ${layoutVenue?.id === venue.id ? 'bg-black text-white' : 'bg-[#EF6400] text-black'} font-black uppercase shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all px-6 py-3 flex items-center gap-2 ${nostromoMedium.className} text-sm`}
                      >
                        <LayoutGrid className="h-5 w-5" />
                        {layoutVenue?.id === venue.id ? 'CLOSE LAYOUT' : 'SEAT LAYOUT'}
                      </button>
                    </div>
                  </div>
                  
                  {venue.description && (
                    <div className="mt-6 border-2 border-black bg-white/50 p-4 font-medium text-black">
                      {venue.description}
                    </div>
                  )}

                  {/* Inline Seat Layout Editor */}
                  {layoutVenue?.id === venue.id && (
                    <div className="mt-8 border-4 border-black bg-[#D5D1BE] p-6 md:p-8 shadow-[8px_8px_0_0_#000]">
                      <div className="mb-8">
                        <h3 className={`text-3xl font-black text-black ${t012.className}`}>SEAT LAYOUT - {venue.name}</h3>
                        <p className={`text-black/70 font-bold ${nostromoMedium.className} mt-2`}>
                          DEFINE SEAT CATEGORIES AND GENERATE THE SEAT GRID.
                        </p>
                      </div>

                      <div className="space-y-8">
                        {/* Categories */}
                        <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
                          <h4 className="mb-4 text-xl font-black text-black uppercase">1. Seat Categories</h4>
                          {categories.length > 0 && (
                            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center gap-3 border-2 border-black bg-[#fcd34d] px-4 py-2 shadow-[4px_4px_0_0_#000]">
                                  <div className="h-6 w-6 border-2 border-black" style={{ backgroundColor: cat.color }} />
                                  <span className="font-bold text-black flex-1">{cat.name}</span>
                                  <span className="text-black/70 font-bold text-sm">×{cat.price_modifier} PRICE</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                            <input 
                              value={catName} 
                              onChange={(e) => setCatName(e.target.value)} 
                              placeholder="Category name (e.g. Premium)" 
                              className="flex-1 border-4 border-black bg-white p-3 focus:outline-none focus:border-[#EF6400]"
                            />
                            <input 
                              value={catPrice} 
                              onChange={(e) => setCatPrice(e.target.value)} 
                              type="number" 
                              step="0.1" 
                              placeholder="Price modifier" 
                              className="w-full sm:w-32 border-4 border-black bg-white p-3 focus:outline-none focus:border-[#EF6400]"
                            />
                            <input 
                              value={catColor} 
                              onChange={(e) => setCatColor(e.target.value)} 
                              type="color" 
                              className="w-16 h-[52px] border-4 border-black bg-white p-1 cursor-pointer"
                            />
                            <button 
                              type="button" 
                              onClick={handleAddCategory}
                              className="border-4 border-black bg-[#EF6400] text-black font-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all px-6 py-3"
                            >
                              ADD
                            </button>
                          </div>
                        </div>

                        {/* Row configuration */}
                        {categories.length > 0 && (
                          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <h4 className="text-xl font-black text-black uppercase">2. Seat Rows</h4>
                              <button 
                                type="button" 
                                onClick={addRow}
                                className="border-4 border-black bg-[#c0a9fa] text-black font-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all px-4 py-2 flex items-center gap-2"
                              >
                                <Plus className="h-5 w-5" />
                                ADD ROW
                              </button>
                            </div>
                            
                            <div className="space-y-4">
                              {seatCount.map((row, idx) => (
                                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-4 border-2 border-black p-4 bg-[#f8fafc]">
                                  <div className="flex-1 min-w-[80px]">
                                    <label className="text-xs font-bold uppercase mb-1 block">ROW</label>
                                    <input 
                                      value={row.row} 
                                      onChange={(e) => updateRow(idx, 'row', e.target.value)} 
                                      className="w-full border-2 border-black p-2 focus:outline-none focus:border-[#EF6400] text-center font-bold" 
                                      placeholder="A" 
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[100px]">
                                    <label className="text-xs font-bold uppercase mb-1 block">COUNT</label>
                                    <input 
                                      value={row.count} 
                                      onChange={(e) => updateRow(idx, 'count', e.target.value)} 
                                      type="number" 
                                      min="1" 
                                      className="w-full border-2 border-black p-2 focus:outline-none focus:border-[#EF6400] font-bold" 
                                    />
                                  </div>
                                  <div className="flex-[2] min-w-[150px]">
                                    <label className="text-xs font-bold uppercase mb-1 block">CATEGORY</label>
                                    <select 
                                      value={row.categoryId} 
                                      onChange={(e) => updateRow(idx, 'categoryId', e.target.value)}
                                      className="w-full border-2 border-black p-2 focus:outline-none focus:border-[#EF6400] font-bold bg-white"
                                    >
                                      {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="self-end pb-1">
                                    <button
                                      type="button"
                                      onClick={() => setSeatCount(seatCount.filter((_, i) => i !== idx))}
                                      className="border-2 border-black bg-rose-500 text-white p-2 hover:bg-black transition-colors"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {seatCount.length > 0 && (
                              <div className="mt-6 border-4 border-black bg-[#4ade80] px-6 py-4 text-black font-black uppercase text-lg shadow-[4px_4px_0_0_#000]">
                                TOTAL SEATS TO GENERATE: {seatCount.reduce((sum, r) => sum + parseInt(r.count.toString() || '0'), 0)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-4 mt-8">
                        <button 
                          onClick={() => setLayoutVenue(null)}
                          className="border-4 border-black bg-white text-black font-black uppercase shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all px-6 py-3"
                        >
                          CANCEL
                        </button>
                        <button 
                          onClick={handleGenerateSeats} 
                          disabled={creating || seatCount.length === 0}
                          className="border-4 border-black bg-[#EF6400] text-black font-black uppercase shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all px-6 py-3 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0_0_#000]"
                        >
                          {creating ? 'GENERATING...' : 'GENERATE SEATS'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>
      </GridPlusBackground>
    </main>
  );
}
