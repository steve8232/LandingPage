'use client';

import { Sparkles } from 'lucide-react';

interface GeneratingScreenProps {
  stage: string;
}

export default function GeneratingScreen({ stage }: GeneratingScreenProps) {
  const stages = [
    'Analyzing your inputs...',
    'Crafting compelling headlines...',
    'Generating testimonials...',
    'Building your landing page...',
    'Applying styles and polish...',
    'Almost done...'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-blue-600 rounded-full animate-ping opacity-25" />
          <div className="relative w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Creating Your Landing Page
        </h2>

        <p className="text-gray-600 mb-8">
          {stage || stages[0]}
        </p>

        <div className="space-y-3">
          {stages.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-left text-sm ${
                stages.indexOf(stage) >= i ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  stages.indexOf(stage) > i
                    ? 'bg-green-500'
                    : stages.indexOf(stage) === i
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-300'
                }`}
              />
              {s}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-8">
          This typically takes 30-60 seconds
        </p>
      </div>
    </div>
  );
}

