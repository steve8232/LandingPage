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
        headline: 'Your Trusted Local Experts — Fast, Reliable Service',
        subheadline:
          'Licensed, insured, and ready to help. Call now or fill out the form for a free estimate.',
        ctaLabel: 'Get a Free Estimate',
        ctaHref: '#contact',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'SocialProofLogos',
      props: {
        heading: 'Trusted by Homeowners Across the Region',
        logos: ['bbb', 'google-reviews', 'homeadvisor', 'angies-list'],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'What We Offer',
        services: [
          {
            title: 'Emergency Repairs',
            description: '24/7 same-day service for urgent problems.',
            icon: 'wrench',
          },
          {
            title: 'Full Installations',
            description: 'Licensed professionals for new installs and upgrades.',
            icon: 'tool',
          },
          {
            title: 'Maintenance Plans',
            description: 'Preventive care that saves you money long-term.',
            icon: 'shield',
          },
          {
            title: 'Free Inspections',
            description: 'Honest assessments with upfront pricing.',
            icon: 'search',
          },
        ],
      },
    },
    {
      type: 'ImagePair',
      props: {
        heading: 'Recent Work',
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
        testimonials: [
          {
            quote: 'They fixed our burst pipe at 2 AM — absolute lifesavers.',
            name: 'Robert M.',
            title: 'Homeowner',
          },
          {
            quote: 'Honest, fair pricing and incredible workmanship.',
            name: 'Jennifer H.',
            title: 'Property Manager',
          },
          {
            quote: 'The only contractor I will ever call again.',
            name: 'Tom R.',
            title: 'Repeat Customer',
          },
        ],
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Ready to Get Started?',
        subheading:
          'Fill out the form below and we will be in touch within the hour.',
        ctaLabel: 'Request a Callback',
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
    { name: 'name', type: 'text', placeholder: 'Your Name', required: true },
    { name: 'email', type: 'email', placeholder: 'Your Email', required: true },
    { name: 'phone', type: 'tel', placeholder: 'Your Phone', required: false },
    {
      name: 'message',
      type: 'textarea',
      placeholder: 'Tell us about your needs...',
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

