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
        eyebrow: 'Limited drop • Ships fast • Easy returns',
        headline: 'Bold drops. Limited runs. Don\'t overthink it.',
        subheadline:
          'Everything you need to feel confident buying right now: benefits up front, trust cues that remove doubt, and a checkout flow that stays simple.',
        bullets: ['Secure checkout in seconds', 'Ships next business day', 'Easy returns if it\'s not the one'],
        proofPoints: ['Low stock', 'Secure checkout', 'Fast shipping'],
        ctaLabel: 'Buy now',
        secondaryCtaLabel: 'Get the drop link',
        secondaryCtaHref: '#contact',
        ctaHref: '#contact',
        trustBadge: 'Secure checkout • Fast shipping • Easy returns',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
        heading: 'Fast, secure checkout',
        supportingText: 'Secure payments • Ships fast • Easy returns',
        logos: ['secure-checkout', 'free-shipping', 'easy-returns', 'ssl-secure'],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Why people buy (fast)',
        subheading: 'The details that make this drop feel as good as it looks.',
        services: [
          { title: 'Premium build', description: 'Quality materials and a finish that holds up after real wear.', icon: 'shield', benefit: 'Feels expensive' },
          { title: 'Comfort fit', description: 'Designed for all-day comfort without losing shape.', icon: 'tool', benefit: 'Wear it constantly' },
          { title: 'Fast shipping', description: 'Quick dispatch with tracking so you know exactly when it lands.', icon: 'wrench', benefit: 'Ships next business day' },
          { title: 'Easy returns', description: 'If it\'s not right, returning or exchanging is straightforward.', icon: 'search', benefit: 'Zero hassle' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'In the wild',
        subheading: 'Two quick angles so you can see the fit and details clearly.',
        caption1: 'Lifestyle shot: fit, drape, and scale.',
        caption2: 'Detail shot: texture and finish up close.',
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
	        subheading: 'Real feedback from people who bought — fit, quality, and fast delivery.',
        testimonials: [
	          { quote: 'The quality is unreal. Shipping was fast too.', highlight: 'quality is unreal', rating: 5, name: 'Morgan D.', title: 'Customer' },
		          { quote: 'Exactly as pictured — and the fit is perfect.', highlight: 'fit is perfect', rating: 5, name: 'Riley S.', title: 'Customer' },
	          { quote: 'Bought one for me and one for my partner. Both loved it.', highlight: 'both loved it', rating: 5, name: 'Chris B.', title: 'Customer' },
        ],
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Don\'t miss the drop',
        subheading: 'Leave your email and we\'ll send the purchase link immediately (plus order + shipping updates).',
        ctaLabel: 'Send the link',
        urgency: 'Drop ends when it sells out',
        nextSteps: ['We send your purchase link instantly', 'Checkout in seconds', 'Tracking arrives as soon as it ships'],
        guarantee: 'Easy returns within 30 days',
        privacyNote: 'No spam — order-only emails.',
      },
    },
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
