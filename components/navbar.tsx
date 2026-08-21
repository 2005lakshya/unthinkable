'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Ticket, Menu, X, LogOut, User as UserIcon, Calendar, Building2, LayoutDashboard, ClipboardList, ListOrdered, Settings } from 'lucide-react';
import { nostromoMedium, t012 } from '@/app/fonts';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navLinks: { href: string; label: string; icon: React.ElementType }[] = [];

  if (profile?.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'ADMIN', icon: Building2 });
  } else if (profile?.role === 'organiser') {
    navLinks.push({ href: '/organiser', label: 'DASHBOARD', icon: LayoutDashboard });
  } else {
    navLinks.push({ href: '/events', label: 'EVENTS', icon: Calendar });
    if (user) {
      navLinks.push({ href: '/bookings', label: 'MY BOOKINGS', icon: ClipboardList });
      navLinks.push({ href: '/waitlist', label: 'WAITLIST', icon: ListOrdered });
      navLinks.push({ href: '/settings', label: 'SETTINGS', icon: Settings });
    }
  }

  return (
    <nav className={`sticky top-0 z-50 border-b-4 border-black bg-[#D5D1BE] ${nostromoMedium.className}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center border-4 border-black bg-[#EF6400] shadow-[3px_3px_0_0_#000] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all">
            <Ticket className="h-5 w-5 text-black" />
          </div>
          <span className={`text-xl font-black uppercase text-black tracking-widest ${t012.className}`}>BOOKSEAT</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-black uppercase transition-all border-b-4 ${
                  active
                    ? 'border-[#EF6400] text-black'
                    : 'border-transparent text-black/60 hover:text-black hover:border-black'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[2px_2px_0_0_#000]">
                <UserIcon className="h-4 w-4 text-black" />
                <span className="text-sm font-black uppercase text-black truncate max-w-[120px]">
                  {profile?.full_name || user.email?.split('@')[0]}
                </span>
                {profile?.role && (
                  <span className="border border-black bg-[#EF6400] px-1.5 py-0.5 text-xs font-black uppercase text-black">
                    {profile.role}
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 border-4 border-black bg-black px-3 py-1.5 text-sm font-black uppercase text-white shadow-[3px_3px_0_0_#EF6400] hover:bg-[#EF6400] hover:text-black transition-colors"
              >
                <LogOut className="h-4 w-4" />
                OUT
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="border-4 border-black px-4 py-1.5 text-sm font-black uppercase text-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all bg-white"
              >
                SIGN IN
              </Link>
              <Link
                href="/auth/sign-up"
                className="border-4 border-black bg-[#EF6400] px-4 py-1.5 text-sm font-black uppercase text-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden border-4 border-black bg-white p-1 shadow-[3px_3px_0_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t-4 border-black bg-[#D5D1BE] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 border-4 border-black px-4 py-3 text-sm font-black uppercase transition-all ${
                    active ? 'bg-[#EF6400] text-black' : 'bg-white text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-2 pt-2 border-t-4 border-black">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase text-white"
                >
                  <LogOut className="h-4 w-4" />
                  SIGN OUT
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/sign-in" onClick={() => setMobileOpen(false)} className="flex-1 border-4 border-black bg-white px-3 py-3 text-center text-sm font-black uppercase text-black">SIGN IN</Link>
                  <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)} className="flex-1 border-4 border-black bg-[#EF6400] px-3 py-3 text-center text-sm font-black uppercase text-black">SIGN UP</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
