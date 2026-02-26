import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-ebook-download',
  version: 'v1',
  category: 'leadgen',
  goal: 'form',
  theme: 'theme-ebook-download',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Free ebook: a step-by-step guide to getting results',
        subheadline:
	        'Download a concise, practical resource you can reference any time. No fluff — just tactics and templates.',
        ctaLabel: 'Get the Ebook',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Inside the ebook',
        services: [
          { title: 'A proven playbook', description: 'The process broken into simple steps.', icon: 'tool' },
	        { title: 'Real examples', description: 'See what "good" looks like.', icon: 'search' },
          { title: 'Worksheets', description: 'Fill-in templates to apply immediately.', icon: 'wrench' },
	        { title: 'Checklists', description: 'Don\'t miss the details that matter.', icon: 'shield' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Preview pages',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
	    { type: 'FinalCTA', props: { heading: 'Send me the download', subheading: 'Enter your email and we\'ll send the ebook instantly.', ctaLabel: 'Email Me the Ebook' } },
  ],
  assets: {
    heroImageId: 'demo-ebook-download-hero-01',
    supportImage1: 'demo-ebook-download-card-01',
    supportImage2: 'demo-ebook-download-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/leadgen/ebook-download-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/leadgen/ebook-download-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/leadgen/ebook-download-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Email', required: true },
    { name: 'name', type: 'text', placeholder: 'Name (optional)', required: false },
  ],
  metadata: {
    name: 'Ebook Download (Lead Gen, Light)',
    description: 'Lead magnet template for ebook/resource downloads with clean content blocks and email capture.',
    tags: ['ebook', 'download', 'leadgen', 'resource', 'light'],
  },
};

export default spec;
