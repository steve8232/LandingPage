import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-saas-dark-purple',
  version: 'v1',
  category: 'saas',
  goal: 'signup',
  theme: 'theme-saas-dark-purple',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Dark-mode SaaS with a premium feel',
        subheadline: 'Purple accents, crisp typography, and conversion-first layout for modern teams.',
        ctaLabel: 'Get Started',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'SocialProofLogos', props: { heading: 'Built for fast-moving companies', logos: ['pulse', 'zenith', 'atlas', 'spark'] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Why teams switch',
        services: [
          { title: 'Instant onboarding', description: 'Templates and sensible defaults out of the box.', icon: 'tool' },
          { title: 'Focus mode', description: 'A UI that gets out of the way and keeps you moving.', icon: 'search' },
          { title: 'Permissions', description: 'Role-based access and audit trails for peace of mind.', icon: 'shield' },
          { title: 'API-ready', description: 'Integrate and extend with predictable primitives.', icon: 'wrench' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Interface preview',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What customers say',
        testimonials: [
          { quote: 'The dark UI looks great and the product is even better.', name: 'Jordan P.', title: 'Founder' },
          { quote: 'We reduced tool sprawl and improved reporting immediately.', name: 'Casey T.', title: 'RevOps' },
          { quote: 'It feels premium without being complicated.', name: 'Sam R.', title: 'Team Lead' },
        ],
      },
    },
    { type: 'FinalCTA', props: { heading: 'Launch your next workflow', subheading: 'Create an account and start in under 2 minutes.', ctaLabel: 'Create Account' } },
  ],
  assets: {
    heroImageId: 'demo-saas-dark-purple-hero-01',
    supportImage1: 'demo-saas-dark-purple-card-01',
    supportImage2: 'demo-saas-dark-purple-card-02',
    fallbackHeroImageId: '/v1/assets/placeholders/saas/saas-dark-purple-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/saas/saas-dark-purple-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/saas/saas-dark-purple-card-02.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Work email', required: true },
    { name: 'company', type: 'text', placeholder: 'Company (optional)', required: false },
  ],
  metadata: {
    name: 'SaaS Dark Mode (Purple)',
    description: 'Dark mode SaaS landing page with purple accents and premium styling.',
    tags: ['saas', 'dark', 'purple', 'signup'],
  },
};

export default spec;
