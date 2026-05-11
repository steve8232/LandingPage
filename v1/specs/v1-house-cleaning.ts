/**
 * v1-house-cleaning
 *
 * High-Converting Local Service blueprint for residential house cleaning companies.
 */

import { TemplateSpec } from './schema';

const BRAND = 'BrightNest House Cleaning';
const PHONE = '(555) 922-3104';

const spec: TemplateSpec = {
  templateId: 'v1-house-cleaning',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'house-cleaning',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🧽 Free Online Quotes • Same Cleaner Every Visit • 200% Happiness Guarantee', phone: PHONE, hours: 'Mon–Sat 7am–6pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Same cleaner every visit • Bonded + insured • Serving Brookwood, Crestline & 28+ neighborhoods',
        headline: 'Come home to a spotless house — without lifting a finger.',
        subheadline: 'Stop spending Saturdays cleaning instead of living. We send the same vetted, background-checked cleaner every visit, follow a 50-point checklist, and back it with a 200% happiness guarantee.',
        bullets: ['Same cleaner every visit — they know your home, your kids, your dogs','50-point top-to-bottom checklist on every clean','200% happiness guarantee — re-clean within 24 hours, free'],
        proofPoints: ['4.9★ • 410+ reviews','Bonded + insured','Same cleaner every visit'],
        ctaLabel: 'Get my free quote',
        formHeading: 'Tell us about your home',
        formSubheading: 'A real person replies within 1 hour during business hours.',
        trustBadge: '✓ Free quotes online. No long-term contracts. Cancel any time.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 412 reviews', icon: 'star' },
      { label: 'Bonded + insured', detail: '$2M general liability', icon: 'shield' },
      { label: '9+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Same cleaner', detail: 'every visit', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited since 2017', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What every clean covers (and what we never skip)',
        subheading: 'A 50-point checklist that hits the spots most "fast" cleaning services skip — baseboards, behind appliances, inside microwaves.',
        services: [
          { title: 'Recurring weekly / bi-weekly', description: 'Same cleaner every visit in Brookwood — they learn your home and the spots that drive you crazy.', icon: 'wrench', benefit: 'Save 4+ hrs/week' },
          { title: 'Deep cleans', description: 'Top-to-bottom in Crestline homes — baseboards, vents, ceiling fans, inside oven and fridge included.', icon: 'tool', benefit: 'Like a fresh start' },
          { title: 'Move-in / move-out', description: 'Empty-house deep clean across Westgate — we work with realtors and landlords for a 100% deposit-back finish.', icon: 'shield', benefit: 'Maximum deposit return' },
          { title: 'Airbnb + short-term turnover', description: 'Same-day turnovers in Northridge with linen change, restock, and 5-star photo report — built for hosts.', icon: 'search', benefit: 'Sparkling 5-star reviews' },
          { title: 'Post-construction clean', description: 'Drywall dust, paint flecks, and adhesive removed across Westgate remodels — 2-pass clean ready for the photo shoot.', icon: 'tool', benefit: 'Photo-ready in one day' },
          { title: 'Eco-friendly green clean', description: 'Plant-based, fragrance-free products in Crestline homes with kids, pets, allergies, and asthma — same sparkle, zero residue.', icon: 'search', benefit: 'Safe for kids + pets' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 410+ neighbors picked BrightNest',
        heading: 'Tired of "cleaners" who rush, skip, or send a different stranger every time?',
        subheading: '90-minute "deep cleans," teams of strangers, missing baseboards, and stolen earrings end here.',
        items: [
          { title: 'Same cleaner every visit', description: 'You get the same vetted, English-speaking cleaner every time — they learn your home and your standards.' },
          { title: '50-point checklist', description: 'Every clean follows the same checklist — including baseboards, light switches, behind toilets. We send a photo report after.' },
          { title: 'Background-checked + bonded', description: 'Every cleaner passes a national background check, drug screen, and reference check. Bonded for theft + breakage.' },
          { title: '200% happiness guarantee', description: 'Not happy? We re-clean within 24 hours, free. Still not happy? Your money back, no questions.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every clean — included',
        heading: 'What our 50-point checklist actually covers',
        subheading: 'Every recurring clean we do in Brookwood, Crestline, and Westgate hits these spots — guaranteed.',
        items: [
          'Free online quote in Brookwood, Crestline, Westgate, Northridge + Maple Grove',
          'Bathrooms: tub, shower, toilet, mirrors, floor + baseboards',
          'Kitchen: counters, stovetop, microwave, fridge front, sinks',
          'Bedrooms: dust, vacuum, made-bed, wipe nightstands',
          'Living areas: dust, vacuum, mop, light switches, baseboards',
          'Inside-window sills + entry doors',
          'Eco-friendly products on request, no extra charge',
          '200% happiness re-clean within 24 hours',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Done losing Saturdays to chores?',
        headline: 'Free quote in 60 seconds — first clean as soon as Friday.',
        subheadline: 'Tell us your home size and how often you want service. We email a flat-rate quote within 1 hour and book your first visit.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 410+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Brookwood, Crestline, and Westgate.',
        testimonials: [
          { quote: 'Same cleaner for 14 months in our Brookwood home — knows our 2 dogs, knows we hate fingerprints on stainless. Saturdays are mine again.', highlight: 'Saturdays are mine again', rating: 5, name: 'Renee D.', title: 'Brookwood homeowner' },
          { quote: 'Move-out clean in Crestline — landlord returned 100% of our $3,200 deposit. The before/after photo report was unreal. Worth twice what they charged.', highlight: '100% of $3,200 deposit', rating: 5, name: 'Tomas A.', title: 'Crestline tenant' },
          { quote: 'I run 2 Westgate Airbnbs. BrightNest does same-day turnovers, restocks, and sends photos before guests arrive. Reviews jumped from 4.6 to 4.9 in 3 months.', highlight: '4.6 to 4.9 in 3 months', rating: 5, name: 'Priya N.', title: 'Westgate Airbnb host' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent cleans in your neighborhood',
        subheading: 'Snapshots from Brookwood, Crestline, and Westgate — sparkling kitchens, made beds, lemon-fresh bathrooms.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Recurring bi-weekly in Brookwood — same cleaner for 14 months.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Move-out deep clean in Crestline — 100% deposit returned.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Airbnb same-day turnover in Westgate — 5-star photo report.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From overwhelmed to spotless in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us about your home', description: 'Submit the form with home size, bedrooms/baths, and how often you want service. Real human replies in 1 hour.' },
          { title: '2. Free flat-rate quote', description: 'Quote in your inbox same day. Pick a start date — no contract, cancel any time.' },
          { title: '3. Meet your cleaner', description: 'Same cleaner shows up for the first visit (and every visit). Walk-through, then they get to work.' },
          { title: '4. Photo report + 24-hour guarantee', description: 'You get a photo report after every clean. Anything missed? We re-clean within 24 hours, free.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'House cleaning questions, answered straight',
        items: [
          { question: 'How fast can you start?', answer: 'Most Brookwood and Crestline customers get their first clean within 5–7 business days. We confirm a 1-hour arrival window.' },
          { question: 'Are quotes really free?', answer: 'Yes — share home size and frequency. We email a flat-rate quote within 1 hour during business hours.' },
          { question: 'Will I get the same cleaner?', answer: 'Always — same vetted cleaner every recurring visit. If your cleaner is sick, we ask before sending a backup.' },
          { question: 'Are cleaners background-checked?', answer: 'Yes — national background check, drug screen, reference check, and bond for every cleaner. Photos and bios on request.' },
          { question: 'What is your guarantee?', answer: '200% happiness guarantee. Anything missed gets re-cleaned within 24 hours, free. Still not happy? Money back.' },
          { question: 'What neighborhoods do you serve?', answer: 'Brookwood, Crestline, Westgate, Northridge, Maple Grove, plus 23+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every week',
        subheading: 'Recurring + one-time service for these communities — and 23+ surrounding neighborhoods.',
        areas: ['Brookwood','Crestline','Westgate','Northridge','Maple Grove','Stoneview','Lakeview','Cedar Hollow','Pinegrove','Glen Acres','Birch Park','Foxhill','Greenview','Hawthorne','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 200% Happiness Promise',
        headline: 'If we miss anything — we re-clean it, free.',
        description: 'Every clean carries a 24-hour re-clean guarantee. If anything is missed or below standard, we come back within 24 hours and re-clean at zero cost. Still not happy? Money back, no questions. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your house cleaning quote in 1 hour',
        subheading: 'Share your home size and how often you want service. We email a flat-rate quote and start as soon as Friday.',
        ctaLabel: 'Request my free quote',
        urgency: 'Recurring slots in Brookwood & Crestline fill up fast — first 10 callers this week save 20%',
        nextSteps: ['Share home size + frequency','We email a flat-rate quote','We send your dedicated cleaner'],
        guarantee: 'Free quotes • Same cleaner every visit • 200% happiness guarantee',
        privacyNote: 'No spam — we only contact you about your service.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Locally owned, bonded + insured, and trusted by 410+ metro households since 2016.',
        phone: PHONE, email: 'help@brightnestclean.example',
        address: '512 Brookwood Lane, [City] Metro, 90613',
        hours: 'Mon–Sat 7am–6pm',
        licenseLine: 'Bonded $1M • Insured $2M • Background-checked + drug-screened cleaners',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-house-cleaning-hero-01',
    differentiatorImage: 'demo-house-cleaning-differentiator-01',
    checklistImage: 'demo-house-cleaning-checklist-01',
    galleryImage1: 'demo-house-cleaning-gallery-01',
    galleryImage2: 'demo-house-cleaning-gallery-02',
    galleryImage3: 'demo-house-cleaning-gallery-03',
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo professional house cleaner sparkling kitchen counters bright home',
    differentiatorImage: 'real photo female house cleaner uniform vacuuming living room residential',
    checklistImage: 'real photo housekeeper wiping bathroom tile shower clean residential',
    galleryImage1: 'real photo spotless residential kitchen recently cleaned natural light',
    galleryImage2: 'real photo deep cleaned bathroom shining tile shower glass residential',
    galleryImage3: 'real photo made bed clean bedroom residential turnover service',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'serviceType', type: 'select', label: 'What kind of clean?', placeholder: 'Select clean type', required: false, options: ['Standard recurring','Deep clean','Move-in / move-out','Post-construction','Airbnb turnover','Eco-friendly'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: home size, bedrooms/baths, how often? (Include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'House Cleaning Lead Gen',
    description: 'High-converting lead-gen page for residential house cleaning — same cleaner every visit, 50-point checklist, 200% happiness guarantee.',
    tags: ['house-cleaning','maid-service','recurring-cleaning','airbnb-cleaning','local-services','home-services','lead-gen'],
  },
};

export default spec;
