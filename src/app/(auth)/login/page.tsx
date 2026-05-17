'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push('/quran');
      router.refresh();
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-semibold text-[#2D6A4F]">Sabil</h1>
        <p className="font-arabic text-[#2D6A4F] text-lg mt-1" dir="rtl">سبيل</p>
      </div>

      <p className="text-[#1A1A1A] font-medium mb-1">Welcome back</p>
      <p className="text-[#6B7280] text-sm mb-6">Sign in to continue your journey</p>

      {error && (
        <div className="mb-4 text-sm text-[#DC2626]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-[14px] py-[10px] border border-[#E8E0D5] rounded-lg focus:outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-[14px] py-[10px] border border-[#E8E0D5] rounded-lg focus:outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#2D6A4F] text-white py-3 rounded-lg font-medium hover:bg-[#1B4332] transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Don't have an account?{' '}
        <a href="/register" className="text-[#B7922A] hover:underline">
          Register
        </a>
      </p>
    </div>
  );
}