import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-coming-soon-minimal-dark',
  version: 'v1',
  category: 'waitlist',
  goal: 'signup',
  theme: 'theme-coming-soon-minimal-dark',
  sections: [
    {
      type: 'HeroSplit',
      props: {
	        eyebrow: 'Launching soon • Private beta • Early access invites',
	        headline: 'Be first in line when we open the doors',
	        subheadline:
	          'Get early access, launch-day perks, and a short behind-the-scenes update when we hit major milestones. No noise — just the moments that matter.',
	        bullets: ['Private beta invite (limited)', 'Launch-day perks for early signups', 'Unsubscribe anytime with one click'],
	        proofPoints: ['No spam', 'Private beta', 'Early access'],
	        ctaLabel: 'Get early access',
	        secondaryCtaLabel: 'Get launch updates',
	        secondaryCtaHref: '#contact',
        ctaHref: '#contact',
	        trustBadge: 'Privacy-first updates • Unsubscribe anytime',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
	    {
	      type: 'SocialProofLogos',
	      props: {
	        heading: 'Built with trust in mind',
	        supportingText: 'Privacy-first • Secure-by-default • Fast updates',
	        logos: ['verified', 'gdpr', 'soc2', 'fast-response'],
	      },
	    },
    {
      type: 'ServiceList',
      props: {
	        heading: "What's coming",
	        subheading: 'A simple launch: clear value, quick onboarding, and thoughtful product decisions shaped by early users.',
        services: [
	          { title: 'Early access', description: 'Get invited to the private beta as soon as slots open.', icon: 'shield', benefit: 'Be first' },
	          { title: 'Milestone updates', description: 'Short emails only when we ship something meaningful.', icon: 'search', benefit: 'No noise' },
	          { title: 'Founding perks', description: 'Launch-day perks when available (pricing, bonuses, or priority support).', icon: 'tool', benefit: 'Launch perks' },
	          { title: 'One-click unsubscribe', description: 'Stay as long as it’s useful. Leave anytime.', icon: 'wrench', benefit: 'No pressure' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
	        heading: 'Sneak peek',
	        subheading: 'A quick look at the vibe and the product direction.',
	        caption1: 'Early concept: core flow and navigation.',
	        caption2: 'Early concept: visual style and key screens.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
	    {
	      type: 'TestimonialsCards',
	      props: {
	        heading: 'Early feedback',
	        subheading: 'A few notes from people who asked to be first.',
	        testimonials: [
	          { quote: 'Finally a waitlist that respects my inbox. I’m excited to try it.', highlight: 'respects my inbox', rating: 5, name: 'Alyssa R.', title: 'Product Manager' },
	          { quote: 'The sneak peek sold me — clean, focused, and not overbuilt.', highlight: 'clean, focused', rating: 5, name: 'Ben C.', title: 'Founder' },
	          { quote: 'If you ship what you described, this will be a daily tool for me.', highlight: 'daily tool', rating: 5, name: 'Jordan L.', title: 'Designer' },
	        ],
	      },
	    },
	    {
	      type: 'FinalCTA',
	      props: {
	        heading: 'Get notified at launch',
	        subheading: 'Join the waitlist and we’ll send your early access invite as soon as it’s available.',
	        ctaLabel: 'Notify me',
	        urgency: 'Private beta invites go out in small batches',
	        nextSteps: ['Join the waitlist in 10 seconds', 'We email you when invites open', 'Get early access + launch-day perks'],
	        guarantee: 'Unsubscribe anytime • No spam',
	        privacyNote: 'We’ll only email major milestones and your invite.',
	      },
	    },
  ],
  assets: {
    heroImageId: 'demo-coming-soon-minimal-dark-hero-01',
    supportImage1: 'demo-coming-soon-minimal-dark-card-01',
    supportImage2: 'demo-coming-soon-minimal-dark-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/comingsoon/coming-soon-minimal-dark-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/comingsoon/coming-soon-minimal-dark-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/comingsoon/coming-soon-minimal-dark-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
	  form: [
	    { name: 'email', type: 'email', placeholder: 'Email for early access', required: true },
	  ],
  metadata: {
    name: 'Coming Soon Minimal (Dark)',
    description: 'Minimal dark coming-soon template with waitlist signup and demo imagery.',
    tags: ['coming-soon', 'waitlist', 'dark', 'minimal'],
  },
};

export default spec;
