import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-coming-soon-vibrant-light',
  version: 'v1',
  category: 'waitlist',
  goal: 'signup',
  theme: 'theme-coming-soon-vibrant',
  sections: [
    {
      type: 'HeroSplit',
      props: {
	      headline: 'We\'re building something vibrant',
        subheadline: 'A bright, launch-ready coming soon page with gradient energy and a simple waitlist flow.',
        ctaLabel: 'Get Early Access',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Why join early',
        services: [
          { title: 'Launch invite', description: 'Get the first access link when we go live.', icon: 'tool' },
          { title: 'Product updates', description: 'Short updates as we ship.', icon: 'search' },
          { title: 'Founding perks', description: 'Occasional early-user bonuses.', icon: 'shield' },
          { title: 'Community', description: 'Help shape what we build next.', icon: 'wrench' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Launch moodboard',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
	    { type: 'FinalCTA', props: { heading: 'Join the waitlist', subheading: 'Drop your email and we\'ll keep you posted.', ctaLabel: 'Join' } },
  ],
  assets: {
    heroImageId: 'demo-coming-soon-vibrant-light-hero-01',
    supportImage1: 'demo-coming-soon-vibrant-light-card-01',
    supportImage2: 'demo-coming-soon-vibrant-light-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/comingsoon/coming-soon-vibrant-light-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/comingsoon/coming-soon-vibrant-light-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/comingsoon/coming-soon-vibrant-light-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Email', required: true },
    { name: 'name', type: 'text', placeholder: 'Name (optional)', required: false },
  ],
  metadata: {
    name: 'Coming Soon Vibrant (Light)',
    description: 'Bright, gradient-forward coming soon template with a lightweight waitlist signup.',
    tags: ['coming-soon', 'waitlist', 'vibrant', 'light', 'gradient'],
  },
};

export default spec;
