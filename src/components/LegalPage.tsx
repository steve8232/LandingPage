import Link from 'next/link';
import { Sparkles } from 'lucide-react';

/**
 * Shared chrome for the public legal pages (/privacy, /terms). Mirrors the
 * orange-gradient marketing surface used by WelcomeScreen and
 * NonAdminMarketing so visitors who follow a footer link don't see a
 * sudden style break. Pure server component — no client hooks.
 */
export default function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between px-4 pt-4 pb-2 text-sm">
        <Link href="/" className="flex items-center gap-2 text-gray-900">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">SparkPage</span>
        </Link>
        <Link
          href="/"
          className="text-gray-600 hover:text-orange-600 font-medium"
        >
          Back to home
        </Link>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <article className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Effective date: {effectiveDate}
          </p>
          <div className="legal-prose text-gray-700 leading-relaxed space-y-4">
            {children}
          </div>
        </article>

        <nav className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600">
          <Link href="/privacy" className="hover:text-orange-600">
            Privacy
          </Link>
          <span aria-hidden className="text-gray-300">
            ·
          </span>
          <Link href="/terms" className="hover:text-orange-600">
            Terms
          </Link>
          <span aria-hidden className="text-gray-300">
            ·
          </span>
          <span>© {new Date().getFullYear()} Online Marketing Group, LLC</span>
        </nav>
      </main>
    </div>
  );
}
