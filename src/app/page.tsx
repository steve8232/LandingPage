'use client';

import { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import ProgressIndicator from '@/components/ProgressIndicator';
import Step0TemplateSelect from '@/components/Step0TemplateSelect';
import Step1DesignInput from '@/components/Step1DesignInput';
import Step2BusinessInfo from '@/components/Step2BusinessInfo';
import Step3ContactInfo from '@/components/Step3ContactInfo';
import GeneratingScreen from '@/components/GeneratingScreen';
import PreviewDownload from '@/components/PreviewDownload';
import { FormData, GeneratedLandingPage, DesignInput, BusinessInfo, ContactInfo, Template } from '@/types';

type AppState = 'welcome' | 'form' | 'generating' | 'preview';

// Steps now include Template selection (step 0)
// If user chose to customize with URL, they see Design step
// Otherwise they skip to Business Info
const STEPS_WITH_DESIGN = ['Template', 'Design', 'Business Info', 'Contact'];
const STEPS_NO_DESIGN = ['Template', 'Business Info', 'Contact'];

const initialFormData: FormData = {
  selectedTemplate: undefined,
  customizeWithUrl: false,
  design: { option: 'description' },
  business: {
    productService: '',
    offer: '',
    pricing: '',
    cta: '',
    uniqueValue: '',
    customerLove: '',
    images: [],
  },
  contact: { email: '', phone: '' },
};

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generatingStage, setGeneratingStage] = useState('');
  const [landingPage, setLandingPage] = useState<GeneratedLandingPage | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine which steps to show based on whether user wants to customize with URL
  const steps = formData.customizeWithUrl ? STEPS_WITH_DESIGN : STEPS_NO_DESIGN;

  const updateTemplate = (template: Template, customizeWithUrl: boolean) => {
    setFormData(prev => ({ ...prev, selectedTemplate: template, customizeWithUrl }));
    setCurrentStep(1);
  };
  const updateDesign = (design: DesignInput) => setFormData(prev => ({ ...prev, design }));
  const updateBusiness = (business: BusinessInfo) => setFormData(prev => ({ ...prev, business }));
  const updateContact = (contact: ContactInfo) => setFormData(prev => ({ ...prev, contact }));

  const generateLandingPage = async () => {
    setIsSubmitting(true);
    setError('');

    // Switch to generating screen after a short delay
    setTimeout(() => setAppState('generating'), 100);

    const stages = [
      'Analyzing your inputs...',
      'Crafting compelling headlines...',
      'Generating testimonials...',
      'Building your landing page...',
      'Applying styles and polish...',
      'Almost done...',
    ];

    let stageIndex = 0;
    const stageInterval = setInterval(() => {
      if (stageIndex < stages.length) {
        setGeneratingStage(stages[stageIndex]);
        stageIndex++;
      }
    }, 5000);

    try {
      setGeneratingStage(stages[0]);

      const response = await fetch('/api/generate-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      clearInterval(stageInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate landing page');
      }

      const result = await response.json();
      setLandingPage({
        html: result.html,
        css: result.css,
        preview: result.preview,
	      v1: result.v1,
      });
      setAppState('preview');
    } catch (err) {
      clearInterval(stageInterval);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAppState('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startOver = () => {
    setFormData(initialFormData);
    setCurrentStep(0);
    setLandingPage(null);
    setAppState('welcome');
  };

  if (appState === 'welcome') {
    return <WelcomeScreen onStart={() => setAppState('form')} />;
  }

  if (appState === 'generating') {
    return <GeneratingScreen stage={generatingStage} />;
  }

  if (appState === 'preview' && landingPage) {
    return (
      <PreviewDownload
        landingPage={landingPage}
        onStartOver={startOver}
        formData={formData}
        testimonialCount={8}
      />
    );
  }

  // Determine which component to show based on step and customizeWithUrl
  const renderStep = () => {
    // Step 0: Template Selection
    if (currentStep === 0) {
      return (
        <Step0TemplateSelect onSelect={updateTemplate} />
      );
    }

    // If customizing with URL: steps are [Template, Design, Business, Contact]
    // If not: steps are [Template, Business, Contact]
    if (formData.customizeWithUrl) {
      // Step 1: Design Input (URL analysis)
      if (currentStep === 1) {
        return (
          <Step1DesignInput
            data={formData.design}
            onUpdate={updateDesign}
            onNext={() => setCurrentStep(2)}
            onBack={() => setCurrentStep(0)}
          />
        );
      }
      // Step 2: Business Info
      if (currentStep === 2) {
        return (
          <Step2BusinessInfo
	            templateId={formData.selectedTemplate?.id}
            data={formData.business}
            onUpdate={updateBusiness}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        );
      }
      // Step 3: Contact Info
      if (currentStep === 3) {
        return (
          <Step3ContactInfo
	            templateId={formData.selectedTemplate?.id}
            data={formData.contact}
            onUpdate={updateContact}
            onSubmit={generateLandingPage}
            onBack={() => setCurrentStep(2)}
            isGenerating={isSubmitting}
          />
        );
      }
    } else {
      // Without URL customization: skip design step
      // Step 1: Business Info
      if (currentStep === 1) {
        return (
          <Step2BusinessInfo
	            templateId={formData.selectedTemplate?.id}
            data={formData.business}
            onUpdate={updateBusiness}
            onNext={() => setCurrentStep(2)}
            onBack={() => setCurrentStep(0)}
          />
        );
      }
      // Step 2: Contact Info
      if (currentStep === 2) {
        return (
          <Step3ContactInfo
	            templateId={formData.selectedTemplate?.id}
            data={formData.contact}
            onUpdate={updateContact}
            onSubmit={generateLandingPage}
            onBack={() => setCurrentStep(1)}
            isGenerating={isSubmitting}
          />
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className={currentStep === 0 ? "max-w-5xl mx-auto" : "max-w-2xl mx-auto"}>
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <ProgressIndicator currentStep={currentStep} steps={steps} />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}
        </div>
      </div>
    </div>
  );
}
