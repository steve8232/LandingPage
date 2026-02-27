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
        eyebrow: 'New arrival • Fast shipping • Easy returns',
        headline: 'A product page that makes buying feel effortless',
        subheadline:
          'Benefits up front, trust cues that calm hesitation, and a checkout path that stays friction-free — designed to convert without feeling pushy.',
        bullets: ['Secure checkout in seconds', 'Free shipping over $50', '30-day returns & free exchanges'],
        proofPoints: ['4.9★ verified reviews', 'Ships in 24h', 'Secure checkout'],
        ctaLabel: 'Shop the collection',
        secondaryCtaLabel: 'Get sizing help',
        secondaryCtaHref: '#contact',
        ctaHref: '#contact',
        trustBadge: 'Secure checkout • Free exchanges • Real support',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
        heading: 'Shop with confidence',
        supportingText: 'Secure checkout • Fast delivery • Easy returns',
        logos: ['secure-checkout', 'free-shipping', 'easy-returns', 'ssl-secure'],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Why customers love it',
        subheading: 'Small details that make a big difference the moment it arrives.',
        services: [
          { title: 'Quality materials', description: 'Premium feel, clean stitching, and durable construction.', icon: 'shield', benefit: 'Built to last' },
          { title: 'Fast shipping', description: 'Orders ship quickly with transparent tracking updates.', icon: 'tool', benefit: 'Ships in 24h' },
          { title: 'Easy returns', description: '30-day returns with simple exchanges if sizing isn’t perfect.', icon: 'wrench', benefit: 'Zero hassle' },
          { title: 'Support', description: 'Real humans available to help with sizing and order questions.', icon: 'search', benefit: 'Quick answers' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Product gallery',
        subheading: 'See the details up close — and how it looks in real life.',
        caption1: 'Detail close-up: materials and finish.',
        caption2: 'Lifestyle shot: fit and scale in context.',
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
	        subheading: 'Fast shipping, premium feel, and an easy exchange if you need it.',
        testimonials: [
	          { quote: 'Arrived fast, feels premium, and the photos were accurate. Zero surprises.', highlight: 'zero surprises', rating: 5, name: 'Taylor K.', title: 'Verified buyer' },
		          { quote: 'Great packaging, great quality — and the exchange was painless when I changed sizes.', highlight: 'exchange was painless', rating: 5, name: 'Jamie W.', title: 'Verified buyer' },
	          { quote: 'Clean design, comfortable, and I’ve already gotten compliments.', highlight: 'gotten compliments', rating: 5, name: 'Alex N.', title: 'Verified buyer' },
        ],
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Ready to order?',
        subheading: 'Drop your email to get an instant checkout link (plus shipping + receipt updates).',
        ctaLabel: 'Send my checkout link',
        urgency: 'Limited inventory this week',
        nextSteps: ['We email your checkout link instantly', 'Pick your options and complete payment', 'Tracking arrives as soon as it ships'],
        guarantee: '30-day returns • Free exchanges',
        privacyNote: 'No spam — order-only emails.',
      },
    },
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
