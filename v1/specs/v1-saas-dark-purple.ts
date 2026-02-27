import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-saas-dark-purple',
  version: 'v1',
  category: 'saas',
  goal: 'signup',
  theme: 'theme-saas-dark-purple',
  sections: [
    {
      type: 'HeroSplit',
      props: {
        eyebrow: 'Premium dark mode • Built for teams who move fast',
        headline: 'A premium workspace that keeps teams aligned — even at speed',
        subheadline:
          'Replace tool sprawl with a single source of truth: clear workflows, tighter permissions, and reporting that doesn’t break at scale.',
        bullets: [
          'Go live in a day with templates + sane defaults',
          'Role-based access and audit-ready activity trails',
          'Dashboards that make blockers impossible to ignore',
        ],
        proofPoints: ['SOC 2', 'GDPR', 'API-ready'],
        ctaLabel: 'Start free trial',
        secondaryCtaLabel: 'See a demo',
        secondaryCtaHref: '#contact',
        ctaHref: '#contact',
        trustBadge: 'No credit card • Cancel anytime • Priority onboarding',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
        heading: 'Built for security-first companies',
        supportingText: 'SOC 2 + GDPR-friendly controls • Designed for audits without the headache',
        logos: ['soc2', 'pci-dss', 'iso-certified', 'gdpr'],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'Why teams switch',
        subheading:
          'Teams don’t want “more features.” They want fewer dropped balls, cleaner handoffs, and a system that stays fast as you grow.',
        services: [
          { title: 'Instant onboarding', description: 'Start with templates, not blank states — and stay consistent across teams.', icon: 'tool', benefit: 'Live in a day' },
          { title: 'Focus mode', description: 'A UI that gets out of the way so the work moves forward.', icon: 'search', benefit: 'Less context switching' },
          { title: 'Permissions', description: 'Roles, approvals, and audit trails without custom engineering.', icon: 'shield', benefit: 'Ship with confidence' },
          { title: 'API-ready', description: 'Integrate with your stack (and extend safely when you need to).', icon: 'wrench', benefit: 'Fits the way you build' },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Interface preview',
        subheading: 'A quick look at the parts customers notice: speed, clarity, and control.',
        caption1: 'Workflows that show status, owners, and next actions at a glance.',
        caption2: 'Permissions and reporting that scale with teams and stakeholders.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What customers say',
	        subheading: 'Less chaos, cleaner handoffs, and a workflow leaders can trust.',
        testimonials: [
	          { quote: 'It looks premium, but the win is operational: fewer handoff misses and cleaner accountability.', highlight: 'fewer handoff misses', rating: 5, name: 'Jordan P.', title: 'Founder' },
	          { quote: 'We consolidated three tools and finally got reporting leadership trusts.', highlight: 'reporting leadership trusts', rating: 5, name: 'Casey T.', title: 'RevOps' },
	          { quote: 'Permissions + audit trails were the deal. We passed our review without scrambling.', highlight: 'passed our review', rating: 5, name: 'Sam R.', title: 'Team Lead' },
        ],
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Launch your next workflow',
        subheading: 'Create an account and go from template to live workflow in minutes.',
        ctaLabel: 'Create account',
        urgency: 'Priority onboarding available this week',
        nextSteps: ['Create your account', 'Choose a template', 'Invite your team and ship'],
        guarantee: 'Cancel anytime. Export your data whenever you want.',
        privacyNote: 'No spam — just your login link and account updates.',
      },
    },
  ],
  assets: {
    heroImageId: 'demo-saas-dark-purple-hero-01',
    supportImage1: 'demo-saas-dark-purple-card-01',
    supportImage2: 'demo-saas-dark-purple-card-02',
    fallbackHeroImageId: '/v1/assets/placeholders/saas/saas-dark-purple-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/saas/saas-dark-purple-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/saas/saas-dark-purple-card-02.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },
  form: [
    { name: 'email', type: 'email', placeholder: 'Work email', required: true },
    { name: 'company', type: 'text', placeholder: 'Company (optional)', required: false },
  ],
  metadata: {
    name: 'SaaS Dark Mode (Purple)',
    description: 'Dark mode SaaS landing page with purple accents and premium styling.',
    tags: ['saas', 'dark', 'purple', 'signup'],
  },
};

export default spec;
