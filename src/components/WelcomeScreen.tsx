'use client';

import { Sparkles, Zap, Download } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
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

          <button
            onClick={onStart}
            className="w-full md:w-auto px-8 py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}

