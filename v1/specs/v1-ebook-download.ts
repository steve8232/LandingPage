import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-ebook-download',
  version: 'v1',
  category: 'leadgen',
  goal: 'form',
  theme: 'theme-ebook-download',
  sections: [
    {
      type: 'HeroSplit',
      props: {
			  eyebrow: 'Free download • 12-minute read • Templates included',
	        headline: 'Free ebook: the step-by-step playbook you can apply this week',
			  subheadline:
			    'A concise, practical guide with frameworks, examples, and copy/paste templates. No fluff — just the steps that move you from “I should” to “It’s done.”',
	        bullets: ['Framework + examples (plain-English)', 'Worksheets you can reuse', 'Checklists to avoid costly mistakes'],
	        proofPoints: ['Instant download', 'Templates included', 'No spam'],
	        ctaLabel: 'Email me the ebook',
		      secondaryCtaLabel: "See what's inside",
	        secondaryCtaHref: '#contact',
        ctaHref: '#contact',
			  trustBadge: 'Instant download • No spam • Unsubscribe anytime',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
	    {
	      type: 'SocialProofLogos',
	      props: {
	        heading: 'A respectful download',
			  supportingText: 'Instant delivery • Templates included • Privacy-first',
			  logos: ['verified', 'ssl-secure', 'gdpr', 'soc2'],
	      },
	    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Inside the ebook',
	        subheading: 'Four parts designed to make progress feel obvious and repeatable.',
        services: [
	          { title: 'A proven playbook', description: 'The process broken into clear, actionable steps.', icon: 'tool', benefit: 'Do the next right thing' },
		        { title: 'Real examples', description: 'See what "good" looks like and why it works.', icon: 'search', benefit: 'Steal the patterns' },
	          { title: 'Worksheets', description: 'Fill-in templates you can reuse on every project.', icon: 'wrench', benefit: 'Copy/paste friendly' },
	          { title: 'Checklists', description: 'Catch the small things that usually cause big delays.', icon: 'shield', benefit: 'Avoid mistakes' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
	        heading: 'Preview pages',
	        subheading: 'A quick look at the formatting and practical examples inside.',
	        caption1: 'Framework + example walkthrough (step-by-step).',
	        caption2: 'Worksheet + checklist pages you can reuse.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
	    {
	      type: 'TestimonialsCards',
	      props: {
	        heading: 'What readers say',
	        subheading: 'Short, practical, and easy to apply — especially if you’re busy.',
	        testimonials: [
	          { quote: 'No fluff. I used the worksheet and had a plan in 20 minutes.', highlight: 'had a plan in 20 minutes', rating: 5, name: 'Taylor M.', title: 'Founder' },
	          { quote: 'The checklists saved me from three mistakes I always make under pressure.', highlight: 'saved me from three mistakes', rating: 5, name: 'Jordan K.', title: 'Project Lead' },
	          { quote: 'The examples make it obvious what “good” looks like. I reused the template the same day.', highlight: 'reused the template', rating: 5, name: 'Priya S.', title: 'Marketing Manager' },
	        ],
	      },
	    },
	    {
	      type: 'FinalCTA',
	      props: {
	        heading: 'Send me the download',
		      subheading: "Enter your email and we'll send the ebook instantly (plus the worksheets + checklists).",
	        ctaLabel: 'Send the ebook',
			  urgency: 'Instant download — no waiting',
	        nextSteps: ['Enter your email', 'We email the download link instantly', 'Use the templates to apply it today'],
			  guarantee: 'No spam • Unsubscribe anytime',
	        privacyNote: 'We only send the download + occasional resource updates.',
	      },
	    },
  ],
  assets: {
    heroImageId: 'demo-ebook-download-hero-01',
    supportImage1: 'demo-ebook-download-card-01',
    supportImage2: 'demo-ebook-download-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/leadgen/ebook-download-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/leadgen/ebook-download-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/leadgen/ebook-download-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
	  form: [
	    { name: 'email', type: 'email', placeholder: 'Work email', required: true },
	    { name: 'name', type: 'text', placeholder: 'First name (optional)', required: false },
	  ],
  metadata: {
    name: 'Ebook Download (Lead Gen, Light)',
    description: 'Lead magnet template for ebook/resource downloads with clean content blocks and email capture.',
    tags: ['ebook', 'download', 'leadgen', 'resource', 'light'],
  },
};

export default spec;
