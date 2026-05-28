'use client';

import Link from 'next/link';
import { Sparkles, Zap, Download, LayoutGrid, LogIn, Search, MessageCircle, ArrowRight } from 'lucide-react';
import { useSession } from '@/lib/useSession';
import { useRole } from '@/lib/useRole';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { user, loading } = useSession();
  const { role, loading: roleLoading } = useRole();
  const showAdminChooser = !loading && !roleLoading && !!user && role === 'admin';
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <header className="w-full max-w-2xl mx-auto flex items-center justify-end pt-2 pb-4 text-sm">
        {!loading && (user ? (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-gray-700 hover:text-orange-600 font-medium"
          >
            <LayoutGrid className="w-4 h-4" />
            My SparkPages
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-gray-700 hover:text-orange-600 font-medium"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </Link>
        ))}
      </header>
      <div className="flex-1 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            SparkPage
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Conversion-optimized landing pages for local service businesses.
            Pick a niche template, answer a few questions, and publish.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Niche-Tuned</h3>
              <p className="text-sm text-gray-600">
                18 local-service templates with proven copy and structure
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Mobile-Ready</h3>
              <p className="text-sm text-gray-600">
                Fully responsive designs that look great everywhere
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Ready to Deploy</h3>
              <p className="text-sm text-gray-600">
                Download and deploy to your subdomain instantly
              </p>
            </div>
          </div>

          {showAdminChooser ? (
            <StartChooser onStartTemplate={onStart} />
          ) : (
            <button
              onClick={onStart}
              className="w-full md:w-auto px-8 py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
              Get Started →
            </button>
          )}
        </div>
      </div>
      </div>
      <footer className="w-full max-w-2xl mx-auto flex items-center justify-center gap-4 pt-6 pb-2 text-xs text-gray-500">
        <Link href="/privacy" className="hover:text-orange-600">Privacy</Link>
        <span aria-hidden className="text-gray-300">·</span>
        <Link href="/terms" className="hover:text-orange-600">Terms</Link>
        <span aria-hidden className="text-gray-300">·</span>
        <span>© {new Date().getFullYear()} Online Marketing Group, LLC</span>
      </footer>
    </div>
  );
}


// ── Admin start chooser ────────────────────────────────────────────────────
//
// Replaces the bare "Get Started" CTA for signed-in admins with three
// equally-weighted paths into project creation. Anonymous visitors and
// non-admins are routed away from this surface entirely (NonAdminMarketing
// + the manual wizard), so this list is admin-tailored: "Look up" and
// "Describe" both lean on the research backend; "Start with template" is
// the original wizard kept around for the operator who wants a blank slate.

interface ChooserCardSpec {
  href?: string;
  onClick?: () => void;
  icon: typeof Search;
  title: string;
  body: string;
  accent: 'orange' | 'amber' | 'slate';
}

function StartChooser({ onStartTemplate }: { onStartTemplate: () => void }) {
  const cards: ChooserCardSpec[] = [
    {
      href: '/dashboard/new/research',
      icon: Search,
      title: 'Look up my business',
      body: "We'll research your business and pre-fill the page.",
      accent: 'orange',
    },
    {
      href: '/dashboard/new/chat',
      icon: MessageCircle,
      title: 'Describe my business',
      body: 'Answer four short questions and we research the rest in the background.',
      accent: 'amber',
    },
    {
      onClick: onStartTemplate,
      icon: LayoutGrid,
      title: 'Start with a template',
      body: 'Pick a niche template and fill it in yourself.',
      accent: 'slate',
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-3 text-left">
      {cards.map((c) => (
        <ChooserCard key={c.title} {...c} />
      ))}
    </div>
  );
}

const ACCENTS: Record<ChooserCardSpec['accent'], { iconWrap: string; iconText: string; ring: string }> = {
  orange: { iconWrap: 'bg-orange-100', iconText: 'text-orange-600', ring: 'hover:border-orange-300' },
  amber:  { iconWrap: 'bg-amber-100',  iconText: 'text-amber-700',  ring: 'hover:border-amber-300' },
  slate:  { iconWrap: 'bg-gray-100',   iconText: 'text-gray-700',   ring: 'hover:border-gray-300' },
};

function ChooserCard({ href, onClick, icon: Icon, title, body, accent }: ChooserCardSpec) {
  const a = ACCENTS[accent];
  const inner = (
    <>
      <div className={`inline-flex w-10 h-10 ${a.iconWrap} rounded-lg items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${a.iconText}`} />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
        {title}
        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
      </h3>
      <p className="text-sm text-gray-600">{body}</p>
    </>
  );
  const className = `block p-4 bg-white border-2 border-gray-200 rounded-xl transition-all ${a.ring}`;
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${className} text-left w-full`}>
      {inner}
    </button>
  );
}
