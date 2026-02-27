import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-law-finance',
  version: 'v1',
  category: 'leadgen',
  goal: 'form',
  theme: 'theme-law-finance',
  sections: [
    {
      type: 'HeroSplit',
      props: {
		      eyebrow: 'Confidential consult • Clear next steps • Fast response',
	        headline: 'Clear, confidential guidance when the stakes are high',
		      subheadline:
		        'Professional guidance for individuals and businesses. Understand your options, reduce risk, and leave with a concrete plan — not vague advice.',
	        bullets: [
	          'Plain-English explanation of options + tradeoffs',
	          'Document review and risk checks before you sign',
	          'Actionable next steps you can execute immediately',
	        ],
	        proofPoints: ['Confidential', 'Secure intake form', 'Response within 1 business day'],
	        ctaLabel: 'Request a consultation',
	        secondaryCtaLabel: 'Ask a quick question',
	        secondaryCtaHref: '#contact',
        ctaHref: '#contact',
		      trustBadge: 'Secure form • Confidential conversations • Clear next steps',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
	    {
	      type: 'SocialProofLogos',
	      props: {
	        heading: 'Professional standards you can count on',
		      supportingText: 'Privacy-first • Secure intake • Fast response',
	        logos: ['ssl-secure', 'verified', 'gdpr', 'fast-response'],
	      },
	    },
    {
      type: 'ServiceList',
      props: {
	        heading: 'Areas of focus',
	        subheading: 'Support designed to remove uncertainty and help you move forward with confidence.',
        services: [
	          { title: 'Advisory', description: 'Structured guidance and decision support tailored to your situation.', icon: 'search', benefit: 'Get clarity' },
	          { title: 'Documentation', description: 'Clear, accurate paperwork drafting and review.', icon: 'tool', benefit: 'Avoid surprises' },
	          { title: 'Risk management', description: 'Identify issues early and reduce exposure before it grows.', icon: 'shield', benefit: 'Reduce risk' },
		        { title: 'Planning', description: 'A practical plan with milestones — and what to do next.', icon: 'wrench', benefit: 'Move forward' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
	        heading: 'Professional standards',
		      subheading: 'A clean process and clear documentation — so decisions feel straightforward.',
	        caption1: 'Document review: clarity on terms, risks, and recommended edits.',
	        caption2: 'Planning: a simple roadmap with milestones and next actions.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
	        heading: 'What clients say',
	        subheading: 'Clear answers, faster decisions, and less stress.',
        testimonials: [
	          { quote: 'Clear guidance and quick turnaround. We felt supported throughout.', highlight: 'quick turnaround', rating: 5, name: 'Daniel K.', title: 'Client' },
	          { quote: 'Professional, thorough, and easy to work with.', highlight: 'thorough', rating: 5, name: 'Fatima A.', title: 'Client' },
	          { quote: 'Helped us understand options and make the right call.', highlight: 'make the right call', rating: 5, name: 'Olivia P.', title: 'Client' },
        ],
      },
    },
	    {
	      type: 'FinalCTA',
	      props: {
	        heading: 'Start with a conversation',
		      subheading: 'Share a few details and we’ll reply with the next best step for your situation.',
	        ctaLabel: 'Request a confidential consult',
	        urgency: 'Limited consult slots each week',
	        nextSteps: ['Send a brief message', 'We confirm fit + timing', 'Get clear next steps and a plan'],
		      guarantee: 'Confidential • No pressure • Clear next steps',
		      privacyNote: 'No spam — we only respond about your request.',
	      },
	    },
  ],
  assets: {
    heroImageId: 'demo-law-finance-hero-01',
    supportImage1: 'demo-law-finance-card-01',
    supportImage2: 'demo-law-finance-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/law/law-finance-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/law/law-finance-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/law/law-finance-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
	  form: [
	    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
	    { name: 'email', type: 'email', placeholder: 'Email', required: true },
	    { name: 'message', type: 'textarea', placeholder: 'Briefly describe your situation and what outcome you want', required: true },
	  ],
  metadata: {
    name: 'Law & Finance (Light)',
    description: 'Authoritative law/finance template with strong trust cues and a straightforward consultation form.',
    tags: ['law', 'finance', 'professional', 'authoritative', 'leadgen'],
  },
};

export default spec;
