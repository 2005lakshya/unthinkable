'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Mail, Lock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { GridPlusBackground } from '@/components/landing/Grid';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (roleParam && profile?.role && roleParam !== profile.role) {
        await supabase.auth.signOut();
        toast({
          title: 'Sign in failed',
          description: 'Please verify your credentials and try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'You have been signed in.',
      });

      if (profile?.role === 'organiser') {
        router.push('/organiser');
      } else if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/events');
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-hidden">
      <GridPlusBackground>
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 z-10 relative">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EF6400]">
                <Ticket className="h-7 w-7 text-black" />
              </div>
              <h1 className="text-3xl font-black text-black">Welcome back</h1>
              <p className="mt-1 text-sm text-black/70">Sign in to your BookSeat account</p>
            </div>

            <div className="border-4 border-black bg-[#D5D1BE] p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-black">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full border-2 border-black bg-transparent py-2.5 pl-10 pr-4 text-sm text-black outline-none transition-colors focus:border-[#EF6400]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-black">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full border-2 border-black bg-transparent py-2.5 pl-10 pr-4 text-sm text-black outline-none transition-colors focus:border-[#EF6400]"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 border-4 border-black bg-[#EF6400] hover:bg-black hover:text-[#EF6400] py-3 text-sm font-black text-black transition-colors disabled:opacity-50"
                >
                  {loading ? 'SIGNING IN...' : 'SIGN IN'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              {roleParam !== 'admin' && (
                <p className="mt-6 text-center text-sm text-black/70 font-bold">
                  Don't have an account?{' '}
                  <Link href={`/auth/sign-up${roleParam ? `?role=${roleParam}` : ''}`} className="text-black hover:text-[#EF6400] underline underline-offset-4">
                    Sign up
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </GridPlusBackground>
    </main>
  );
}
