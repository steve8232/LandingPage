/**
 * v1-auto-detail
 *
 * High-Converting Local Service blueprint for mobile + studio auto detailing.
 */

import { TemplateSpec } from './schema';

const BRAND = 'Apex Mobile Auto Detailing';
const PHONE = '(555) 318-0762';

const spec: TemplateSpec = {
  templateId: 'v1-auto-detail',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'auto-detail',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '\ud83d\ude97 IDA-Certified Detailers \u2022 We Come To Your Driveway \u2022 First-Time $30 Off Full Detail', phone: PHONE, hours: 'Mon\u2013Sat 7am\u20137pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Book Detail', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'IDA-certified detailers \u2022 We come to you \u2022 Serving Westside, Riverside & 18+ neighborhoods',
        headline: 'A showroom-clean car \u2014 detailed in your driveway in 4 hours.',
        subheadline: 'Stop wasting Saturdays at $9 drive-through tunnels that scratch your clear coat. Our IDA-certified detailers bring water, power, and pro-grade gear to your driveway and deliver a true showroom finish in about 4 hours \u2014 inside and out.',
        bullets: ['IDA-certified detailers \u2014 not weekend-warrior side hustles','Mobile service \u2014 we come to your home or office driveway','Showroom finish in about 4 hours \u2014 paint-safe, no swirl marks'],
        proofPoints: ['4.9\u2605 \u2022 540+ reviews','IDA-certified','Mobile to your driveway'],
        ctaLabel: 'Book my mobile detail',
        formHeading: 'Tell us about your vehicle',
        formSubheading: 'A real detailer replies within 1 hour during business hours.',
        trustBadge: '\u2713 First-time $30 off any full detail \u2014 same-week appointments often available.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9\u2605 Google', detail: 'from 542 reviews', icon: 'star' },
      { label: 'IDA-certified', detail: 'detailers + ceramic installers', icon: 'shield' },
      { label: '7+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Mobile service', detail: 'we bring everything', icon: 'clock' },
      { label: '8,500+ details', detail: 'cars, trucks + SUVs', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Detail packages for daily drivers, weekend toys, and trade-in prep',
        subheading: 'Every detail is performed by an IDA-certified pro using paint-safe two-bucket wash, microfiber-only contact, and pro-grade chemicals \u2014 no swirl marks, no shortcuts.',
        services: [
          { title: 'Full interior + exterior detail', description: 'Two-bucket wash, clay bar, sealant, full interior shampoo + steam, leather treatment in your Westside driveway. ~4 hours, showroom finish.', icon: 'wrench', benefit: 'Top-to-bottom showroom clean' },
          { title: 'Paint correction', description: 'One- or two-stage machine polish in Riverside \u2014 removes 70\u201395% of swirl marks, water spots, and light scratches. Then sealed.', icon: 'tool', benefit: 'Paint looks new again' },
          { title: 'Ceramic coating', description: 'IDA-certified ceramic installs across Highland \u2014 5- and 7-year coatings, prep + decontaminate + cure, full warranty paperwork.', icon: 'shield', benefit: 'Years of easy washing' },
          { title: 'Trade-in / sale prep', description: 'Brookline trade-in detail \u2014 KBB studies say a clean car sells for $400\u2013$1,500 more. Engine bay, headlights, the works.', icon: 'search', benefit: 'Higher trade-in offer' },
          { title: 'Headlight restoration', description: 'Cloudy/yellow headlights wet-sanded, machine-polished, and UV-sealed in Westside — restored clarity for years, not weeks.', icon: 'tool', benefit: 'Brighter, safer drives' },
          { title: 'Engine bay & under-hood', description: 'Steam, degrease, dress, and protect engine bay in Highland — judges-show finish without harming components.', icon: 'search', benefit: 'Looks new under the hood' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 540+ owners picked Apex',
        heading: 'Tired of $9 tunnels, swirl marks, and \u201cmobile detailers\u201d who never show?',
        subheading: 'Drive-through car washes scratch your clear coat. Side-hustle \u201cdetailers\u201d cancel last minute, use one bucket, and leave streaks. We do this professionally.',
        items: [
          { title: 'IDA-certified, paint-safe', description: 'Every detailer holds International Detailing Association certification. Two-bucket wash, microfiber-only contact, pH-balanced chemicals. Zero swirl marks.' },
          { title: 'Truly mobile \u2014 we bring it all', description: 'Self-contained 60-gallon water tank, 6500W generator, hot water, and pro-grade extractors. No water hookup, no power hookup needed.' },
          { title: 'On-time, every time', description: 'Live ETA texted at job start. If we\u2019re going to be more than 15 minutes late, you get $20 off automatically. Real accountability.' },
          { title: 'Real ceramic warranties', description: 'IDA-certified ceramic installers, manufacturer-backed 5- + 7-year warranties, registered paperwork in your name. Not a $99 \u201cspray ceramic\u201d.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every full detail \u2014 included',
        heading: 'What\u2019s included with every full interior + exterior detail',
        subheading: 'Every full detail in Westside, Riverside, and Highland includes the work below \u2014 no surprise add-on fees.',
        items: [
          'Mobile service in Westside, Riverside, Highland, Brookline + Maple Heights',
          'Two-bucket hand wash + foam pre-soak + clay-bar decontamination',
          'Wheel + tire deep clean + dressing',
          'Iron + tar removal + paint sealant (6-month protection)',
          'Full interior vacuum + steam + extraction',
          'Leather conditioning + plastic UV-protectant',
          'Glass inside + out + streak-free finish',
          'Engine-bay clean + dress on full-detail packages',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Out of weekends?',
        headline: 'Book your mobile detail in your driveway today.',
        subheadline: 'Tell us your vehicle, condition, and goal \u2014 we\u2019ll send a fixed quote with no surprise fees and lock in a same-week slot.',
        ctaLabel: 'Book my mobile detail', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 540+ vehicle owners say',
        subheading: 'Verified Google reviews from owners in Westside, Riverside, and Highland.',
        testimonials: [
          { quote: '2018 Tahoe with kids and dogs in Westside \u2014 looked rough. Apex spent 5 hours in my driveway, came out looking like the dealer lot. Used a steamer on the car seats. Worth every dollar.', highlight: 'looked like the dealer lot', rating: 5, name: 'Marcus L.', title: 'Westside owner' },
          { quote: 'Two-stage paint correction + 5-year ceramic on my BMW in Riverside \u2014 swirl marks I had given up on, GONE. Real warranty paperwork in my name. Six months in, water still beads.', highlight: 'swirl marks gone', rating: 5, name: 'Ava K.', title: 'Riverside owner' },
          { quote: 'Trade-in detail in Highland \u2014 paid $279, dealer offered $1,400 more than the prior week\u2019s scan-quote. Apex paid for itself 5 times over. Showed up exactly on time.', highlight: '$1,400 more on trade-in', rating: 5, name: 'Damian P.', title: 'Highland owner' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent details from our pros',
        subheading: 'Snapshots from Westside, Riverside, and Highland \u2014 real driveways, real before/afters, real showroom finishes.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Westside Tahoe \u2014 4-hour full detail in driveway.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Riverside BMW \u2014 2-stage paint correction + 5-yr ceramic.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Highland trade-in detail \u2014 +$1,400 dealer offer.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From booking to showroom finish in 4 steps',
        subheading: 'No phone tag, no surprise fees. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us about your vehicle', description: 'Submit the form with year, make, condition, and goal (full detail, paint correction, ceramic). Real detailer replies in 1 hour.' },
          { title: '2. Fixed quote + locked-in slot', description: 'You get a fixed price (no surprise fees) and a same-week slot. We text a confirmation + a 30-minute arrival window.' },
          { title: '3. We arrive + detail in your driveway', description: 'Self-contained truck rolls up: water, power, gear, all of it. 4-hour full detail or 6\u20138 hours for paint correction + ceramic.' },
          { title: '4. Final walk-through + photos', description: 'We walk you around the vehicle, point out everything we did, and text high-res before/after photos. Pay only when satisfied.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Auto detailing questions, answered straight',
        items: [
          { question: 'How fast can I get an appointment?', answer: 'Most Westside and Riverside customers book within 3\u20135 days. Same-week slots usually available Tue\u2013Thu.' },
          { question: 'Do you really come to my driveway?', answer: 'Yes \u2014 fully mobile. Self-contained 60-gallon water tank, 6500W generator, hot water, pro-grade extractors. No hookups needed from you.' },
          { question: 'Will detailing damage my paint?', answer: 'No \u2014 every detailer is IDA-certified. Two-bucket wash, microfiber-only contact, pH-balanced chemicals. Drive-throughs cause swirls; we don\u2019t.' },
          { question: 'How long does a full detail take?', answer: 'A full interior + exterior detail runs about 4 hours. Paint correction + ceramic coating is 6\u20138 hours \u2014 we plan accordingly.' },
          { question: 'Are ceramic-coating warranties real?', answer: 'Yes \u2014 our 5- and 7-year ceramics are manufacturer-backed by IDA-certified installers. You get registered warranty paperwork in your name.' },
          { question: 'What neighborhoods do you serve?', answer: 'Westside, Riverside, Highland, Brookline, Maple Heights, plus 13+ surrounding metro neighborhoods.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Customers from across the metro',
        heading: 'Mobile-detail service in these communities',
        subheading: 'Driveway service across the metro \u2014 most jobs scheduled within 5 days.',
        areas: ['Westside','Riverside','Highland','Brookline','Maple Heights','Stoneview','Lakeview','Cedar Hollow','Pinegrove','Glen Acres','Foxhill','Birch Park','Northridge','Hawthorne','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don\u2019t see your neighborhood? We service most of the metro \u2014 ask when you book. Coverage spans [City] and surrounding [County].',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our Showroom-Finish Guarantee',
        headline: 'Not happy? We come back free within 48 hours.',
        description: 'If anything is missed or doesn\u2019t meet your expectations, we come back within 48 hours and re-do it at zero cost. You don\u2019t pay until you walk around the vehicle and approve the work. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Book your mobile detail in your driveway today',
        subheading: 'IDA-certified detailers, fully self-contained truck, paint-safe two-bucket wash, and a true showroom finish in about 4 hours \u2014 with before/after photos texted to you.',
        ctaLabel: 'Book my mobile detail',
        urgency: 'Saturday slots fill up 1\u20132 weeks ahead \u2014 book early or pick a weekday',
        nextSteps: ['Tell us your vehicle','Fixed quote + same-week slot','4-hour driveway detail + photos'],
        guarantee: '$30 off first detail \u2022 IDA-certified \u2022 48-hour redo guarantee',
        privacyNote: 'No spam \u2014 your info is private and only used to schedule.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'IDA-certified detailers, fully mobile service, and 540+ trusting vehicle owners since 2018.',
        phone: PHONE, email: 'detail@apexmobiledetail.example',
        address: '1140 Westside Industrial Park, [City] Metro, 90142',
        hours: 'Mon\u2013Sat 7am\u20137pm',
        licenseLine: 'IDA-certified \u2022 Fully insured + bonded \u2022 Manufacturer-authorized ceramic installer',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-auto-detail-hero-01',
    differentiatorImage: 'demo-auto-detail-differentiator-01',
    checklistImage: 'demo-auto-detail-checklist-01',
    galleryImage1: 'demo-auto-detail-gallery-01',
    galleryImage2: 'demo-auto-detail-gallery-02',
    galleryImage3: 'demo-auto-detail-gallery-03',
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
    heroImageId: 'real photo professional mobile auto detailer washing car driveway foam cannon two bucket',
    differentiatorImage: 'real photo IDA certified detailer paint correction polishing machine luxury car',
    checklistImage: 'real photo car interior steam extraction leather seat detailing professional',
    galleryImage1: 'real photo SUV full detail before after exterior driveway showroom finish',
    galleryImage2: 'real photo BMW paint correction ceramic coating water beading deep gloss',
    galleryImage3: 'real photo trade in car detail engine bay headlights restored',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Your full name', required: true },
    { name: 'vehicleType', type: 'select', label: 'Vehicle type?', placeholder: 'Select your vehicle type', required: false, options: ['Sedan / coupe','SUV / crossover','Truck / pickup','Luxury / exotic','Van / minivan','Other'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for confirmations)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: vehicle year/make, condition, and what you\u2019d like done', required: false },
  ],

  metadata: {
    name: 'Auto Detailing Lead Gen',
    description: 'High-converting lead-gen page for mobile + studio auto detailing \u2014 IDA-certified, fully mobile, paint-safe, ceramic coatings, showroom-finish guarantee.',
    tags: ['auto-detail','mobile-detailing','ceramic-coating','paint-correction','automotive','lead-gen'],
  },
};

export default spec;
