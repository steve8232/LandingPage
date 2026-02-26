'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { BusinessInfo } from '@/types';

interface Step2Props {
  data: BusinessInfo;
  onUpdate: (data: BusinessInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2BusinessInfo({ data, onUpdate, onNext, onBack }: Step2Props) {
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB');
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      setError('Logo must be PNG, JPG, or SVG');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdate({ ...data, logo: reader.result });
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    onUpdate({ ...data, logo: undefined });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [...data.images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newImages.push(reader.result);
          onUpdate({ ...data, images: [...newImages] });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    const newImages = data.images.filter((_, i) => i !== index);
    onUpdate({ ...data, images: newImages });
  };

  const handleSubmit = () => {
    if (!data.productService || !data.offer || !data.pricing || !data.cta || !data.uniqueValue || !data.customerLove) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    onNext();
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Information</h2>
        <p className="text-gray-600">Tell us about your business and offer.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className={labelClass}>What product or service do you sell? *</label>
          <input
            type="text"
            value={data.productService}
            onChange={(e) => onUpdate({ ...data, productService: e.target.value })}
            placeholder="e.g., Online fitness coaching, Handmade jewelry, SaaS software"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Business Logo (optional)</label>
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            className="hidden"
          />
          {data.logo ? (
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <img src={data.logo} alt="Logo preview" className="h-16 w-auto object-contain" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Logo uploaded</p>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="text-sm text-blue-600 hover:text-blue-700 mr-3"
                >
                  Change
                </button>
                <button
                  onClick={removeLogo}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600"
            >
              <ImageIcon className="w-5 h-5" />
              Upload your logo (PNG, JPG, SVG - max 2MB)
            </button>
          )}
        </div>

        <div>
          <label className={labelClass}>What is the singular offer you want to promote? *</label>
          <input
            type="text"
            value={data.offer}
            onChange={(e) => onUpdate({ ...data, offer: e.target.value })}
            placeholder="e.g., 12-Week Transformation Program, Custom Engagement Ring, Pro Plan Subscription"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>What is the pricing for this offer? *</label>
          <input
            type="text"
            value={data.pricing}
            onChange={(e) => onUpdate({ ...data, pricing: e.target.value })}
            placeholder="e.g., $997 one-time, $49/month, Starting at $299"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>What is your primary call-to-action? *</label>
          <input
            type="text"
            value={data.cta}
            onChange={(e) => onUpdate({ ...data, cta: e.target.value })}
            placeholder="e.g., Start Your Transformation, Book a Consultation, Get Started Free"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>What makes your business unique? *</label>
          <textarea
            value={data.uniqueValue}
            onChange={(e) => onUpdate({ ...data, uniqueValue: e.target.value })}
            placeholder="What sets you apart from competitors? What's your unique approach or methodology?"
            rows={3}
            className={inputClass + " resize-none"}
          />
        </div>

        <div>
          <label className={labelClass}>Why do your customers love you? *</label>
          <textarea
            value={data.customerLove}
            onChange={(e) => onUpdate({ ...data, customerLove: e.target.value })}
            placeholder="What pain points do you solve? What results or benefits do customers experience?"
            rows={3}
            className={inputClass + " resize-none"}
          />
        </div>

        <div>
          <label className={labelClass}>Product/Service Images (optional)</label>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" multiple className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600"
          >
            <Upload className="w-5 h-5" />
            Click to upload images
          </button>
          {data.images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {data.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
          Back
        </button>
        <button onClick={handleSubmit} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
          Continue
        </button>
      </div>
    </div>
  );
}

