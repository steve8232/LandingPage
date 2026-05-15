import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 md:p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Sign-in link expired or invalid</h1>
        <p className="text-sm text-gray-600 mb-2">
          That magic link couldn&apos;t be exchanged for a session. Magic links are
          single-use and expire after about an hour.
        </p>
        {reason && (
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-3 py-2 mb-6 font-mono break-all">
            {reason}
          </p>
        )}
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
        >
          Request a new link
        </Link>
      </div>
    </div>
  );
}
