/**
 * v1-leadgen-local-01
 *
 * A lead-generation template designed for local service businesses
 * (plumbers, electricians, contractors, etc.).
 *
 * Goal: drive phone calls and form submissions.
 * Theme: theme-localpro (trustworthy navy + orange accent).
 */

import { TemplateSpec } from './schema';

const spec: TemplateSpec = {
  templateId: 'v1-leadgen-local-01',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  theme: 'theme-localpro',

  sections: [
    {
      type: 'HeroSplit',
      props: {
	        eyebrow: 'Same-day availability • Up-front estimates • Work guaranteed',
	        headline: 'Local pros you can trust — clean work, clear communication',
	        subheadline:
	          'Licensed & insured technicians for repairs, installs, and maintenance. Get a free estimate fast and choose a time that fits your schedule.',
	        bullets: [
	          'Up-front pricing before work begins',
	          'Respectful crews who protect your home and clean up',
	          'Warranty-backed workmanship with clear next steps',
	        ],
	        proofPoints: ['Free estimates', 'Fast response', 'Licensed & insured'],
	        ctaLabel: 'Get my free estimate',
	        secondaryCtaLabel: 'See services',
	        secondaryCtaHref: '#services',
        ctaHref: '#contact',
	        trustBadge: 'No-pressure quote • Work guaranteed • Friendly support',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
	        heading: 'Trusted by local homeowners',
	        supportingText: '4.9★ average • Licensed & insured • Up-front estimates',
	        logos: ['google-reviews', 'yelp', 'bbb', 'licensed-insured'],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'What We Offer',
	        subheading:
	          'Tell us what’s going on and we’ll recommend the fastest, most cost-effective fix — with pricing you can approve before we start.',
        services: [
          {
            title: 'Emergency Repairs',
	            description: 'Same-day help for urgent issues, leaks, outages, and safety concerns.',
            icon: 'wrench',
	            benefit: 'Get help fast',
          },
          {
            title: 'Full Installations',
	            description: 'Code-compliant installs and upgrades done right the first time.',
            icon: 'tool',
	            benefit: 'Upgrade safely',
          },
          {
            title: 'Maintenance Plans',
	            description: 'Seasonal tune-ups and preventative checks to avoid expensive surprises.',
            icon: 'shield',
	            benefit: 'Prevent surprises',
          },
          {
	            title: 'Up-front Estimates',
	            description: 'Clear options and pricing before work begins — no pressure.',
            icon: 'search',
	            benefit: 'Know the cost',
          },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Recent Work',
	        subheading: 'A few snapshots of the quality and cleanliness you can expect.',
	        caption1: 'Clean install with tidy lines, labeled shutoffs, and a final walkthrough.',
	        caption2: 'Repair completed with protective covering, sealed surfaces, and full cleanup.',
        imageAsset1: 'supportImage1',
        fallbackAsset1: 'fallbackSupportImage1',
        imageAsset2: 'supportImage2',
        fallbackAsset2: 'fallbackSupportImage2',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What Our Customers Say',
	        subheading: 'Fast response, clear pricing, and work that holds up.',
        testimonials: [
          {
            quote: 'They fixed our burst pipe at 2 AM — absolute lifesavers.',
	            highlight: 'absolute lifesavers',
	            rating: 5,
            name: 'Robert M.',
            title: 'Homeowner',
          },
          {
            quote: 'Honest, fair pricing and incredible workmanship.',
	            highlight: 'fair pricing',
	            rating: 5,
            name: 'Jennifer H.',
            title: 'Property Manager',
          },
          {
            quote: 'The only contractor I will ever call again.',
	            highlight: 'call again',
	            rating: 5,
            name: 'Tom R.',
            title: 'Repeat Customer',
          },
        ],
      },
    },
    {
      type: 'FinalCTA',
      props: {
	        heading: 'Get your free estimate',
	        subheading:
	          'Tell us what you need and we’ll reply fast with availability, options, and a clear quote you can approve before work begins.',
	        ctaLabel: 'Request my estimate',
	        urgency: 'Same-day slots can fill quickly',
	        nextSteps: ['Share a few details', 'We confirm timing + price', 'We show up, fix it, and clean up'],
	        guarantee: 'Up-front estimate • Work guaranteed • No pressure',
	        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-local-hero-01',
    supportImage1: 'demo-local-card-01',
    supportImage2: 'demo-local-card-02',

    // Fallbacks (local generated placeholders)
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackSupportImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackSupportImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  form: [
	    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
	    { name: 'email', type: 'email', placeholder: 'Email for your estimate', required: true },
	    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    {
      name: 'message',
      type: 'textarea',
	      placeholder: 'What do you need help with? (Include your city/ZIP and any deadlines)',
      required: false,
    },
  ],

  metadata: {
    name: 'Local Pro Lead Gen',
    description:
      'A high-trust lead generation template for local service businesses. ' +
      'Navy + orange palette, split hero, social proof bar, service grid, testimonials, and a strong CTA form.',
    tags: [
      'local-services',
      'lead-gen',
      'plumber',
      'contractor',
      'electrician',
      'trust',
    ],
  },
};

export default spec;

