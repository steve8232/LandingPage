import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-saas-modern-light',
  version: 'v1',
  category: 'saas',
  goal: 'signup',
  theme: 'theme-saas-modern-light',
  sections: [
    {
      type: 'HeroSplit',
      props: {
	        eyebrow: 'Built for lean teams',
		      headline: 'Ship faster — without the chaos of scattered tools',
	        subheadline: 'A modular workspace to standardize workflows, automate handoffs, and keep every project moving from idea to done.',
	        bullets: [
	          'Set up in under 10 minutes (no IT ticket)',
	          'Automate approvals, follow-ups, and recurring work',
	          'Real-time dashboards your team actually trusts',
	        ],
	        proofPoints: ['SOC 2-ready', 'GDPR-friendly', 'No-code + API'],
	        ctaLabel: 'Start free (14 days)',
	        secondaryCtaLabel: 'Book a demo',
	        secondaryCtaHref: '#contact',
        ctaHref: '#contact',
	        trustBadge: 'No credit card • Cancel anytime • Setup help included',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
	    {
	      type: 'SocialProofLogos',
	      props: {
	        heading: 'Trusted by teams who ship weekly',
	        supportingText: '4.8★ average across 1,200+ reviews • Security-first by default',
	        logos: ['soc2', 'g2', 'capterra', 'gdpr'],
	      },
	    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Everything you need to launch',
        subheading:
          'The essentials teams ask for on day one — plus the guardrails you need as you scale.',
        services: [
	          { title: 'Automations', description: 'Turn repeatable steps into reliable workflows your team can trust.', icon: 'tool', benefit: 'Ship without busywork' },
	          { title: 'Dashboards', description: 'See progress, blockers, and outcomes in one place — updated in real time.', icon: 'search', benefit: 'Know what to fix next' },
	          { title: 'Security', description: 'Roles, permissions, and audit trails that satisfy serious customers.', icon: 'shield', benefit: 'Be enterprise-ready' },
	          { title: 'Integrations', description: 'Connect to the tools you already use (or build your own via API).', icon: 'wrench', benefit: 'Fits your stack' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Product snapshots',
        subheading: 'A quick look at how the workflow stays clean from start to finish.',
	      caption1: 'Standardize the workflow (so nothing slips through the cracks).',
	      caption2: 'Track outcomes and cycle time with a dashboard everyone can read.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'Loved by operators and engineers',
	        subheading: 'Fast onboarding, sane defaults, and results you can measure in weeks.',
        testimonials: [
		          { quote: 'We onboarded the whole team in one afternoon and cut cycle time by ~35% in the first month.', highlight: 'cut cycle time by ~35%', rating: 5, name: 'Priya S.', title: 'Head of Ops' },
		          { quote: 'The defaults are sane. We stopped arguing about process and started shipping.', highlight: 'started shipping', rating: 5, name: 'Marcus L.', title: 'Engineering Manager' },
		          { quote: 'It replaced three tools. Our weekly review is finally one screen, not five tabs.', highlight: 'one screen', rating: 5, name: 'Elena G.', title: 'Product Lead' },
        ],
      },
    },
	    {
	      type: 'FinalCTA',
	      props: {
	        heading: 'Start shipping this week',
	        subheading: 'Create a workspace, import one workflow, and get your first dashboard live today.',
	        ctaLabel: 'Create my workspace',
	        urgency: 'Onboarding calls available this week (limited slots)',
	        nextSteps: [
	          'Create your workspace (2 minutes)',
	          'Pick a workflow template and customize it',
	          'Invite your team and track results in real time',
	        ],
	        guarantee: 'Cancel anytime. Your data stays yours.',
	        privacyNote: 'No spam — just your login link and product updates you opt into.',
	      },
	    },
  ],
  assets: {
    heroImageId: 'demo-saas-modern-light-hero-01',
    supportImage1: 'demo-saas-modern-light-card-01',
    supportImage2: 'demo-saas-modern-light-card-02',
    fallbackHeroImageId: '/v1/assets/placeholders/saas/saas-modern-light-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/saas/saas-modern-light-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/saas/saas-modern-light-card-02.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Work email', required: true },
    { name: 'name', type: 'text', placeholder: 'Full name', required: false },
  ],
  metadata: {
    name: 'SaaS Modern (Light)',
    description: 'Clean, modern SaaS layout with blue tones and lightweight social proof.',
    tags: ['saas', 'modern', 'light', 'blue', 'signup'],
  },
};

export default spec;
