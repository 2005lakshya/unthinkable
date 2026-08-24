'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { GridPlusBackground } from '@/components/landing/Grid';
import { useSearchParams } from 'next/navigation';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') as 'customer' | 'organiser' || 'customer';
  
  const [role, setRole] = useState<'customer' | 'organiser'>(defaultRole);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
        },
      },
    });

    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (data.session) {
      toast({
        title: 'Welcome to BookSeat!',
        description: 'Your account has been created.',
      });
      router.push(role === 'organiser' ? '/organiser' : '/events');
    } else {
      toast({
        title: 'Check your email',
        description: 'Confirm your email to complete sign up.',
      });
      router.push('/auth/sign-in');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen w-full bg-[#D5D1BE] relative overflow-hidden">
      <GridPlusBackground>
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 z-10 relative">
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
            <Link href="/auth/choose-role" className="flex items-center gap-2 text-black hover:text-[#EF6400] font-bold transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              <span>Back</span>
            </Link>
          </div>
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EF6400]">
                <Ticket className="h-7 w-7 text-black" />
              </div>
              <h1 className="text-3xl font-black text-black">Create account</h1>
              <p className="mt-1 text-sm text-black/70">Join BookSeat to book tickets for movies and concerts</p>
            </div>

            <div className="border-4 border-black bg-[#D5D1BE] p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-black">I want to</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`flex items-center justify-center gap-2 border-2 py-3 text-sm font-bold transition-all ${
                        role === 'customer'
                          ? 'border-black bg-black text-[#EF6400]'
                          : 'border-black/30 text-black/50 hover:border-black'
                      }`}
                    >
                      {role === 'customer' && <Check className="h-4 w-4" />}
                      Book Tickets
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('organiser')}
                      className={`flex items-center justify-center gap-2 border-2 py-3 text-sm font-bold transition-all ${
                        role === 'organiser'
                          ? 'border-black bg-black text-[#EF6400]'
                          : 'border-black/30 text-black/50 hover:border-black'
                      }`}
                    >
                      {role === 'organiser' && <Check className="h-4 w-4" />}
                      Host Events
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-black">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full border-2 border-black bg-transparent py-2.5 pl-10 pr-4 text-sm text-black outline-none transition-colors focus:border-[#EF6400]"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

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
                  <label className="mb-1.5 block text-sm font-bold text-black">Phone (optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border-2 border-black bg-transparent py-2.5 pl-10 pr-4 text-sm text-black outline-none transition-colors focus:border-[#EF6400]"
                      placeholder="+1 234 567 890"
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
                      minLength={6}
                      className="w-full border-2 border-black bg-transparent py-2.5 pl-10 pr-4 text-sm text-black outline-none transition-colors focus:border-[#EF6400]"
                      placeholder="Min 6 characters"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 border-4 border-black bg-[#EF6400] hover:bg-black hover:text-[#EF6400] py-3 text-sm font-black text-black transition-colors disabled:opacity-50"
                >
                  {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-black/70 font-bold">
                Already have an account?{' '}
                <Link href="/auth/sign-in" className="text-black hover:text-[#EF6400] underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </GridPlusBackground>
    </main>
  );
}
