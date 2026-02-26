import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-ecommerce-bold-red',
  version: 'v1',
  category: 'product',
  goal: 'checkout',
  theme: 'theme-ecommerce-bold-red',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        headline: 'Bold drops. Limited runs. Zero hesitation.',
        subheadline: 'A high-energy product page with punchy red CTAs built for impulse buys.',
        ctaLabel: 'Buy Now',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'SocialProofLogos', props: { heading: 'Featured in', logos: ['streetwear', 'hotlist', 'dealfeed', 'newrelease'] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Designed to sell',
        services: [
          { title: 'Bold CTAs', description: 'High-contrast buttons that stand out.', icon: 'tool' },
          { title: 'Fast benefits', description: 'Benefits-first copy blocks shoppers scan.', icon: 'search' },
          { title: 'Trust cues', description: 'Shipping, returns, and guarantees up front.', icon: 'shield' },
          { title: 'Mobile-first', description: 'Looks sharp on every screen size.', icon: 'wrench' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'In the wild',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Customers are hyped',
        testimonials: [
          { quote: 'The quality is unreal. Shipping was fast too.', name: 'Morgan D.', title: 'Customer' },
	          { quote: 'Exactly as pictured — and the fit is perfect.', name: 'Riley S.', title: 'Customer' },
          { quote: 'Bought one for me and one for my partner. Both loved it.', name: 'Chris B.', title: 'Customer' },
        ],
      },
    },
    { type: 'FinalCTA', props: { heading: 'Don\'t miss the drop', subheading: 'Leave your email and we\'ll send the purchase link immediately.', ctaLabel: 'Get Link' } },
  ],
  assets: {
    heroImageId: 'demo-ecommerce-bold-red-hero-01',
    supportImage1: 'demo-ecommerce-bold-red-card-01',
    supportImage2: 'demo-ecommerce-bold-red-card-02',
    fallbackHeroImageId: '/v1/assets/placeholders/ecommerce/ecommerce-bold-red-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/ecommerce/ecommerce-bold-red-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/ecommerce/ecommerce-bold-red-card-02.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Email for order link', required: true },
    { name: 'sms', type: 'tel', placeholder: 'SMS (optional)', required: false },
  ],
  metadata: {
    name: 'E-commerce Bold (Red)',
    description: 'High-contrast e-commerce template with bold red CTAs optimized for fast conversion.',
    tags: ['ecommerce', 'bold', 'red', 'checkout', 'conversion'],
  },
};

export default spec;
