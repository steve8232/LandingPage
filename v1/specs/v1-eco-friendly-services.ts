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
	        eyebrow: 'Non-toxic products • Pet-safe • Transparent pricing',
	        headline: 'Eco-friendly services that leave your space spotless — without harsh chemicals',
	        subheadline:
	          'Sustainable practices, reliable crews, and clear estimates for homes and small businesses. Get a quote in minutes and choose a schedule that fits.',
	        bullets: [
	          'Non-toxic, low-odor products (great for kids + pets)',
	          'Respectful crews and detailed checklists',
	          'Up-front estimate before work begins',
	        ],
	        proofPoints: ['Free estimates', 'Fast response', 'Satisfaction-first'],
	        ctaLabel: 'Get a free quote',
	        secondaryCtaLabel: 'See services',
	        secondaryCtaHref: '#services',
        ctaHref: '#contact',
	        trustBadge: 'Eco-safe products • Clear estimate • Easy scheduling',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
	    {
	      type: 'SocialProofLogos',
	      props: {
	        heading: 'Trusted for clean results',
	        supportingText: 'Free estimates • Licensed & insured • Fast response',
	        logos: ['verified', 'licensed-insured', 'free-estimates', 'fast-response'],
	      },
	    },
    {
      type: 'ServiceList',
      props: {
	        heading: 'What we do',
	        subheading: 'Pick a service, tell us your priorities, and we’ll handle the rest — from setup to spotless finish.',
        services: [
	          { title: 'Green cleaning', description: 'Non-toxic products and careful processes for a true deep clean.', icon: 'shield', benefit: 'Breathe easier' },
	          { title: 'Landscaping', description: 'Low-water, low-waste outdoor solutions that keep curb appeal high.', icon: 'tool', benefit: 'Less waste' },
	          { title: 'Recycling & hauling', description: 'Responsible pickup with a focus on diverting materials from landfill.', icon: 'wrench', benefit: 'Dispose responsibly' },
	          { title: 'Maintenance plans', description: 'Seasonal service with simple scheduling and predictable pricing.', icon: 'search', benefit: 'Stay on track' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
	        heading: 'Before & after',
	        subheading: 'A quick look at the level of detail you can expect.',
	        caption1: 'Deep clean: kitchens, bathrooms, and high-touch surfaces.',
	        caption2: 'Outdoor refresh: tidy edges, debris removal, and light shaping.',
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
	        subheading: 'People who wanted a cleaner space — without the chemical smell.',
        testimonials: [
	          { quote: 'Professional team and the eco-friendly products were a big plus.', highlight: 'eco-friendly products', rating: 5, name: 'Harper J.', title: 'Homeowner' },
		          { quote: 'They left the place spotless — and the scheduling was easy.', highlight: 'spotless', rating: 5, name: 'Noah V.', title: 'Small Business Owner' },
	          { quote: 'Transparent pricing and great results. We’ll book again.', highlight: 'Transparent pricing', rating: 5, name: 'Mia L.', title: 'Customer' },
        ],
      },
    },
	    {
	      type: 'FinalCTA',
	      props: {
	        heading: 'Let’s make it greener',
	        subheading: 'Tell us what you’d like cleaned or refreshed and we’ll reply with a clear quote and next available times.',
	        ctaLabel: 'Request my quote',
	        urgency: 'Popular time slots book quickly',
	        nextSteps: ['Share a few details', 'We confirm availability + price', 'We show up on time and handle the work'],
	        guarantee: 'Non-toxic products • Up-front estimate • Satisfaction-first',
	        privacyNote: 'No spam — just your quote and scheduling updates.',
	      },
	    },
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
	    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
	    { name: 'email', type: 'email', placeholder: 'Email for your quote', required: true },
	    { name: 'service', type: 'text', placeholder: 'Which service do you need? (cleaning, landscaping, hauling)', required: true },
	  ],
  metadata: {
    name: 'Eco-Friendly Services (Light)',
    description: 'Green, sustainability-forward services template for cleaning, landscaping, and eco providers.',
    tags: ['eco', 'green', 'services', 'leadgen', 'light'],
  },
};

export default spec;
