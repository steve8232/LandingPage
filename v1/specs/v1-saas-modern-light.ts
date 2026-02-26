import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-saas-modern-light',
  version: 'v1',
  category: 'saas',
  goal: 'signup',
  theme: 'theme-saas-modern-light',
  sections: [
    {
      type: 'HeroSplit',
      props: {
	      headline: 'Modern SaaS that ships faster — without the chaos',
        subheadline: 'A clean, modular platform your team can adopt in a day and love for years.',
        ctaLabel: 'Start Free Trial',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'SocialProofLogos', props: { heading: 'Trusted by teams at', logos: ['acme', 'nova', 'orbit', 'vertex'] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Everything you need to launch',
        services: [
          { title: 'Automations', description: 'Eliminate repetitive work with safe workflows.', icon: 'tool' },
          { title: 'Dashboards', description: 'Measure what matters with real-time insights.', icon: 'search' },
          { title: 'Security', description: 'Sane defaults, roles, and audit-ready controls.', icon: 'shield' },
          { title: 'Integrations', description: 'Connect your stack with a few clicks.', icon: 'wrench' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Product snapshots',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Loved by operators and engineers',
        testimonials: [
          { quote: 'We rolled it out in a weekend and immediately cut our cycle time.', name: 'Priya S.', title: 'Head of Ops' },
          { quote: 'The UX is crisp and the defaults are exactly what we needed.', name: 'Marcus L.', title: 'Engineering Manager' },
          { quote: 'It replaced three tools and the team actually enjoys using it.', name: 'Elena G.', title: 'Product Lead' },
        ],
      },
    },
    { type: 'FinalCTA', props: { heading: 'Try it today', subheading: 'Get a free sandbox and see value in minutes.', ctaLabel: 'Create Account' } },
  ],
  assets: {
    heroImageId: 'demo-saas-modern-light-hero-01',
    supportImage1: 'demo-saas-modern-light-card-01',
    supportImage2: 'demo-saas-modern-light-card-02',
    fallbackHeroImageId: '/v1/assets/placeholders/saas/saas-modern-light-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/saas/saas-modern-light-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/saas/saas-modern-light-card-02.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Work email', required: true },
    { name: 'name', type: 'text', placeholder: 'Full name', required: false },
  ],
  metadata: {
    name: 'SaaS Modern (Light)',
    description: 'Clean, modern SaaS layout with blue tones and lightweight social proof.',
    tags: ['saas', 'modern', 'light', 'blue', 'signup'],
  },
};

export default spec;
