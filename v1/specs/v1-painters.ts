/**
 * v1-painters
 *
 * High-Converting Local Service blueprint for residential & commercial painters.
 */

import { TemplateSpec } from './schema';

const BRAND = 'TrueLine Painting Co.';
const PHONE = '(555) 624-9080';

const spec: TemplateSpec = {
  templateId: 'v1-painters',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'painters',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🎨 Free Color Consult • 5-Year Workmanship Warranty • 14+ Years in the Metro', phone: PHONE, hours: 'Mon–Sat 7am–7pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Sherwin-Williams pro partner • Free color consult • Serving Westbrook, Lakehurst & 30+ neighborhoods',
        headline: 'Walls that look new for a decade. Quoted free, today.',
        subheadline: 'Stop chasing painters who lowball the bid and ghost after the deposit. Our W-2 crew preps every wall right, uses premium paint, and warranties the work for 5 years in writing.',
        bullets: ['Free in-home color consult + written line-item quote','W-2 crews (no day labor) — clean drop cloths and tidy daily','5-year workmanship warranty + 2 coats Sherwin-Williams premium'],
        proofPoints: ['4.9★ • 410+ reviews','SW pro partner','5-year warranty'],
        ctaLabel: 'Get my free painting quote',
        formHeading: 'Tell us about your project',
        formSubheading: 'A real estimator replies within 15 minutes during business hours.',
        trustBadge: '✓ Free quotes. No deposit until day-of. Most quotes returned in under 48 hours.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 412 reviews', icon: 'star' },
      { label: 'Sherwin-Williams', detail: 'pro partner since 2014', icon: 'shield' },
      { label: '14+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'W-2 crews', detail: 'no day labor', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited since 2013', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we paint, prep, and protect',
        subheading: 'A real estimator walks the project, lists every wall and trim, and writes a fixed quote — no "while we are here" upcharges.',
        services: [
          { title: 'Interior painting', description: 'Whole-home repaints in Westbrook with 2 premium coats, all trim, ceilings, and doors included.', icon: 'wrench', benefit: 'Move-in fresh in 3 days' },
          { title: 'Exterior painting', description: 'Power-wash, scrape, prime, and 2-coat finish on Lakehurst homes — 5-year workmanship warranty.', icon: 'tool', benefit: '+8% curb appeal proven' },
          { title: 'Cabinets & trim', description: 'Off-site spray-finished cabinets in our Westbrook shop — factory-smooth result, 1-week turnaround.', icon: 'shield', benefit: 'Looks like new cabinets' },
          { title: 'Color consultation', description: 'Free 60-minute in-home consult with our Sherwin-Williams design partner — bring photos, leave with palettes.', icon: 'search', benefit: 'No more wrong color' },
          { title: 'Drywall & plaster repair', description: 'Cracks, dings, water marks, and full skim-coats prepped before paint — Westbrook walls flawless under every coat.', icon: 'tool', benefit: 'Walls actually flat' },
          { title: 'Deck & fence stain/seal', description: 'Penetrating semi-transparent stain on cedar, pressure-treated, and old-growth fences in Lakehurst — 3-year color hold.', icon: 'shield', benefit: 'Wood lasts 2× longer' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 410+ neighbors picked TrueLine',
        heading: 'Tired of painters who lowball, then upcharge?',
        subheading: '"$3K total" quotes that turn into $5,200 with "we found wood rot," and crews that disappear for 3 days mid-job — that ends here.',
        items: [
          { title: 'W-2 crews, not day labor', description: 'Every painter on your job is a TrueLine employee with paid training. Same crew start to finish, foreman daily.' },
          { title: 'Line-item written quotes', description: 'You see square footage, paint grade, and labor for every wall. No bundled "labor & materials $X,XXX" mystery.' },
          { title: 'Real prep, not paint over dust', description: 'Sand, fill, caulk, prime — documented with photos. We refuse to paint over peeling or trim that should be replaced.' },
          { title: '5-year workmanship warranty', description: 'If our paint peels, blisters, or fails in 5 years, we come back and re-coat the room free. In writing, every job.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every project — included',
        heading: 'What your free painting quote actually covers',
        subheading: 'Every line-item quote we send to Westbrook, Lakehurst, and Brookhaven homes includes the work below — no surprise add-ons.',
        items: [
          'Free in-home walk-through in Westbrook, Lakehurst, Brookhaven, Northridge + Maple Lane',
          'Free 60-min Sherwin-Williams color consult',
          'Sand, fill, caulk, and prime as needed',
          'Drop cloths on every floor + plastic on furniture',
          '2 premium coats on every wall and trim',
          'Daily cleanup + final walkthrough',
          '5-year written workmanship warranty',
          'Touch-up paint labeled and left for you',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Stop guessing. Start picking colors.',
        headline: 'Your free painting quote is 48 hours away.',
        subheadline: 'Tell us about your project and we book a same-week walk-through in Westbrook, Lakehurst or Brookhaven — line-item quote, no obligation.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 410+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Westbrook, Lakehurst, and Brookhaven.',
        testimonials: [
          { quote: 'TrueLine painted our entire 4-bedroom Westbrook home in 4 days. The line-item quote was exact to the dollar — $11,840, no surprises. Walls look better than the day we moved in.', highlight: 'exact to the dollar', rating: 5, name: 'Amanda K.', title: 'Westbrook homeowner' },
          { quote: 'Got 6 quotes for our Lakehurst exterior. TrueLine was not the cheapest, but the only one with a written 5-year warranty and W-2 crew. 2 years later, zero peeling.', highlight: 'zero peeling 2 years later', rating: 5, name: 'David R.', title: 'Lakehurst homeowner' },
          { quote: 'Off-site cabinet spraying in Brookhaven — they took my doors to their shop, sprayed in 5 days, and the finish looks factory. Not a brush-stroke in sight.', highlight: 'looks factory', rating: 5, name: 'Linh P.', title: 'Brookhaven homeowner' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent projects in your neighborhood',
        subheading: 'Snapshots from Westbrook, Lakehurst, and Brookhaven — clean lines, full coverage, tidy worksites.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Whole-home interior repaint in Westbrook — 4 days, 8 rooms, line-item quote.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Exterior repaint in Lakehurst — full prep, 2 coats, 5-year warranty.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Off-site sprayed kitchen cabinets in Brookhaven — factory finish in 5 days.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From dingy walls to magazine-worthy in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us about the space', description: 'Submit the form or call. A real human in our Westbrook office picks up in under 2 minutes.' },
          { title: '2. Free in-home walk-through', description: 'Estimator measures every wall, talks colors, and emails a line-item quote within 48 hours.' },
          { title: '3. Color consult + scheduling', description: 'Free Sherwin-Williams design consult. We lock in your start date with a written work order.' },
          { title: '4. We prep, paint, and clean up', description: 'Drop cloths down, full prep, 2 coats, daily cleanup, and the warranty paperwork emailed.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Painting questions, answered straight',
        items: [
          { question: 'How fast can you start?', answer: 'Most Westbrook and Lakehurst interior projects start within 1–2 weeks; exteriors during paint season (April–October) book 3–4 weeks out.' },
          { question: 'Are quotes really free?', answer: 'Yes — free in-home walk-through and a line-item quote within 48 hours. No deposit until day-of-start.' },
          { question: 'Do you use cheap paint?', answer: 'Never. Standard is Sherwin-Williams Cashmere or SuperPaint, applied 2 coats over proper prep. We share the data sheet on every quote.' },
          { question: 'What about prep work?', answer: 'Prep is 60% of the job. We sand, fill, caulk, and prime — and document peeling or rot with photos before we start.' },
          { question: 'What is your warranty?', answer: '5 years on workmanship. If our paint peels, blisters, or fails inside that window, we re-coat the room free.' },
          { question: 'What neighborhoods do you serve?', answer: 'Westbrook, Lakehurst, Brookhaven, Northridge, Maple Lane, plus 25+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-month coverage for these communities — and 25+ surrounding neighborhoods.',
        areas: ['Westbrook','Lakehurst','Brookhaven','Northridge','Maple Lane','Cedarpoint','Foxhill','Stoneview','Ashford','Birch Hollow','Hawthorne','Glenmore','Sunnyside','Riverside Heights','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 5-Year Workmanship Promise',
        headline: 'If our paint fails — we come back and re-coat the room, free.',
        description: 'Every interior and exterior project carries a 5-year written workmanship warranty. If anything we painted peels, blisters, or fails inside that window, we re-coat the room at zero cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free painting quote in 48 hours',
        subheading: 'Tell us about your project and we book a same-week walk-through, write a line-item quote, and warranty the work for 5 years.',
        ctaLabel: 'Request my free quote',
        urgency: 'Paint-season slots in Westbrook & Lakehurst fill quickly — book early',
        nextSteps: ['Share a few details','We confirm timing + line-item quote','We prep, paint, and clean up daily'],
        guarantee: 'Free quotes • 5-year warranty • W-2 crews',
        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Sherwin-Williams pro partner, locally owned, and trusted by 410+ metro homeowners since 2011.',
        phone: PHONE, email: 'help@truelinepaint.example',
        address: '742 Westbrook Way, [City] Metro, 90418',
        hours: 'Mon–Sat 7am–7pm',
        licenseLine: 'License #PT-19847 • $2M insured • SW Pro Partner',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-painters-hero-01',
    differentiatorImage: 'demo-painters-differentiator-01',
    checklistImage: 'demo-painters-checklist-01',
    galleryImage1: 'demo-painters-gallery-01',
    galleryImage2: 'demo-painters-gallery-02',
    galleryImage3: 'demo-painters-gallery-03',
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
    heroImageId: 'real photo professional house painter rolling wall paint residential interior',
    differentiatorImage: 'real photo painting crew foreman with drop cloth color samples customer home',
    checklistImage: 'real photo painter prepping wall sanding caulking before painting',
    galleryImage1: 'real photo freshly painted living room interior modern home neutral colors',
    galleryImage2: 'real photo exterior house painting two story residential clean lines',
    galleryImage3: 'real photo white spray painted kitchen cabinets factory finish smooth',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'projectType', type: 'select', label: 'What needs painting?', placeholder: 'Select project type', required: false, options: ['Interior','Exterior','Cabinets','Deck / fence stain','Drywall + paint','Color consult'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: interior, exterior, or cabinets? (Include city/ZIP and rough timing)', required: false },
  ],

  metadata: {
    name: 'Painters Lead Gen',
    description: 'High-converting lead-gen page for residential painters — free color consult, line-item quotes, 5-year warranty.',
    tags: ['painters','painting','interior-painting','exterior-painting','local-services','home-services','lead-gen'],
  },
};

export default spec;
