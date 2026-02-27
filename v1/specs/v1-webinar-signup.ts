import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-webinar-signup',
  version: 'v1',
  category: 'event',
  goal: 'register',
  theme: 'theme-leadgen',
  sections: [
    {
      type: 'HeroSplit',
      props: {
		        eyebrow: 'Free live training • 45 minutes + Q&A • Replay included',
        headline: 'Live webinar: practical tactics you can use this week',
        subheadline:
          'A focused 45-minute session with Q&A. Walk away with a simple framework, real examples, and templates you can apply the same day.',
        bullets: ['Live Q&A (bring your real scenario)', 'Templates + checklists included', 'Replay link sent to all registrants'],
        proofPoints: ['Live Q&A', 'Replay included', 'Templates included'],
        ctaLabel: 'Reserve my seat',
	        secondaryCtaLabel: 'See agenda',
	        secondaryCtaHref: '#services',
        ctaHref: '#contact',
	        trustBadge: 'Register in 30 seconds • Calendar invite included',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
	        heading: 'Trusted by busy teams',
	        supportingText: 'Last session: 1,800+ registrants • 4.7 average attendee rating',
	        logos: ['verified', '5-star-rated', 'award-winning', 'trustpilot'],
      },
    },
    {
      type: 'ServiceList',
      props: {
	        heading: "What you'll learn",
	        subheading: "Four takeaways you can apply immediately — even if you're starting from scratch.",
        services: [
          { title: 'A simple framework', description: 'How to structure your approach from day one.', icon: 'tool', benefit: 'Clarity in 10 minutes' },
          { title: 'Common pitfalls', description: 'What to avoid (and what to do instead).', icon: 'search', benefit: 'Skip the painful mistakes' },
          { title: 'Templates', description: 'Copy-pasteable checklists and prompts you can reuse.', icon: 'wrench', benefit: 'Steal our playbook' },
          { title: 'Live Q&A', description: 'Ask questions and get direct, practical answers.', icon: 'shield', benefit: 'Leave unblocked' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'What to expect',
        subheading: 'A quick preview of the session format and take-home resources.',
        caption1: 'The framework + examples (step-by-step).',
        caption2: 'Templates + checklist you can reuse next week.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
		    {
		      type: 'TestimonialsCards',
		      props: {
		        heading: 'What past attendees say',
		        subheading: 'Tactical, clear, and easy to implement — with real examples and useful Q&A.',
		        testimonials: [
		          { quote: 'The examples were the difference. We implemented the framework the next day.', highlight: 'implemented the next day', rating: 5, name: 'Dana M.', title: 'Ops Lead' },
		          { quote: 'Clear, tactical, and not fluffy. The templates alone were worth it.', highlight: 'templates alone', rating: 5, name: 'Chris R.', title: 'Founder' },
		          { quote: 'Great pacing and the Q&A was genuinely useful — specific answers, not generic advice.', highlight: 'genuinely useful', rating: 5, name: 'Avery K.', title: 'Marketing Manager' },
		        ],
		      },
		    },
	    {
	      type: 'FinalCTA',
	      props: {
	        heading: 'Register now',
	        subheading: 'We\'ll email your access link, send a calendar invite, and share the replay after.',
	        ctaLabel: 'Reserve my seat',
	        urgency: 'Seats capped to keep Q&A useful',
	        nextSteps: ['Register in 30 seconds', 'Get your calendar invite + workbook', 'Join live or watch the replay'],
	        guarantee: 'Replay link sent to all registrants',
		        privacyNote: 'No spam — reminders + replay only.',
	      },
	    },
  ],
  assets: {
    heroImageId: 'demo-webinar-signup-hero-01',
    supportImage1: 'demo-webinar-signup-card-01',
    supportImage2: 'demo-webinar-signup-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/leadgen/webinar-signup-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/leadgen/webinar-signup-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/leadgen/webinar-signup-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
	    { name: 'email', type: 'email', placeholder: 'Work email', required: true },
    { name: 'role', type: 'text', placeholder: 'Role (optional)', required: false },
  ],
  metadata: {
    name: 'Webinar Signup (Lead Gen, Light)',
    description: 'Event registration template for webinars and live sessions with a clean lead-gen style.',
    tags: ['webinar', 'event', 'registration', 'leadgen', 'light'],
  },
};

export default spec;
