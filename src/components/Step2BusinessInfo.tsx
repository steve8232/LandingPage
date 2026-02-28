'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { BusinessInfo } from '@/types';
import {
  getOptionalFields,
  getV1FormArchetype,
  type TemplateAnswers,
  type TemplateAnswerValue,
} from '@/lib/v1FormSchema';

interface Step2Props {
  data: BusinessInfo;
  templateId?: string;
  onUpdate: (data: BusinessInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2BusinessInfo({ data, templateId, onUpdate, onNext, onBack }: Step2Props) {
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const archetype = getV1FormArchetype(templateId);
  const optionalFields = getOptionalFields(archetype);
  const templateAnswers: TemplateAnswers = data.templateAnswers || {};

  const setTemplateAnswer = (key: string, value: TemplateAnswerValue) => {
    onUpdate({
      ...data,
      templateAnswers: {
        ...templateAnswers,
        [key]: value,
      },
    });
  };

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
    // Keep the core flow lightweight; template-specific details are optional.
    if (!data.productService || !data.cta) {
      setError('Please fill in the required fields');
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
        <p className="text-gray-600">Tell us about your business — we’ll tailor the copy to this template.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className={labelClass}>
            {archetype === 'event'
              ? 'What is your event about? *'
              : archetype === 'waitlist'
                ? 'What are you launching? *'
                : archetype === 'local-service'
                  ? 'What service do you offer? *'
                  : 'What product or service do you sell? *'}
          </label>
          <input
            type="text"
            value={data.productService}
            onChange={(e) => onUpdate({ ...data, productService: e.target.value })}
            placeholder={
              archetype === 'local-service'
                ? 'e.g., Plumbing repair, House cleaning, Mobile detailing'
                : archetype === 'event'
                  ? 'e.g., Live webinar on demand gen for B2B SaaS'
                  : archetype === 'waitlist'
                    ? 'e.g., A new AI scheduling app for clinics'
                    : 'e.g., Online fitness coaching, Handmade jewelry, SaaS software'
            }
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
          <label className={labelClass}>What is the offer you want to promote? <span className="text-gray-400">(optional)</span></label>
          <input
            type="text"
            value={data.offer}
            onChange={(e) => onUpdate({ ...data, offer: e.target.value })}
            placeholder="e.g., 12-Week Transformation Program, Custom Engagement Ring, Pro Plan Subscription"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>What is the pricing for this offer? <span className="text-gray-400">(optional)</span></label>
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
          <label className={labelClass}>What makes you unique? <span className="text-gray-400">(optional)</span></label>
          <textarea
            value={data.uniqueValue}
            onChange={(e) => onUpdate({ ...data, uniqueValue: e.target.value })}
            placeholder="What sets you apart from competitors? What's your unique approach or methodology?"
            rows={3}
            className={inputClass + " resize-none"}
          />
        </div>

        <div>
          <label className={labelClass}>Why do customers love you? <span className="text-gray-400">(optional)</span></label>
          <textarea
            value={data.customerLove}
            onChange={(e) => onUpdate({ ...data, customerLove: e.target.value })}
            placeholder="What pain points do you solve? What results or benefits do customers experience?"
            rows={3}
            className={inputClass + " resize-none"}
          />
        </div>

        {optionalFields.length > 0 && (
          <details className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <summary className="cursor-pointer select-none font-semibold text-gray-800">
              Optional: template-specific details
              <span className="ml-2 text-sm font-normal text-gray-500">
                (helps the AI tailor sections)
              </span>
            </summary>
            <div className="mt-4 space-y-4">
              {optionalFields.map((f) => {
                const current = templateAnswers[f.key];
                if (f.type === 'checkbox') {
                  return (
                    <div key={f.key} className="flex items-start gap-3">
                      <input
                        id={`opt-${f.key}`}
                        type="checkbox"
                        checked={Boolean(current)}
                        onChange={(e) => setTemplateAnswer(f.key, e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <label htmlFor={`opt-${f.key}`} className="text-sm font-medium text-gray-800">
                          {f.label}
                        </label>
                        {f.helpText && <p className="text-xs text-gray-500 mt-1">{f.helpText}</p>}
                      </div>
                    </div>
                  );
                }

                if (f.type === 'select') {
                  return (
                    <div key={f.key}>
                      <label className={labelClass}>{f.label}</label>
                      <select
                        value={typeof current === 'string' ? current : ''}
                        onChange={(e) => setTemplateAnswer(f.key, e.target.value)}
                        className={inputClass}
                      >
	                        <option value="">Select…</option>
                        {(f.options || []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      {f.helpText && <p className="text-xs text-gray-500 mt-1">{f.helpText}</p>}
                    </div>
                  );
                }

                if (f.type === 'textarea') {
                  return (
                    <div key={f.key}>
                      <label className={labelClass}>{f.label}</label>
                      <textarea
                        value={typeof current === 'string' ? current : ''}
                        onChange={(e) => setTemplateAnswer(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        rows={3}
                        className={inputClass + ' resize-none'}
                      />
                      {f.helpText && <p className="text-xs text-gray-500 mt-1">{f.helpText}</p>}
                    </div>
                  );
                }

                // text
                return (
                  <div key={f.key}>
                    <label className={labelClass}>{f.label}</label>
                    <input
                      type="text"
                      value={typeof current === 'string' ? current : ''}
                      onChange={(e) => setTemplateAnswer(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className={inputClass}
                    />
                    {f.helpText && <p className="text-xs text-gray-500 mt-1">{f.helpText}</p>}
                  </div>
                );
              })}
            </div>
          </details>
        )}

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

