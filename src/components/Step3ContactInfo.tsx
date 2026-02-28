'use client';

import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { ContactInfo } from '@/types';
import { getV1FormArchetype, isPhoneRequired } from '@/lib/v1FormSchema';

interface Step3Props {
  data: ContactInfo;
  templateId?: string;
  onUpdate: (data: ContactInfo) => void;
  onSubmit: () => void;
  onBack: () => void;
  isGenerating: boolean;
}

export default function Step3ContactInfo({ data, templateId, onUpdate, onSubmit, onBack, isGenerating }: Step3Props) {
  const [error, setError] = useState('');

  const archetype = getV1FormArchetype(templateId);
  const phoneRequired = isPhoneRequired(archetype);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    return phone;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    onUpdate({ ...data, phone: value });
  };

  const handleSubmit = () => {
    if (!data.email || (phoneRequired && !data.phone)) {
      setError('Please fill in the required fields');
      return;
    }

    if (!validateEmail(data.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Phone is only required for certain template archetypes (e.g. local service).
    if (phoneRequired) {
      if (data.phone.length < 10) {
        setError('Please enter a valid phone number');
        return;
      }
    } else {
      // If provided, validate it; otherwise allow it to be blank.
      if (data.phone && data.phone.length > 0 && data.phone.length < 10) {
        setError('Please enter a valid phone number (or leave it blank)');
        return;
      }
    }

    setError('');
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
        <p className="text-gray-600">
          These details will be displayed on your landing page for visitors to contact you.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address *
            </span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate({ ...data, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Form submissions from your landing page will be sent to this email.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
	              Phone Number {phoneRequired ? '*' : <span className="text-gray-400">(optional)</span>}
            </span>
          </label>
          <input
            type="tel"
            value={formatPhone(data.phone)}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
		          <p className="text-xs text-gray-500 mt-1">
		            {phoneRequired
		              ? 'This will appear as a clickable phone number on your landing page.'
		              : 'Optional — include this if you want a clickable phone number on the page.'}
		          </p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Ready to generate your landing page?</h4>
        <p className="text-sm text-blue-700">
          Our AI will create a custom landing page based on your inputs. This typically takes 30-60 seconds.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Landing Page'
          )}
        </button>
      </div>
    </div>
  );
}

