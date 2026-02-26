import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-law-finance',
  version: 'v1',
  category: 'leadgen',
  goal: 'form',
  theme: 'theme-law-finance',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Serious counsel for serious decisions',
        subheadline:
          'Professional guidance for individuals and businesses. Clear next steps, confidential conversations, and timely responses.',
        ctaLabel: 'Request Consultation',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Areas of focus',
        services: [
          { title: 'Advisory', description: 'Structured guidance and decision support.', icon: 'search' },
          { title: 'Documentation', description: 'Clear, accurate paperwork and review.', icon: 'tool' },
          { title: 'Risk management', description: 'Identify and reduce exposure early.', icon: 'shield' },
          { title: 'Planning', description: 'Long-term plans with measurable milestones.', icon: 'wrench' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Professional standards',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What clients say',
        testimonials: [
          { quote: 'Clear guidance and quick turnaround. We felt supported throughout.', name: 'Daniel K.', title: 'Client' },
          { quote: 'Professional, thorough, and easy to work with.', name: 'Fatima A.', title: 'Client' },
          { quote: 'Helped us understand options and make the right call.', name: 'Olivia P.', title: 'Client' },
        ],
      },
    },
	    { type: 'FinalCTA', props: { heading: 'Start with a conversation', subheading: 'Send details and we\'ll respond with next steps.', ctaLabel: 'Contact Us' } },
  ],
  assets: {
    heroImageId: 'demo-law-finance-hero-01',
    supportImage1: 'demo-law-finance-card-01',
    supportImage2: 'demo-law-finance-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/law/law-finance-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/law/law-finance-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/law/law-finance-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'name', type: 'text', placeholder: 'Name', required: true },
    { name: 'email', type: 'email', placeholder: 'Email', required: true },
    { name: 'message', type: 'textarea', placeholder: 'How can we help?', required: true },
  ],
  metadata: {
    name: 'Law & Finance (Light)',
    description: 'Authoritative law/finance template with strong trust cues and a straightforward consultation form.',
    tags: ['law', 'finance', 'professional', 'authoritative', 'leadgen'],
  },
};

export default spec;
