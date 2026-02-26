import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-coming-soon-minimal-dark',
  version: 'v1',
  category: 'waitlist',
  goal: 'signup',
  theme: 'theme-coming-soon-minimal-dark',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Something new is launching soon',
        subheadline: 'A minimal dark landing page for announcements, waitlists, and early access signups.',
        ctaLabel: 'Join the Waitlist',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'ServiceList',
      props: {
	      heading: 'What\'s coming',
        services: [
          { title: 'Early access', description: 'Be the first to try it when it ships.', icon: 'shield' },
	        { title: 'Updates', description: 'We\'ll email only important milestones.', icon: 'search' },
          { title: 'Bonus launch perks', description: 'Get launch-day offers if available.', icon: 'tool' },
          { title: 'Simple unsubscribe', description: 'Leave any time with one click.', icon: 'wrench' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Sneak peek',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
	    { type: 'FinalCTA', props: { heading: 'Get notified at launch', subheading: 'Join the waitlist and we\'ll send updates.', ctaLabel: 'Notify Me' } },
  ],
  assets: {
    heroImageId: 'demo-coming-soon-minimal-dark-hero-01',
    supportImage1: 'demo-coming-soon-minimal-dark-card-01',
    supportImage2: 'demo-coming-soon-minimal-dark-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/comingsoon/coming-soon-minimal-dark-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/comingsoon/coming-soon-minimal-dark-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/comingsoon/coming-soon-minimal-dark-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Email', required: true },
  ],
  metadata: {
    name: 'Coming Soon Minimal (Dark)',
    description: 'Minimal dark coming-soon template with waitlist signup and demo imagery.',
    tags: ['coming-soon', 'waitlist', 'dark', 'minimal'],
  },
};

export default spec;
