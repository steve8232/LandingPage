'use client';

import { Sparkles, Zap, Download } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Landing Page Designer
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Create beautiful, conversion-optimized landing pages in minutes. 
            Just answer a few questions and let AI do the rest.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">AI-Powered</h3>
              <p className="text-sm text-gray-600">
                Smart content generation based on your business
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
            className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}

