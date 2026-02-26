import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-professional-consulting',
  version: 'v1',
  category: 'leadgen',
  goal: 'form',
  theme: 'theme-professional',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Clear strategy. Confident execution.',
        subheadline:
	        'Advisory support for founders and teams — sharpen your roadmap, align stakeholders, and ship outcomes.',
        ctaLabel: 'Book a Consult',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'How we help',
        services: [
          { title: 'Discovery', description: 'Find the real bottlenecks and opportunities.', icon: 'search' },
          { title: 'Roadmap', description: 'Prioritize what matters for the next 90 days.', icon: 'tool' },
          { title: 'Enablement', description: 'Process, templates, and coaching for your team.', icon: 'wrench' },
          { title: 'Metrics', description: 'Set up measurement that guides decisions.', icon: 'shield' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Work style',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Client outcomes',
        testimonials: [
          { quote: 'We got alignment in one week and executed the plan immediately.', name: 'Andrea P.', title: 'CEO' },
          { quote: 'Practical guidance with zero fluff. Exactly what we needed.', name: 'Kevin S.', title: 'COO' },
          { quote: 'The roadmap and metrics changed how we run the business.', name: 'Lina R.', title: 'Founder' },
        ],
      },
    },
	    { type: 'FinalCTA', props: { heading: 'Let\'s talk', subheading: 'Share a few details and we\'ll reply with next steps.', ctaLabel: 'Request Intro Call' } },
  ],
  assets: {
    heroImageId: 'demo-professional-consulting-hero-01',
    supportImage1: 'demo-professional-consulting-card-01',
    supportImage2: 'demo-professional-consulting-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/professional/professional-consulting-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/professional/professional-consulting-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/professional/professional-consulting-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'name', type: 'text', placeholder: 'Name', required: true },
    { name: 'email', type: 'email', placeholder: 'Email', required: true },
    { name: 'topic', type: 'text', placeholder: 'What do you want help with?', required: true },
  ],
  metadata: {
    name: 'Professional Consulting (Light)',
    description: 'Professional consulting template for consultants, coaches, and advisors focused on lead capture.',
    tags: ['consulting', 'professional', 'leadgen', 'light'],
  },
};

export default spec;
