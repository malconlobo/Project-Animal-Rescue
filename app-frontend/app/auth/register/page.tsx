'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '../../actions/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Client-side validations
    if (String(data.password).length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im;
    if (!phoneRegex.test(String(data.phone))) {
      setError('Please enter a valid phone number.');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(data.email))) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Registration failed');

      // Save token securely in HttpOnly cookie via Server Action
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
          Foundation Registration
        </h2>
        <p className="mt-2 text-center text-sm text-[#66746e]">
          Already registered?{' '}
          <Link href="/auth/login" className="font-bold text-[#145a46] hover:text-[#0d3e32] hover:underline">
            Sign in
          </Link>
        </p>
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
              <label className="block text-sm font-bold text-[#132822]">Organization Name <span className="text-[#f3654d]">*</span></label>
              <div className="mt-1">
                <input name="name" type="text" required className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#132822]">City <span className="text-[#f3654d]">*</span></label>
                <div className="mt-1">
                  <select name="city" required defaultValue="" className="block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]">
                    <option value="" disabled>Select a city</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#132822]">Area</label>
                <div className="mt-1">
                  <input name="area" type="text" className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#132822]">Rescue Type</label>
              <div className="mt-1">
                <input name="type" type="text" placeholder="e.g. Wildlife, Domestic" className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#132822]">Avg Response Time</label>
                <div className="mt-1">
                  <input name="responseTime" type="text" placeholder="e.g. 15 mins" className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#132822]">Phone <span className="text-[#f3654d]">*</span></label>
                <div className="mt-1">
                  <input name="phone" type="tel" required className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#132822]">Email Address <span className="text-[#f3654d]">*</span></label>
              <div className="mt-1">
                <input name="email" type="email" required className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#132822]">Password <span className="text-[#f3654d]">*</span></label>
              <div className="mt-1">
                <input name="password" type="password" required className="appearance-none block w-full px-3 py-2.5 border border-[#dfe3dc] rounded-md shadow-sm focus:outline-none focus:ring-[#145a46] focus:border-[#145a46] sm:text-sm bg-white text-[#132822]" />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[#145a46] hover:bg-[#0d3e32] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#145a46] disabled:bg-[#80b18a] transition-colors cursor-pointer">
                {loading ? 'Registering...' : 'Register Organization'}
              </button>
              <Link
                href="/"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-bold text-[#66746e] hover:text-[#132822] hover:bg-[#dfe3dc] transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
