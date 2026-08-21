'use client';

import { useEffect, useState } from 'react';
import { supabase, Show, Venue } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Calendar, MapPin, Clock, Film, Music, Search, Filter, User, ClipboardList, Settings, LogOut, ChevronDown, Ticket } from 'lucide-react';
import { GridPlusBackground } from '@/components/landing/Grid';
import { ruigslay, nostromoMedium, t012 } from '@/app/fonts';

export default function EventsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [venues, setVenues] = useState<Record<string, Venue>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'concert'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, profile, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role === 'admin') router.push('/admin');
      else if (profile.role === 'organiser') router.push('/organiser');
    }
  }, [profile, authLoading, router]);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    setLoading(true);
    const { data: showData } = await supabase
      .from('shows')
      .select('*')
      .eq('status', 'active')
      .order('show_date', { ascending: true });

    if (showData) {
      setShows(showData as Show[]);
      const venueIds = Array.from(new Set(showData.map((s: Show) => s.venue_id)));
      if (venueIds.length > 0) {
        const { data: venueData } = await supabase
          .from('venues')
          .select('*')
          .in('id', venueIds);
        if (venueData) {
          const map: Record<string, Venue> = {};
          venueData.forEach((v: Venue) => { map[v.id] = v; });
          setVenues(map);
        }
      }
    }
    setLoading(false);
  };

  const cities = Array.from(new Set(Object.values(venues).map(v => v.city).filter(Boolean))) as string[];

  const filteredShows = shows.filter((show) => {
    if (typeFilter !== 'all' && show.type !== typeFilter) return false;
    if (cityFilter !== 'all' && venues[show.venue_id]?.city !== cityFilter) return false;
    if (search && !show.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-x-hidden">
      <GridPlusBackground>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 relative z-10">

          {/* Floating user menu — top right */}
          {user && (
            <div className="fixed top-4 right-4 z-50">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2 border-4 border-black bg-white px-4 py-2 font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
              >
                <div className="flex h-6 w-6 items-center justify-center border-2 border-black bg-[#EF6400]">
                  <User className="h-3 w-3 text-black" />
                </div>
                <span className="hidden sm:block max-w-[100px] truncate">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  {/* Dropdown */}
                  <div className={`absolute right-0 top-full mt-2 z-50 w-56 border-4 border-black bg-[#D5D1BE] shadow-[6px_6px_0_0_#000] ${nostromoMedium.className}`}>
                    <div className="border-b-4 border-black bg-black px-4 py-3">
                      <p className="text-xs font-black uppercase text-white/60">SIGNED IN AS</p>
                      <p className="font-black uppercase text-white truncate text-sm mt-0.5">{user.email}</p>
                    </div>
                    <Link
                      href="/bookings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 border-b-2 border-black px-4 py-3 font-black uppercase text-black hover:bg-[#EF6400] transition-colors"
                    >
                      <ClipboardList className="h-4 w-4" />
                      MY BOOKINGS
                    </Link>
                    <Link
                      href="/waitlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 border-b-2 border-black px-4 py-3 font-black uppercase text-black hover:bg-[#EF6400] transition-colors"
                    >
                      <Ticket className="h-4 w-4" />
                      MY WAITLIST
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 border-b-4 border-black px-4 py-3 font-black uppercase text-black hover:bg-[#EF6400] transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      SETTINGS
                    </Link>
                    <button
                      onClick={async () => { setUserMenuOpen(false); await signOut(); router.push('/'); }}
                      className="flex w-full items-center gap-3 bg-black px-4 py-3 font-black uppercase text-white hover:bg-[#EF6400] hover:text-black transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      SIGN OUT
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!user && (
            <div className="fixed top-4 right-4 z-50 flex gap-2">
              <Link
                href="/auth/sign-in"
                className={`border-4 border-black bg-white px-4 py-2 text-sm font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
              >
                SIGN IN
              </Link>
              <Link
                href="/auth/sign-up"
                className={`border-4 border-black bg-[#EF6400] px-4 py-2 text-sm font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
              >
                SIGN UP
              </Link>
            </div>
          )}

          <div className="mb-12">
            <h1 className={`text-5xl md:text-7xl font-black text-black uppercase ${t012.className}`}>BROWSE EVENTS</h1>
            <p className={`mt-2 text-xl text-black/80 font-bold uppercase ${nostromoMedium.className}`}>
              FIND MOVIES AND CONCERTS WITH LIVE SEAT AVAILABILITY
            </p>
          </div>

          {/* Filters */}
          <div className="mb-12 flex flex-col gap-4 border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000] sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH EVENTS..."
                className={`w-full border-4 border-black bg-[#f8fafc] py-3 pl-12 pr-4 outline-none focus:border-[#EF6400] text-black font-black uppercase ${nostromoMedium.className}`}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative flex items-center border-4 border-black bg-[#fcd34d] px-4 py-3 cursor-pointer group hover:bg-[#fbbf24] transition-colors">
                <Filter className="h-5 w-5 text-black mr-2" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'movie' | 'concert')}
                  className={`appearance-none bg-transparent outline-none text-black font-black uppercase cursor-pointer pr-4 ${nostromoMedium.className}`}
                >
                  <option value="all">ALL TYPES</option>
                  <option value="movie">MOVIES</option>
                  <option value="concert">CONCERTS</option>
                </select>
              </div>
              <div className="relative flex items-center border-4 border-black bg-[#A3E4D7] px-4 py-3 cursor-pointer group hover:bg-[#73c6b6] transition-colors">
                <MapPin className="h-5 w-5 text-black mr-2" />
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className={`appearance-none bg-transparent outline-none text-black font-black uppercase cursor-pointer pr-4 ${nostromoMedium.className}`}
                >
                  <option value="all">ALL CITIES</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 border-4 border-black bg-white shadow-[8px_8px_0_0_#000] animate-pulse p-4" />
              ))}
            </div>
          ) : filteredShows.length === 0 ? (
            <div className="border-4 border-black bg-white p-16 text-center shadow-[12px_12px_0_0_#000]">
              <Search className="mx-auto mb-4 h-16 w-16 text-black/40" />
              <p className={`text-2xl font-black text-black/60 uppercase ${ruigslay.className}`}>NO EVENTS FOUND. TRY ADJUSTING YOUR FILTERS.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredShows.map((show) => {
                const venue = venues[show.venue_id];
                const TypeIcon = show.type === 'movie' ? Film : Music;
                return (
                  <Link
                    key={show.id}
                    href={`/events/${show.id}`}
                    className="group flex flex-col border-4 border-black bg-white shadow-[8px_8px_0_0_#000] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all"
                  >
                    <div className="relative h-48 border-b-4 border-black overflow-hidden bg-black">
                      {show.poster_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={show.poster_url}
                          alt={show.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[#c0a9fa]">
                          <TypeIcon className="h-16 w-16 text-black" />
                        </div>
                      )}
                      <div className="absolute left-0 top-0 border-r-4 border-b-4 border-black">
                        <span className={`flex items-center gap-1.5 px-3 py-2 text-sm font-black uppercase ${nostromoMedium.className} ${
                          show.type === 'movie'
                            ? 'bg-[#3b82f6] text-white'
                            : 'bg-[#f43f5e] text-white'
                        }`}>
                          <TypeIcon className="h-4 w-4" />
                          {show.type === 'movie' ? 'MOVIE' : 'CONCERT'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1 bg-[#D5D1BE]/20">
                      <h3 className={`text-2xl font-black text-black group-hover:text-[#EF6400] transition-colors line-clamp-2 ${ruigslay.className}`}>
                        {show.title}
                      </h3>
                      {show.description && (
                        <p className="mt-3 line-clamp-2 text-sm text-black font-medium border-l-4 border-black pl-3 bg-white/50 py-1">
                          {show.description}
                        </p>
                      )}
                      
                      <div className="mt-auto pt-6 space-y-3">
                        <div className={`flex items-center gap-2 border-2 border-black bg-[#fcd34d] px-3 py-1.5 shadow-[2px_2px_0_0_#000] w-fit text-xs font-black uppercase ${nostromoMedium.className} text-black`}>
                          <Calendar className="h-4 w-4" />
                          {new Date(show.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          <Clock className="ml-1 h-4 w-4" />
                          {show.show_time}
                        </div>
                        {venue && (
                          <div className={`flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0_0_#000] w-fit text-xs font-black uppercase ${nostromoMedium.className} text-black max-w-full overflow-hidden text-ellipsis whitespace-nowrap`}>
                            <MapPin className="h-4 w-4 shrink-0" />
                            {venue.name}, {venue.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </GridPlusBackground>
    </main>
  );
}
