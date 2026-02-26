import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-local-services-trust',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  theme: 'theme-local-services-trust',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Local pros you can trust — on time, every time',
        subheadline:
          'Licensed and insured. Clear estimates, clean work, and friendly service for your home or business.',
        ctaLabel: 'Request a Quote',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
        heading: 'Trusted locally by',
        logos: ['neighborhood', 'downtown', 'homesmart', 'cityworks'],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Services',
        services: [
          { title: 'Same-day availability', description: 'Fast scheduling for urgent issues.', icon: 'tool' },
          { title: 'Up-front pricing', description: 'Clear estimates before we start.', icon: 'search' },
          { title: 'Work guaranteed', description: 'We stand behind the job.', icon: 'shield' },
          { title: 'Friendly support', description: 'Real people, real answers.', icon: 'wrench' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Recent jobs',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Reviews',
        testimonials: [
          { quote: 'Showed up on time and fixed it quickly. Great communication.', name: 'Avery H.', title: 'Homeowner' },
          { quote: 'Clean work and fair pricing. Will call again.', name: 'Dylan M.', title: 'Property Manager' },
          { quote: 'Professional and courteous from start to finish.', name: 'Sofia R.', title: 'Customer' },
        ],
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Need help today?',
        subheading: 'Tell us what’s going on and we’ll follow up quickly.',
        ctaLabel: 'Get Estimate',
      },
    },
  ],
  assets: {
    heroImageId: 'demo-local-services-trust-hero-01',
    supportImage1: 'demo-local-services-trust-card-01',
    supportImage2: 'demo-local-services-trust-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'name', type: 'text', placeholder: 'Name', required: true },
    { name: 'phone', type: 'tel', placeholder: 'Phone', required: true },
    { name: 'details', type: 'textarea', placeholder: 'What do you need help with?', required: true },
  ],
  metadata: {
    name: 'Local Services Trust (Light)',
    description: 'Trust-forward local services template for contractors, plumbers, electricians, and repair pros.',
    tags: ['local', 'services', 'trust', 'leadgen', 'call'],
  },
};

export default spec;
