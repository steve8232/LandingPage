/**
 * v1-hvac
 *
 * High-Converting Local Service blueprint for HVAC contractors.
 */

import { TemplateSpec } from './schema';

const BRAND = 'NorthAir Heating & Cooling';
const PHONE = '(555) 318-2244';

const spec: TemplateSpec = {
  templateId: 'v1-hvac',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'hvac',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '❄️ Same-Day AC + Furnace Repair • Free In-Home Estimates • 15+ Years Local', phone: PHONE, hours: 'Open now • 24/7 emergency repair' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Book Free Estimate', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: '24/7 emergency • NATE-certified techs • Serving Brookfield, Hillcrest & 40+ neighborhoods',
        headline: 'Cool house tonight. Lower bill next month.',
        subheadline: 'Stop sweating it out while contractors juggle bigger jobs. Our techs arrive same-day, diagnose for free with a written quote, and back every install with a 10-year parts warranty.',
        bullets: ['Same-day AC + furnace repair — even Sundays in Hillcrest','Free in-home estimates with flat-rate pricing in writing','10-year parts + 2-year labor warranty on every install'],
        proofPoints: ['4.9★ • 740+ reviews','NATE-certified','Same-day service'],
        ctaLabel: 'Book my free estimate',
        formHeading: 'Tell us what is going on',
        formSubheading: 'A real tech replies within 15 minutes during business hours.',
        trustBadge: '✓ Free quotes. No pressure. Most appointments confirmed in under 30 minutes.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 742 reviews', icon: 'star' },
      { label: 'NATE-certified', detail: 'every tech, every job', icon: 'shield' },
      { label: '15+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Same-day service', detail: '7 days a week', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited since 2012', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we install, repair, and tune up',
        subheading: 'A NATE-certified tech diagnoses the real problem and recommends the cheapest fix that lasts — never the most expensive one.',
        services: [
          { title: 'AC repair & replacement', description: 'Same-day diagnosis, flat-rate quote, and most repairs done in one visit in Brookfield + Hillcrest.', icon: 'wrench', benefit: 'Cool house by tonight' },
          { title: 'Furnace & heat pump service', description: 'Diagnostic + repair or full system swap with a 10-year warranty on parts.', icon: 'tool', benefit: 'Warm rooms before sundown' },
          { title: 'Tune-ups & maintenance plans', description: '$89 precision tune-ups that catch failures before they cost you a $4K weekend.', icon: 'shield', benefit: 'Cut bills 12–18%' },
          { title: 'Indoor air quality', description: 'Whole-home filtration, UV, and humidity systems for allergy-prone homes in Westgate.', icon: 'search', benefit: 'Cleaner air in 1 visit' },
          { title: 'Ductless mini-splits', description: 'Ductless mini-split design + install for additions, sunrooms, and converted garages in Greenview — per-room comfort, no ducts.', icon: 'tool', benefit: 'Per-room comfort' },
          { title: 'Ductwork & airflow balancing', description: 'Sealed, balanced ductwork that fixes the rooms in Park Ridge that never get warm or cool enough.', icon: 'wrench', benefit: 'Even temps in every room' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 740+ neighbors picked NorthAir',
        heading: 'Tired of HVAC sticker-shock and mystery quotes?',
        subheading: 'Vague hourly rates, "while we are here" upsells, and 4-day waits for AC repair end here.',
        items: [
          { title: 'Free in-home diagnostic', description: 'No $99 trip fee, no "we will email you a quote." We diagnose, scope, and price on the spot.' },
          { title: 'Flat install pricing', description: 'You see total install pricing before any equipment is ordered. No drywall surprises, ever.' },
          { title: 'Drop cloths + booties', description: 'We protect floors and vacuum every workspace. The only thing we leave is colder air.' },
          { title: '10-year parts warranty', description: 'Every install carries a 10-year parts + 2-year labor warranty backed locally — not a 1-800 line.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every visit — included',
        heading: 'What your free in-home estimate actually includes',
        subheading: 'Most contractors charge $89–$129 for diagnostics. We do not. Here is what shows up at your door.',
        items: [
          'Free arrival window in Brookfield, Hillcrest, Westgate, Park Ridge + Greenview',
          'Full system inspection (indoor + outdoor unit)',
          'Refrigerant + airflow + electrical diagnostics',
          'Written, flat-rate quote before any work',
          'Repair vs replace recommendation in plain English',
          '10-year parts / 2-year labor warranty on installs',
          'Manufacturer rebates + 0% financing options',
          'Tidy walkthrough + photo report when complete',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Stop sweating. Start scheduling.',
        headline: 'Your free in-home estimate is one call away.',
        subheadline: 'Tell us what is going on and we lock in a same-day or next-day slot in Brookfield, Hillcrest or Westgate.',
        ctaLabel: 'Book my free estimate', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 740+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Brookfield, Hillcrest, and Westgate.',
        testimonials: [
          { quote: 'AC died on the hottest day of July in Hillcrest. NorthAir had a NATE tech here in 90 minutes and a new condenser coil in by 4 PM. House was 72°F that night.', highlight: 'house was 72°F that night', rating: 5, name: 'Sandra K.', title: 'Hillcrest homeowner' },
          { quote: 'Got three quotes for a furnace replacement in Brookfield — NorthAir was $1,200 less than the next, with a longer warranty and zero hidden fees.', highlight: '$1,200 less', rating: 5, name: 'Marcus W.', title: 'Brookfield homeowner' },
          { quote: 'Their $89 tune-up caught a cracked heat exchanger I had no idea about. Probably saved my family from CO. Honest, careful, and on time every visit.', highlight: 'honest, careful, and on time', rating: 5, name: 'Priya N.', title: 'Westgate maintenance plan member' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent installs in your neighborhood',
        subheading: 'Snapshots from Brookfield, Hillcrest, and Westgate — what tidy work actually looks like.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'High-efficiency 3-ton condenser install in Brookfield — labeled disconnect, level pad.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'New gas furnace + smart thermostat in Hillcrest — clean basement utility room.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Whole-home air purifier + duct seal in Westgate — verified airflow report.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From hot house to cold air in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us what is going on', description: 'Submit the form or call. A real human in our Brookfield office picks up in under 90 seconds.' },
          { title: '2. We schedule same-day', description: 'Confirmed in writing within 15 minutes — with the tech name, ETA, and what to expect.' },
          { title: '3. Free diagnostic + quote', description: 'Drop cloths down, full system inspection, and a flat-rate quote you approve before anything is replaced.' },
          { title: '4. We fix or install + clean up', description: 'Repair done same day where possible, photo report, full cleanup, and the warranty paperwork emailed.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'HVAC questions, answered straight',
        items: [
          { question: 'How fast can you actually get out here?', answer: 'On 88% of emergency calls in Brookfield, Hillcrest, and Westgate we are on-site within 4 hours — same-day on every weekday call before 2 PM.' },
          { question: 'Are estimates really free?', answer: 'Yes — in-home estimates for replacements and major repairs are $0, no trip charge, no obligation. We send a written flat-rate quote before any work.' },
          { question: 'Are your techs certified?', answer: 'Every tech is NATE-certified, EPA 608 universal, and goes through annual factory training. We send credentials with every quote.' },
          { question: 'Do you finance new systems?', answer: '0% APR for 18 months and longer-term plans through GreenSky. We disclose all rates and fees up-front.' },
          { question: 'What is your install warranty?', answer: '10 years on parts, 2 years on labor — backed locally, not by a 1-800 number. If a part fails in that window, we replace it free.' },
          { question: 'What neighborhoods do you serve?', answer: 'Brookfield, Hillcrest, Westgate, Park Ridge, Greenview, plus 35+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-day coverage for these communities — and 35+ surrounding neighborhoods.',
        areas: ['Brookfield','Hillcrest','Westgate','Park Ridge','Greenview','Hawthorne','Birchwood','Stonebrook','Fairview','Lakemont','East Hills','Sunrise Acres','Pine Crest','Maple Grove','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 10/2 Promise',
        headline: 'If your new system fails — we make it right, free.',
        description: 'Every install carries a 10-year parts + 2-year labor warranty in writing. If anything we installed fails in that window, we come back same day at zero cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free in-home HVAC estimate',
        subheading: 'Tell us what is going on and we reply fast with availability, options, and a flat-rate quote you can approve before we start.',
        ctaLabel: 'Request my free estimate',
        urgency: 'Same-day slots in Brookfield & Hillcrest fill quickly during summer — book early',
        nextSteps: ['Share a few details','We confirm timing + flat price','We diagnose, fix, and clean up'],
        guarantee: 'Free estimates • 10-year parts warranty • NATE-certified',
        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'NATE-certified, locally owned, and trusted by 740+ metro homeowners since 2010.',
        phone: PHONE, email: 'help@northairhvac.example',
        address: '1842 Brookfield Pkwy, [City] Metro, 90612',
        hours: 'Open 24/7 for emergencies',
        licenseLine: 'License #HV-29841 • EPA 608 Universal • Fully insured',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-hvac-hero-01',
    differentiatorImage: 'demo-hvac-differentiator-01',
    checklistImage: 'demo-hvac-checklist-01',
    galleryImage1: 'demo-hvac-gallery-01',
    galleryImage2: 'demo-hvac-gallery-02',
    galleryImage3: 'demo-hvac-gallery-03',
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
    heroImageId: 'real photo HVAC technician installing residential air conditioner outdoor unit',
    differentiatorImage: 'real photo professional HVAC tech smiling with toolbox at customer home',
    checklistImage: 'real photo HVAC technician inspecting furnace clean basement utility room',
    galleryImage1: 'real photo new high efficiency AC condenser installation level pad',
    galleryImage2: 'real photo gas furnace replacement clean basement labeled wires',
    galleryImage3: 'real photo whole home air purifier indoor air quality install',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'systemType', type: 'select', label: 'Which system?', placeholder: 'Select system', required: false, options: ['AC / cooling','Furnace / heating','Heat pump','Tune-up / maintenance','Indoor air quality','New install'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: heating, cooling, or maintenance? (Include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'HVAC Lead Gen',
    description: 'High-converting lead-gen page for HVAC contractors — same-day repair, free estimates, 10-year warranty.',
    tags: ['hvac','heating','cooling','air-conditioning','local-services','home-services','lead-gen'],
  },
};

export default spec;
