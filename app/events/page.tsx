'use client';

import { useEffect, useState } from 'react';
import { supabase, Show, Venue } from '@/lib/supabase/client';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Film, Music, Search, Filter } from 'lucide-react';

export default function EventsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [venues, setVenues] = useState<Record<string, Venue>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'concert'>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

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
      const venueIds = [...new Set(showData.map((s: Show) => s.venue_id))];
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Browse Events</h1>
        <p className="mt-1 text-slate-500">Find movies and concerts with live seat availability</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'movie' | 'concert')}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
          >
            <option value="all">All Types</option>
            <option value="movie">Movies</option>
            <option value="concert">Concerts</option>
          </select>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
          >
            <option value="all">All Cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : filteredShows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No events found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShows.map((show) => {
            const venue = venues[show.venue_id];
            const TypeIcon = show.type === 'movie' ? Film : Music;
            return (
              <Link
                key={show.id}
                href={`/events/${show.id}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                  {show.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={show.poster_url}
                      alt={show.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <TypeIcon className="h-12 w-12 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3">
                    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      show.type === 'movie'
                        ? 'bg-blue-500/90 text-white'
                        : 'bg-rose-500/90 text-white'
                    }`}>
                      <TypeIcon className="h-3 w-3" />
                      {show.type === 'movie' ? 'Movie' : 'Concert'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-amber-600">{show.title}</h3>
                  {show.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{show.description}</p>
                  )}
                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {new Date(show.show_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      <Clock className="ml-1 h-4 w-4 text-slate-400" />
                      {show.show_time}
                    </div>
                    {venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
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
  );
}
