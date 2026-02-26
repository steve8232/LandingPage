import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-webinar-signup',
  version: 'v1',
  category: 'event',
  goal: 'register',
  theme: 'theme-leadgen',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Live webinar: practical tactics you can use this week',
        subheadline:
          'A focused 45-minute session with Q&A. Reserve your seat and get the replay link automatically.',
        ctaLabel: 'Reserve My Seat',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'You will learn',
        services: [
          { title: 'A simple framework', description: 'How to structure your approach from day one.', icon: 'tool' },
          { title: 'Common pitfalls', description: 'What to avoid (and what to do instead).', icon: 'search' },
          { title: 'Templates', description: 'Copy-pasteable checklists and prompts.', icon: 'wrench' },
          { title: 'Q&A', description: 'Ask questions and get direct answers.', icon: 'shield' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'What to expect',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
	    { type: 'FinalCTA', props: { heading: 'Register now', subheading: 'We\'ll email your access link and send a reminder before we go live.', ctaLabel: 'Register' } },
  ],
  assets: {
    heroImageId: 'demo-webinar-signup-hero-01',
    supportImage1: 'demo-webinar-signup-card-01',
    supportImage2: 'demo-webinar-signup-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/leadgen/webinar-signup-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/leadgen/webinar-signup-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/leadgen/webinar-signup-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'email', type: 'email', placeholder: 'Email', required: true },
    { name: 'role', type: 'text', placeholder: 'Role (optional)', required: false },
  ],
  metadata: {
    name: 'Webinar Signup (Lead Gen, Light)',
    description: 'Event registration template for webinars and live sessions with a clean lead-gen style.',
    tags: ['webinar', 'event', 'registration', 'leadgen', 'light'],
  },
};

export default spec;
