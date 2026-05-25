'use client';

import Link from 'next/link';
import { Sparkles, LayoutGrid, ShieldCheck, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Shown on `/` to signed-in users who don't have the 'admin' role.
 * Page creation is admin-only, so the wizard is replaced with a marketing
 * screen that points them at their dashboard and explains the gate.
 */
export default function NonAdminMarketing({ email }: { email: string | null }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between pt-2 pb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-900">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">SparkPage</span>
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="text-gray-500 hidden sm:inline">{email}</span>}
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-full mb-5">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            New pages are created by your admin
          </h1>
          <p className="text-gray-600 mb-6">
            SparkPage creation is restricted to admins. Once an admin builds a
            page and shares it with you, it appears in your dashboard with all
            its form fills, calls, and identified visitors.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 shadow-md shadow-orange-200"
            >
              <LayoutGrid className="w-4 h-4" />
              Go to my dashboard
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Need admin access? Ask your SparkPage admin to add your email to
            the allowlist.
          </p>
        </div>
      </div>
    </div>
  );
}
