import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-coming-soon-vibrant-light',
  version: 'v1',
  category: 'waitlist',
  goal: 'signup',
  theme: 'theme-coming-soon-vibrant',
  sections: [
    {
      type: 'HeroSplit',
      props: {
		      eyebrow: 'Launching soon • Founding access • Perks for early users',
		      headline: 'Meet Prism — the bright, simple way to plan your week',
	        subheadline:
	          'A lightweight planner that turns messy to-dos into a calm, realistic weekly plan. Join the waitlist for early access and launch-day perks.',
	        bullets: ['A weekly plan in under 3 minutes', 'Smart defaults (no complex setup)', 'Launch-day perks for early signups'],
	        proofPoints: ['Early access', 'No spam', 'Unsubscribe anytime'],
	        ctaLabel: 'Get early access',
	        secondaryCtaLabel: 'Get launch updates',
	        secondaryCtaHref: '#contact',
        ctaHref: '#contact',
		      trustBadge: 'Privacy-first waitlist • One-click unsubscribe',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
	    {
	      type: 'SocialProofLogos',
	      props: {
	        heading: 'A respectful waitlist',
		      supportingText: 'Privacy-first • Secure-by-default • Fast invites',
	        logos: ['verified', 'gdpr', 'soc2', 'fast-response'],
	      },
	    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Why join early',
		      subheading: "Get early access, help shape the product, and lock in founding-user perks when they're available.",
        services: [
	          { title: 'Launch invite', description: 'Get your access link the moment we open invites.', icon: 'tool', benefit: 'Be first' },
	          { title: 'Product updates', description: 'Short updates only when we ship meaningful improvements.', icon: 'search', benefit: 'No noise' },
	          { title: 'Founding perks', description: 'Early pricing, bonuses, and priority support (when available).', icon: 'shield', benefit: 'Perks' },
	          { title: 'Community input', description: 'Vote on features and shape what we build next.', icon: 'wrench', benefit: 'Have a say' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
	        heading: 'Sneak peek',
	        subheading: 'A quick look at the product direction and visual vibe.',
	        caption1: 'Weekly planning flow: pick priorities, auto-schedule the rest.',
		      caption2: "A calm dashboard: what's next, what's blocked, and what's done.",
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
	    {
	      type: 'TestimonialsCards',
	      props: {
	        heading: 'Why early users are joining',
	        subheading: 'What people have told us after seeing the concept and roadmap.',
	        testimonials: [
	          { quote: 'This is the first weekly planner UI that feels calm instead of overwhelming.', highlight: 'feels calm', rating: 5, name: 'Maya T.', title: 'Founder' },
	          { quote: 'Smart defaults + quick setup is exactly what I want. I’ll be first in line.', highlight: 'first in line', rating: 5, name: 'Chris P.', title: 'Ops Lead' },
	          { quote: 'If the beta looks like the sneak peek, I’m switching the day it launches.', highlight: 'switching the day it launches', rating: 5, name: 'Elena S.', title: 'Product Designer' },
	        ],
	      },
	    },
	    {
	      type: 'FinalCTA',
	      props: {
	        heading: 'Join the waitlist',
		      subheading: "Drop your email and we'll send your invite as soon as early access opens.",
	        ctaLabel: 'Join the waitlist',
	        urgency: 'Early access opens in small batches',
	        nextSteps: ['Join in 10 seconds', 'We email you when invites open', 'Get early access + founding perks'],
		      guarantee: 'Unsubscribe anytime • No spam',
		      privacyNote: "Invite + milestones only. We'll never sell your email.",
	      },
	    },
  ],
  assets: {
    heroImageId: 'demo-coming-soon-vibrant-light-hero-01',
    supportImage1: 'demo-coming-soon-vibrant-light-card-01',
    supportImage2: 'demo-coming-soon-vibrant-light-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/comingsoon/coming-soon-vibrant-light-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/comingsoon/coming-soon-vibrant-light-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/comingsoon/coming-soon-vibrant-light-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
	    { name: 'email', type: 'email', placeholder: 'Email for your invite', required: true },
	    { name: 'name', type: 'text', placeholder: 'First name (optional)', required: false },
  ],
  metadata: {
    name: 'Coming Soon Vibrant (Light)',
    description: 'Bright, gradient-forward coming soon template with a lightweight waitlist signup.',
    tags: ['coming-soon', 'waitlist', 'vibrant', 'light', 'gradient'],
  },
};

export default spec;
