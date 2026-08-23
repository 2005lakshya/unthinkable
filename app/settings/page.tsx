'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save, ArrowLeft, User, Mail, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GridPlusBackground } from '@/components/landing/Grid';
import { ruigslay, nostromoMedium, t012 } from '@/app/fonts';

export default function SettingsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in?role=customer');
      return;
    }
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [user, profile, authLoading, router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!', description: 'Your name has been saved.' });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push('/');
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#D5D1BE] flex items-center justify-center">
        <GridPlusBackground>
          <Loader2 className="h-12 w-12 animate-spin text-black relative z-10" />
        </GridPlusBackground>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#D5D1BE]">
      <GridPlusBackground>
        <div className="mx-auto max-w-2xl px-4 py-8 relative z-10">
          <Link
            href="/events"
            className={`inline-flex items-center gap-2 mb-8 border-b-4 border-black pb-1 font-bold uppercase text-black hover:text-[#EF6400] transition-colors ${nostromoMedium.className}`}
          >
            <ArrowLeft className="h-5 w-5" />
            BACK
          </Link>

          <h1 className={`mb-8 text-5xl md:text-6xl font-black text-black uppercase border-b-8 border-black pb-4 ${t012.className}`}>
            SETTINGS
          </h1>

          <div className="flex flex-col gap-6">
            {/* Account Info Card */}
            <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] p-6">
              <h2 className={`text-xl font-black uppercase text-black border-b-4 border-black pb-3 mb-6 ${nostromoMedium.className}`}>
                ACCOUNT INFO
              </h2>

              {/* Email (read-only) */}
              <div className="mb-6">
                <label className={`block text-xs font-black uppercase text-black/60 mb-2 ${nostromoMedium.className}`}>
                  <Mail className="inline h-3 w-3 mr-1" />
                  EMAIL ADDRESS
                </label>
                <div className={`border-4 border-black/30 bg-[#D5D1BE]/50 px-4 py-3 font-bold text-black/70 ${nostromoMedium.className}`}>
                  {user?.email}
                </div>
              </div>

              {/* Full Name (editable) */}
              <div className="mb-6">
                <label className={`block text-xs font-black uppercase text-black/60 mb-2 ${nostromoMedium.className}`}>
                  <User className="inline h-3 w-3 mr-1" />
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name..."
                  className={`w-full border-4 border-black bg-white px-4 py-3 text-black font-bold uppercase focus:outline-none focus:bg-[#fcd34d] transition-colors ${nostromoMedium.className}`}
                />
              </div>

              {/* Role */}
              <div className="mb-8">
                <label className={`block text-xs font-black uppercase text-black/60 mb-2 ${nostromoMedium.className}`}>
                  <ShieldCheck className="inline h-3 w-3 mr-1" />
                  ACCOUNT ROLE
                </label>
                <div className={`inline-block border-2 border-black bg-[#EF6400] px-4 py-2 text-sm font-black uppercase text-black ${nostromoMedium.className}`}>
                  {profile?.role || 'CUSTOMER'}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 border-4 border-black bg-[#4ade80] py-4 text-lg font-black uppercase text-black shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50 ${nostromoMedium.className}`}
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>

            {/* Quick Links */}
            <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] p-6">
              <h2 className={`text-xl font-black uppercase text-black border-b-4 border-black pb-3 mb-6 ${nostromoMedium.className}`}>
                QUICK LINKS
              </h2>
              <div className="flex flex-col gap-3">
                <Link
                  href="/bookings"
                  className={`flex items-center justify-between border-4 border-black bg-[#D5D1BE] px-5 py-4 font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
                >
                  <span>MY BOOKINGS</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/waitlist"
                  className={`flex items-center justify-between border-4 border-black bg-[#D5D1BE] px-5 py-4 font-black uppercase text-black shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${nostromoMedium.className}`}
                >
                  <span>MY WAITLIST</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] p-6">
              <h2 className={`text-xl font-black uppercase text-black border-b-4 border-black pb-3 mb-6 ${nostromoMedium.className}`}>
                DANGER ZONE
              </h2>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className={`w-full border-4 border-black bg-black py-4 text-lg font-black uppercase text-white shadow-[6px_6px_0_0_#EF6400] hover:bg-[#EF6400] hover:text-black transition-colors disabled:opacity-50 ${nostromoMedium.className}`}
              >
                {signingOut ? 'SIGNING OUT...' : 'SIGN OUT'}
              </button>
            </div>
          </div>
        </div>
      </GridPlusBackground>
    </main>
  );
}
