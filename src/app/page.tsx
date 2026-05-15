'use client';

import { useEffect, useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import ProgressIndicator from '@/components/ProgressIndicator';
import Step0TemplateSelect from '@/components/Step0TemplateSelect';
import Step1DesignInput from '@/components/Step1DesignInput';
import Step2BusinessInfo from '@/components/Step2BusinessInfo';
import Step3ContactInfo from '@/components/Step3ContactInfo';
import GeneratingScreen from '@/components/GeneratingScreen';
import PreviewDownload from '@/components/PreviewDownload';
import { FormData, GeneratedLandingPage, DesignInput, BusinessInfo, ContactInfo, Template } from '@/types';
import {
  clearActiveV1EditorSession,
  loadActiveV1EditorSession,
  makeClientResultId,
} from '@/lib/v1EditorStorage';
import { buildPrefillFromSpec } from '@/lib/specToFormData';
import { getProject } from '@/lib/projects/remoteStorage';

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
  const [bootStatus, setBootStatus] = useState<'checking' | 'restoring' | 'done'>('checking');
  const [appState, setAppState] = useState<AppState>('welcome');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generatingStage, setGeneratingStage] = useState('');
  const [landingPage, setLandingPage] = useState<GeneratedLandingPage | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A1: Boot strategy:
  //   1. If `?project=<id>` is present, load that cloud project (Phase 2).
  //   2. Otherwise, fall back to the last locally-saved v1 session.
  // Initial render is gated to avoid a flash of the welcome screen.
  useEffect(() => {
    let cancelled = false;

    const composeFromOverrides = async (
      templateId: string,
      overrides: import('../../v1/composer/composeV1Template').V1ContentOverrides | undefined,
    ): Promise<string> => {
      const res = await fetch('/api/v1/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, overrides }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data as any)?.error || `Failed to compose (${res.status})`);
      }
      const data = (await res.json()) as { html?: unknown };
      const html = typeof data.html === 'string' ? data.html : '';
      if (!html) throw new Error('Compose returned empty HTML');
      return html;
    };

    const restore = async () => {
      // 1) ?project=<id> takes priority — this is how the dashboard opens pages
      // and how a refresh-after-save resumes the same record.
      let projectId = '';
      try {
        projectId = new URLSearchParams(window.location.search).get('project') ?? '';
      } catch {
        projectId = '';
      }

      if (projectId) {
        if (cancelled) return;
        setBootStatus('restoring');
        setGeneratingStage('Loading your SparkPage…');
        setAppState('generating');
        try {
          const project = await getProject(projectId);
          const html = await composeFromOverrides(project.templateId, project.overrides);
          if (cancelled) return;
          setLandingPage({
            html,
            css: '',
            preview: html,
            v1: {
              templateId: project.templateId,
              overrides: project.overrides,
              resultId: makeClientResultId(),
              projectId: project.id,
            },
          });
          setAppState('preview');
        } catch (err) {
          console.error('[v1 project load] Failed:', err);
          if (cancelled) return;
          setError(err instanceof Error ? err.message : 'Failed to load project');
          setCurrentStep(0);
          setLandingPage(null);
          setAppState('form');
        } finally {
          if (!cancelled) setBootStatus('done');
        }
        return;
      }

      // 2) Local session fallback.
      const session = loadActiveV1EditorSession();
      if (!session) {
        if (!cancelled) setBootStatus('done');
        return;
      }

      if (cancelled) return;
      setBootStatus('restoring');
      setGeneratingStage('Restoring your last session…');
      setAppState('generating');

      try {
        const html = await composeFromOverrides(session.templateId, session.overrides);
        if (cancelled) return;
        setLandingPage({
          html,
          css: '',
          preview: html,
          v1: {
            templateId: session.templateId,
            overrides: session.overrides,
            resultId: session.id,
          },
        });
        setAppState('preview');
      } catch (err) {
        console.error('[v1 restore] Failed:', err);
        if (cancelled) return;
        clearActiveV1EditorSession();
        setError(err instanceof Error ? err.message : 'Failed to restore saved session');
        setCurrentStep(0);
        setLandingPage(null);
        setAppState('form');
      } finally {
        if (!cancelled) setBootStatus('done');
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Determine which steps to show based on whether user wants to customize with URL
  const steps = formData.customizeWithUrl ? STEPS_WITH_DESIGN : STEPS_NO_DESIGN;

  const updateTemplate = (template: Template, customizeWithUrl: boolean) => {
    setFormData(prev => {
      // Pre-fill wizard fields from the spec so the Business Information
      // step opens with niche-appropriate copy instead of empty inputs.
      // Only fields the user has not already edited are overwritten.
      const prefill = buildPrefillFromSpec(template.id);
      const prevBusiness = prev.business;
      const prevContact = prev.contact;
      const isEmptyBusiness = !prevBusiness.productService && !prevBusiness.offer
        && !prevBusiness.pricing && !prevBusiness.cta
        && !prevBusiness.uniqueValue && !prevBusiness.customerLove;
      const isEmptyContact = !prevContact.email && !prevContact.phone;
      return {
        ...prev,
        selectedTemplate: template,
        customizeWithUrl,
        business: prefill && isEmptyBusiness ? prefill.business : prevBusiness,
        contact: prefill && isEmptyContact ? prefill.contact : prevContact,
      };
    });
    setCurrentStep(1);
  };
  const updateDesign = (design: DesignInput) => setFormData(prev => ({ ...prev, design }));
  const updateBusiness = (business: BusinessInfo) => setFormData(prev => ({ ...prev, business }));
  const updateContact = (contact: ContactInfo) => setFormData(prev => ({ ...prev, contact }));

  // Skip the wizard and render the chosen template with its built-in spec
  // defaults (no AI rewrite). The user can still edit everything afterwards in
  // the editor sidebar; their inputs there will become per-section overrides.
  const useTemplateAsIs = async (template: Template) => {
    setError('');
    setFormData(prev => ({ ...prev, selectedTemplate: template, customizeWithUrl: false }));
    setGeneratingStage('Loading template…');
    setAppState('generating');
    try {
      const res = await fetch('/api/v1/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data as any)?.error || `Failed to load template (${res.status})`);
      }
      const data = (await res.json()) as { html?: unknown };
      const html = typeof data.html === 'string' ? data.html : '';
      if (!html) throw new Error('Failed to load template: missing HTML');
      setLandingPage({
        html,
        css: '',
        preview: html,
        v1: {
          templateId: template.id,
          overrides: undefined,
          resultId: makeClientResultId(),
        },
      });
      setAppState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
      setAppState('form');
      setCurrentStep(0);
    }
  };

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
	      const v1ResultId = result?.v1 ? makeClientResultId() : undefined;
	      setLandingPage({
	        html: result.html,
	        css: result.css,
	        preview: result.preview,
		      v1: result?.v1 ? { ...result.v1, resultId: v1ResultId } : undefined,
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
	    clearActiveV1EditorSession();
    setFormData(initialFormData);
    setCurrentStep(0);
    setLandingPage(null);
    setAppState('welcome');
  };

	  if (bootStatus !== 'done') {
	    return (
	      <GeneratingScreen
	        stage={bootStatus === 'restoring' ? 'Restoring your last session…' : 'Loading…'}
	      />
	    );
	  }

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
      />
    );
  }

  // Determine which component to show based on step and customizeWithUrl
  const renderStep = () => {
    // Step 0: Template Selection
    if (currentStep === 0) {
      return (
        <Step0TemplateSelect
          onSelect={updateTemplate}
          onUseAsIs={useTemplateAsIs}
        />
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
