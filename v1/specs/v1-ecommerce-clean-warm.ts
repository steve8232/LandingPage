import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-ecommerce-clean-warm',
  version: 'v1',
  category: 'product',
  goal: 'checkout',
  theme: 'theme-ecommerce-clean-warm',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Clean product pages that convert',
        subheadline: 'Warm accents, spacious layout, and a clear path to purchase.',
        ctaLabel: 'Shop Now',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'SocialProofLogos', props: { heading: 'As seen in', logos: ['styleweekly', 'gearhub', 'dailydeal', 'trendline'] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Why customers love it',
        services: [
          { title: 'Quality materials', description: 'Built to last with premium finishes.', icon: 'shield' },
          { title: 'Fast shipping', description: 'Reliable delivery with transparent tracking.', icon: 'tool' },
          { title: 'Easy returns', description: 'Hassle-free returns within 30 days.', icon: 'wrench' },
          { title: 'Support', description: 'Human help when you need it.', icon: 'search' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Product gallery',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Verified reviews',
        testimonials: [
          { quote: 'Arrived quickly and looks even better in person.', name: 'Taylor K.', title: 'Customer' },
	          { quote: 'Great packaging, great quality — will buy again.', name: 'Jamie W.', title: 'Customer' },
          { quote: 'Simple, clean design and super comfortable to use.', name: 'Alex N.', title: 'Customer' },
        ],
      },
    },
    { type: 'FinalCTA', props: { heading: 'Ready to order?', subheading: 'Drop your email to get an instant checkout link.', ctaLabel: 'Send Checkout Link' } },
  ],
  assets: {
    heroImageId: 'demo-ecommerce-clean-warm-hero-01',
    supportImage1: 'demo-ecommerce-clean-warm-card-01',
    supportImage2: 'demo-ecommerce-clean-warm-card-02',
    fallbackHeroImageId: '/v1/assets/placeholders/ecommerce/ecommerce-clean-warm-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/ecommerce/ecommerce-clean-warm-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/ecommerce/ecommerce-clean-warm-card-02.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Email for receipt & updates', required: true },
    { name: 'name', type: 'text', placeholder: 'Name (optional)', required: false },
  ],
  metadata: {
    name: 'E-commerce Clean (Warm)',
    description: 'Minimal e-commerce layout with warm accents and a direct purchase CTA.',
    tags: ['ecommerce', 'product', 'clean', 'warm', 'checkout'],
  },
};

export default spec;
