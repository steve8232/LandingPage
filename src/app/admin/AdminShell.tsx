'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, LogOut, Shield, Users, FileText, Share2, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const TABS: Array<{ href: string; label: string; Icon: typeof Users }> = [
  { href: '/admin/users', label: 'Users', Icon: Users },
  { href: '/admin/pages', label: 'Pages', Icon: FileText },
  { href: '/admin/collaborators', label: 'Collaborators', Icon: Share2 },
];

export default function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-orange-600">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">SparkPage</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
              title="Back to dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <span className="text-gray-500 hidden sm:inline">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        </div>

        <nav className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                  active
                    ? 'border-orange-500 text-orange-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {children}
      </main>
    </div>
  );
}
