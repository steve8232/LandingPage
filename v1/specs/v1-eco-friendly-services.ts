import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-eco-friendly-services',
  version: 'v1',
  category: 'leadgen',
  goal: 'form',
  theme: 'theme-eco-friendly',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Eco-friendly services that feel as good as they look',
        subheadline:
          'Sustainable practices, reliable crews, and transparent pricing for homes and small businesses.',
        ctaLabel: 'Get a Quote',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we do',
        services: [
          { title: 'Green cleaning', description: 'Non-toxic products and careful processes.', icon: 'shield' },
          { title: 'Landscaping', description: 'Low-water, low-waste outdoor solutions.', icon: 'tool' },
          { title: 'Recycling & hauling', description: 'We divert materials responsibly.', icon: 'wrench' },
          { title: 'Maintenance plans', description: 'Seasonal service with simple scheduling.', icon: 'search' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Before & after',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Kind words',
        testimonials: [
          { quote: 'Professional team and the eco-friendly products were a big plus.', name: 'Harper J.', title: 'Customer' },
	          { quote: 'They left the place spotless — and the scheduling was easy.', name: 'Noah V.', title: 'Customer' },
          { quote: 'Transparent pricing and great results. Highly recommend.', name: 'Mia L.', title: 'Customer' },
        ],
      },
    },
	    { type: 'FinalCTA', props: { heading: 'Let\'s make it greener', subheading: 'Request a quote and we\'ll get back within 1 business day.', ctaLabel: 'Request Quote' } },
  ],
  assets: {
    heroImageId: 'demo-eco-friendly-services-hero-01',
    supportImage1: 'demo-eco-friendly-services-card-01',
    supportImage2: 'demo-eco-friendly-services-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/eco/eco-friendly-services-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/eco/eco-friendly-services-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/eco/eco-friendly-services-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'name', type: 'text', placeholder: 'Name', required: true },
    { name: 'email', type: 'email', placeholder: 'Email', required: true },
    { name: 'service', type: 'text', placeholder: 'Service needed (cleaning, landscaping, etc.)', required: true },
  ],
  metadata: {
    name: 'Eco-Friendly Services (Light)',
    description: 'Green, sustainability-forward services template for cleaning, landscaping, and eco providers.',
    tags: ['eco', 'green', 'services', 'leadgen', 'light'],
  },
};

export default spec;
