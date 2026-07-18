'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '../../actions/auth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Login failed');

      await setToken(result.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f3eb] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <span className="text-[#f3654d] text-4xl -rotate-12 select-none mb-2" aria-hidden="true">♥</span>
        <h2 className="text-center text-3xl font-bold font-serif text-[#132822]">
          Sign in to Dashboard
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#fffdf9] py-8 px-4 shadow-sm border border-[#dfe3dc] sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-[#fff0ec] border border-[#a72c1b] text-[#a72c1b] px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-[#132822]">Email Address</label>
              <div className="mt-1">
                <input name="email" type="email" required className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#132822]">Password</label>
              <div className="mt-1">
                <input name="password" type="password" required className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#145a46] hover:bg-[#0d3e32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#145a46] disabled:bg-[#80b18a] transition-colors cursor-pointer">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#dfe3dc]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#fffdf9] text-[#66746e]">Don't have an account?</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/auth/register"
                  className="w-full flex justify-center py-2.5 px-4 border border-[#dfe3dc] rounded-md shadow-sm text-sm font-bold text-[#145a46] bg-white hover:bg-[#e4f0e6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#145a46] transition-colors"
                >
                  Register Foundation
                </Link>
                <Link
                  href="/"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-bold text-[#66746e] hover:text-[#132822] hover:bg-[#dfe3dc] transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
