'use client';

import Link from 'next/link';
import { Ticket, MapPin, Clock, Users, QrCode, ShieldCheck, ArrowRight, Star } from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400">
              <Star className="h-4 w-4" />
              Real-time seat booking for movies & concerts
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Never miss a seat.
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Book it before it's gone.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
              Pick your seats from a live visual map, hold them instantly, and get a QR code
              ticket delivered to your inbox. Join the waitlist when shows sell out — we'll
              auto-assign seats when others cancel.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/events"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30"
              >
                Browse Events
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/sign-up"
                className="rounded-xl border border-slate-600 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
          <p className="mt-2 text-slate-500">From seat selection to QR code ticket in minutes</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={MapPin}
            title="Visual Seat Map"
            description="See every seat in real time — available, held, or booked. Pick exactly where you want to sit."
            color="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon={Clock}
            title="10-Minute Hold"
            description="Selected seats are held for you with a countdown timer. No one else can grab them while you check out."
            color="from-amber-500 to-orange-500"
          />
          <FeatureCard
            icon={Users}
            title="Smart Waitlist"
            description="Shows sold out? Join the waitlist. When someone cancels, the next person gets the seat automatically."
            color="from-emerald-500 to-teal-500"
          />
          <FeatureCard
            icon={QrCode}
            title="QR Code Tickets"
            description="Get a QR code ticket emailed instantly after booking. Just scan at the venue entrance."
            color="from-violet-500 to-purple-500"
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Concurrency Safe"
            description="Two people can't book the same seat — database-level locking prevents double bookings."
            color="from-rose-500 to-pink-500"
          />
          <FeatureCard
            icon={Ticket}
            title="For Organisers"
            description="Create events, set per-category pricing, and track revenue — all from one dashboard."
            color="from-indigo-500 to-blue-500"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to book your next experience?</h2>
          <p className="mt-4 text-slate-300">Browse live events and secure your seats now.</p>
          <Link
            href="/events"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl"
          >
            Browse Events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">BookSeat</span>
          </div>
          <p className="text-sm text-slate-500">Ticket booking platform for movies and concerts</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: typeof Ticket;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}
