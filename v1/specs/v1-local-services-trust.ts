import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-local-services-trust',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  theme: 'theme-local-services-trust',
  sections: [
    {
      type: 'HeroSplit',
      props: {
	        eyebrow: 'Locally owned • Licensed & insured • Fast response',
	        headline: 'Local pros you can trust — on time, every time',
	        subheadline:
	          'Get a clear estimate, a tidy job site, and a fix that holds up. We respond fast, explain options in plain English, and stand behind the work.',
	        bullets: [
	          'Up-front estimate before work begins — no surprises',
	          'Respectful crews who protect surfaces and clean up',
	          'Warranty-backed workmanship and friendly communication',
	        ],
	        proofPoints: ['Free estimates', 'Fast response', 'Licensed & insured'],
	        ctaLabel: 'Get my estimate',
	        secondaryCtaLabel: 'See services',
	        secondaryCtaHref: '#services',
        ctaHref: '#contact',
	        trustBadge: 'Up-front estimate • Work guaranteed • No pressure',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
	        heading: 'Trusted locally by homeowners and property managers',
	        supportingText: 'Verified reviews • Licensed & insured • Fast scheduling',
	        logos: ['google-reviews', 'yelp', 'bbb', 'licensed-insured'],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Services',
	        subheading:
	          'From quick repairs to planned upgrades, we keep the process simple: clear options, clear pricing, and clean results.',
        services: [
	          { title: 'Same-day availability', description: 'Fast scheduling for urgent issues and time-sensitive jobs.', icon: 'tool', benefit: 'Get help today' },
	          { title: 'Up-front pricing', description: 'Clear options and estimates you can approve before we start.', icon: 'search', benefit: 'Know the cost' },
	          { title: 'Work guaranteed', description: 'We stand behind the job with warranty-backed workmanship.', icon: 'shield', benefit: 'Feel confident' },
	          { title: 'Friendly support', description: 'Real people, real answers, and proactive communication.', icon: 'wrench', benefit: 'Stay informed' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Recent jobs',
	        subheading: 'A quick look at the level of care you can expect on every visit.',
	        caption1: 'Repair completed with protected surfaces and a full cleanup.',
	        caption2: 'Install finished with a walkthrough and a spotless work area.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Reviews',
	        subheading: 'On time, transparent, and clean work — exactly how it should be.',
        testimonials: [
	          { quote: 'Showed up on time and fixed it quickly. Great communication.', highlight: 'Great communication', rating: 5, name: 'Avery H.', title: 'Homeowner' },
	          { quote: 'Clean work and fair pricing. Will call again.', highlight: 'fair pricing', rating: 5, name: 'Dylan M.', title: 'Property Manager' },
	          { quote: 'Professional and courteous from start to finish.', highlight: 'courteous', rating: 5, name: 'Sofia R.', title: 'Customer' },
        ],
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Need help today?',
	        subheading:
	          'Tell us what’s going on and we’ll reply fast with availability and a clear estimate you can approve before work begins.',
	        ctaLabel: 'Request my estimate',
	        urgency: 'Same-day slots can fill quickly',
	        nextSteps: ['Share a few details', 'We confirm timing + price', 'We show up, fix it, and clean up'],
	        guarantee: 'Up-front estimate • Work guaranteed • No pressure',
	        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
  ],
  assets: {
    heroImageId: 'demo-local-services-trust-hero-01',
    supportImage1: 'demo-local-services-trust-card-01',
    supportImage2: 'demo-local-services-trust-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
	    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
	    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
	    { name: 'details', type: 'textarea', placeholder: 'What do you need help with? (Include your city/ZIP and any deadlines)', required: true },
  ],
  metadata: {
    name: 'Local Services Trust (Light)',
    description: 'Trust-forward local services template for contractors, plumbers, electricians, and repair pros.',
    tags: ['local', 'services', 'trust', 'leadgen', 'call'],
  },
};

export default spec;
