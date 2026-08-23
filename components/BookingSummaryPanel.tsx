'use client';

import React from 'react';
import { Show, Venue, ShowSeat } from '@/lib/supabase/client';
import { t012, nostromoMedium, ruigslay } from '@/app/fonts';

interface BookingSummaryPanelProps {
  show: Show;
  venue: Venue;
  selectedSeats: Set<string>;
  seats: ShowSeat[];
}

export default function BookingSummaryPanel({ show, venue, selectedSeats, seats }: BookingSummaryPanelProps) {
  const selectedSeatObjects = seats.filter(s => selectedSeats.has(s.seat_id));
  const seatLabels = selectedSeatObjects.map(s => `${s.seat_row}-${s.seat_number}`).join(', ');
  const totalPrice = selectedSeatObjects.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <div className="w-full flex justify-center py-4 relative">
      {/* Container exactly fits the image */}
      <div className="relative w-full max-w-[400px]">
        {/* Background Frame */}
        <img 
          src="/payment.png" 
          alt="Ticket Frame" 
          className="w-full h-auto block"
        />
        
        {/* Content overlaid exactly on the ticket bounds */}
        <div className="absolute top-[18%] bottom-[12%] left-[10%] right-[10%] z-10 flex flex-col">
            
            {/* Title and Type */}
            <div className="text-center mb-3">
              <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-widest text-black ${t012.className} truncate px-2 leading-none mb-1`}>
                {show.title || 'EVENT'}
              </h2>
              <p className={`text-sm font-black uppercase tracking-widest opacity-80 ${nostromoMedium.className}`}>
                {show.type}
              </p>
            </div>
            
            <div className={`flex flex-col gap-1 sm:gap-2 text-sm sm:text-base font-bold uppercase ${nostromoMedium.className} w-full`}>
              <div className="flex justify-between border-b-2 border-black/10 pb-1">
                <span className="opacity-60">DATE</span>
                <span className="text-right">{show.show_date}</span>
              </div>
              
              <div className="flex justify-between border-b-2 border-black/10 pb-1">
                <span className="opacity-60">TIME</span>
                <span className="text-right">{show.show_time}</span>
              </div>
              
              <div className="flex justify-between border-b-2 border-black/10 pb-1">
                <span className="opacity-60">VENUE</span>
                <span className="text-right truncate max-w-[140px]">{venue?.name || 'TBD'}</span>
              </div>
              
              <div className="flex justify-between border-b-2 border-black/10 pb-1">
                <span className="opacity-60 shrink-0 mr-4">SEATS</span>
                <span className="text-right text-xs leading-tight max-w-[160px] break-words">{seatLabels}</span>
              </div>

              <div className="flex justify-between border-b-2 border-black/10 pb-1">
                <span className="opacity-60">TOTAL TIX</span>
                <span className="text-right">{selectedSeats.size}</span>
              </div>

              <div className="flex justify-between border-b-2 border-black/10 pb-1">
                <span className="opacity-60">PRICE</span>
                <span className="text-right">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Status placed right above the zig-zags */}
            <div className="mt-auto flex justify-between items-end w-full pt-2">
              <span className={`text-lg font-black uppercase ${nostromoMedium.className}`}>STATUS</span>
              <span className={`text-xl font-black uppercase text-[#EF6400] ${ruigslay.className}`}>HELD</span>
            </div>
            
        </div>
      </div>
    </div>
  );
}
