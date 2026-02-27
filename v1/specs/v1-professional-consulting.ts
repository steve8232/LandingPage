import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-professional-consulting',
  version: 'v1',
  category: 'leadgen',
  goal: 'form',
  theme: 'theme-professional',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        eyebrow: 'Fractional strategy for founders • Roadmap clarity • Execution support',
        headline: 'Clear strategy. Confident execution.',
        subheadline:
          'Partner with a senior advisor to sharpen your roadmap, align stakeholders, and ship measurable outcomes in the next 30–90 days.',
        bullets: [
          '90-minute clarity session with actionable next steps',
          'Roadmap + priorities tailored to your stage and constraints',
          'Hands-on support: templates, coaching, and accountability',
        ],
        proofPoints: ['Senior advisor', 'Fast turnaround', 'No fluff'],
        ctaLabel: 'Book a consult',
        secondaryCtaLabel: 'See how it works',
        secondaryCtaHref: '#services',
        ctaHref: '#contact',
        trustBadge: 'Practical guidance • Clear plan • Measurable outcomes',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
        heading: 'Trusted by ambitious teams',
        supportingText: 'Strategy + execution • Founder-friendly • Results-driven',
        logos: ['5-star-rated', 'award-winning', 'verified', 'satisfaction-guaranteed'],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'How we help',
        subheading:
          'A focused engagement that turns ambiguity into a plan your team can execute — with clear owners, timelines, and metrics.',
        services: [
          { title: 'Discovery', description: 'Uncover the real bottlenecks, opportunities, and constraints.', icon: 'search', benefit: 'Get clarity fast' },
          { title: 'Roadmap', description: 'Prioritize what matters for the next 30–90 days and why.', icon: 'tool', benefit: 'Focus the team' },
          { title: 'Enablement', description: 'Process, templates, and coaching so execution stays consistent.', icon: 'wrench', benefit: 'Ship with confidence' },
          { title: 'Metrics', description: 'Scorecards and KPIs that guide decisions and highlight impact.', icon: 'shield', benefit: 'Measure results' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Work style',
        subheading: 'Structured, collaborative, and bias-to-action — so you leave every week with momentum.',
        caption1: 'Working sessions with clear notes, owners, and next steps.',
        caption2: 'Templates and scorecards your team can run without us.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Client outcomes',
        subheading: 'Alignment, velocity, and measurable results — without the jargon.',
        testimonials: [
          { quote: 'We got alignment in one week and executed the plan immediately.', highlight: 'alignment in one week', rating: 5, name: 'Andrea P.', title: 'CEO' },
          { quote: 'Practical guidance with zero fluff. Exactly what we needed.', highlight: 'zero fluff', rating: 5, name: 'Kevin S.', title: 'COO' },
          { quote: 'The roadmap and metrics changed how we run the business.', highlight: 'changed how we run', rating: 5, name: 'Lina R.', title: 'Founder' },
        ],
      },
    },
	    {
	      type: 'FinalCTA',
	      props: {
	        heading: 'Book a clarity call',
	        subheading:
	          'Share a few details and we’ll reply with a recommended plan, timeline, and next steps. If it’s a fit, we can start quickly.',
	        ctaLabel: 'Request an intro call',
	        urgency: 'Limited intro slots each week',
	        nextSteps: ['Tell us your goal', 'We recommend a 30–90 day plan', 'If it’s a fit, we start with a clarity session'],
	        guarantee: 'Actionable next steps • Clear scope • No fluff',
	        privacyNote: 'No spam — we only contact you about your request.',
	      },
	    },
  ],
  assets: {
    heroImageId: 'demo-professional-consulting-hero-01',
    supportImage1: 'demo-professional-consulting-card-01',
    supportImage2: 'demo-professional-consulting-card-02',

    fallbackHeroImageId: '/v1/assets/placeholders/professional/professional-consulting-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/professional/professional-consulting-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/professional/professional-consulting-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'email', type: 'email', placeholder: 'Work email', required: true },
    { name: 'topic', type: 'text', placeholder: 'What do you want help with? (Briefly)', required: true },
  ],
  metadata: {
    name: 'Professional Consulting (Light)',
    description: 'Professional consulting template for consultants, coaches, and advisors focused on lead capture.',
    tags: ['consulting', 'professional', 'leadgen', 'light'],
  },
};

export default spec;
