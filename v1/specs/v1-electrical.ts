/**
 * v1-electrical
 *
 * High-Converting Local Service blueprint for residential electricians.
 */

import { TemplateSpec } from './schema';

const BRAND = 'Bright Circuit Electric';
const PHONE = '(555) 226-3380';

const spec: TemplateSpec = {
  templateId: 'v1-electrical',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'electrical',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '⚡ Same-Day Service • Licensed Master Electrician • 18+ Years in the Metro', phone: PHONE, hours: 'Open now • 24/7 emergency calls' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Master electrician owned • Code-compliant work • Serving Highland Park, Crestwood & 30+ neighborhoods',
        headline: 'Power back on. Panel up to code. No surprises.',
        subheadline: 'Stop chasing electricians who promise Tuesday and show up next month. We arrive same-day, pull permits ourselves, and back every install with a 5-year written workmanship warranty.',
        bullets: ['Same-day service for outages, breakers, and dead outlets in Highland Park','Flat-rate quotes in writing — never billed by the hour','Code-compliant work + city inspection passed first try, every time'],
        proofPoints: ['4.9★ • 480+ reviews','Master licensed','5-year warranty'],
        ctaLabel: 'Get my free electrical quote',
        formHeading: 'Tell us what is going on',
        formSubheading: 'A real electrician replies within 15 minutes during business hours.',
        trustBadge: '✓ Free quotes. Permit pulls included. Most quotes returned in under 30 minutes.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 482 reviews', icon: 'star' },
      { label: 'Master licensed', detail: '#EL-31827 • $2M insured', icon: 'shield' },
      { label: '18+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Same-day service', detail: 'Mon–Sat in Crestwood', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited since 2009', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we wire, fix, and bring up to code',
        subheading: 'A licensed master electrician scopes the job and writes a flat-rate quote — never an open hourly meter.',
        services: [
          { title: 'Panel upgrades & rewires', description: 'Old fuse box or 100A overworked panel? We swap to 200A with permits and inspection in 1 day.', icon: 'wrench', benefit: 'Pass inspection first try' },
          { title: 'Outlets, switches & fixtures', description: 'Dead outlets, flickering lights, and ceiling fans installed clean and code-compliant in Crestwood homes.', icon: 'tool', benefit: 'Lights on tonight' },
          { title: 'EV charger installation', description: 'Tesla, ChargePoint, and JuiceBox installs with load calc, permit, and rebate paperwork done for you.', icon: 'shield', benefit: 'Charge at home in days' },
          { title: 'Whole-home surge & generators', description: 'Whole-home surge protectors and standby generator installs for storm-prone Highland Park.', icon: 'search', benefit: 'Power through any outage' },
          { title: 'Lighting design & install', description: 'Recessed cans, under-cabinet LED, and outdoor landscape lighting designed and installed in 1–2 days across Crestwood.', icon: 'search', benefit: 'Brighter, smarter rooms' },
          { title: 'Smart home & low-voltage', description: 'Smart switches, video doorbells, and structured Cat6 wiring — clean install, fully labeled, in Highland Park.', icon: 'tool', benefit: 'Set it once, works for years' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 480+ neighbors picked Bright Circuit',
        heading: 'Tired of "electricians" who guess and bill by the hour?',
        subheading: 'Open hourly meters, missed permits, and inspections that fail twice end here. Here is how we work in Highland Park and Crestwood.',
        items: [
          { title: 'Master electrician on every job', description: 'No first-year apprentices unsupervised. A licensed master signs off on every wire and every quote.' },
          { title: 'Permits pulled, not skipped', description: 'We handle the permit paperwork and the city inspection appointment so you never have to.' },
          { title: 'Flat-rate, never hourly', description: 'You see the all-in price before any breakers come off. No "we found another issue" upcharges.' },
          { title: '5-year written warranty', description: 'Every install backed by a 5-year workmanship warranty. If a wire we touched fails, we come back free.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every visit — included',
        heading: 'What your free electrical quote actually covers',
        subheading: 'Most electricians charge $89–$149 for a "diagnosis call." We do not. Here is what shows up at your door.',
        items: [
          'Free arrival window in Highland Park, Crestwood, Riverbend, Eastview + Park Heights',
          'Master electrician on-site (not an apprentice)',
          'Full panel + circuit diagnostic',
          'Written, flat-rate quote before any work',
          'Permit pulled + inspection scheduled by us',
          '5-year written workmanship warranty',
          'Photo report + circuit-labeling on every install',
          'Code-compliant work — pass inspection first try',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Stop guessing. Start lighting up.',
        headline: 'Your free electrical quote is one call away.',
        subheadline: 'Tell us what is going on and we lock in a same-day or next-day slot in Highland Park, Crestwood or Riverbend.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 480+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Highland Park and Crestwood.',
        testimonials: [
          { quote: 'Half my house lost power on a Sunday in Highland Park — Bright Circuit had a master electrician in my basement by 9 AM Monday with a $0 diagnostic. Power back by lunch.', highlight: 'power back by lunch', rating: 5, name: 'Diana C.', title: 'Highland Park homeowner' , avatarAsset: 'testimonialAvatar1', fallbackAsset: 'fallbackTestimonialAvatar1' },
          { quote: 'Got 4 quotes for a 200A panel upgrade in Crestwood. Bright Circuit was the only one who handled the permit and passed inspection on the first try. $400 less, too.', highlight: 'passed inspection first try', rating: 5, name: 'Ravi P.', title: 'Crestwood homeowner' , avatarAsset: 'testimonialAvatar2', fallbackAsset: 'fallbackTestimonialAvatar2' },
          { quote: 'Tesla charger install in Riverbend — clean, labeled, and rebate paperwork done for me. Other electricians wanted $1,800; Bright Circuit was $1,150 with a 5-year warranty.', highlight: '5-year warranty', rating: 5, name: 'Kelly M.', title: 'Riverbend EV owner' , avatarAsset: 'testimonialAvatar3', fallbackAsset: 'fallbackTestimonialAvatar3' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent jobs in your neighborhood',
        subheading: 'Snapshots from Highland Park, Crestwood, and Riverbend — labeled, code-compliant, tidy.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: '200A panel upgrade in Highland Park — every breaker labeled, permit on file.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Tesla wall charger install in Crestwood — neat conduit, balanced load.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Whole-home surge + GFI refresh in Riverbend — passed inspection first try.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From dead outlet to inspection-passed in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us what is going on', description: 'Submit the form or call. A real human in our Crestwood office picks up in under 90 seconds.' },
          { title: '2. We schedule same-day', description: 'Confirmed in writing within 15 minutes — with the master electrician name, ETA, and what to expect.' },
          { title: '3. Free flat-rate quote', description: 'Master electrician on-site, full diagnostic, and a written all-in price you approve before any work.' },
          { title: '4. We wire, label, and pass inspection', description: 'Permit pulled, work done, every breaker labeled, photo report — and city inspection scheduled for you.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Electrical questions, answered straight',
        items: [
          { question: 'How fast can you actually get out here?', answer: 'On 86% of calls in Highland Park, Crestwood, and Riverbend we are on-site within 4 hours — same-day on every weekday call before 2 PM.' },
          { question: 'Are quotes really free?', answer: 'Yes — in-home quotes for panel work, EV chargers, and major repairs are $0, no trip charge, no obligation. Written flat-rate, every time.' },
          { question: 'Are you really licensed?', answer: 'Master electrician license #EL-31827, $2M general liability, and workers-comp on every employee. We send credentials with every quote.' },
          { question: 'Do you pull permits?', answer: 'Always. We pull the permit, schedule the city inspection, and meet the inspector for you on every panel, EV, and generator install.' },
          { question: 'What is your install warranty?', answer: '5 years on workmanship — backed locally, not by a 1-800 number. If a wire we touched fails in that window, we come back free.' },
          { question: 'What neighborhoods do you serve?', answer: 'Highland Park, Crestwood, Riverbend, Eastview, Park Heights, plus 25+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-day coverage for these communities — and 25+ surrounding neighborhoods.',
        areas: ['Highland Park','Crestwood','Riverbend','Eastview','Park Heights','Woodland','Stoneridge','Northgate','Southfield','Glenwood','Cedar Hills','Birch Hollow','Maple Ridge','Sunnybrook','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 5-Year Promise',
        headline: 'If a wire we touched fails — we make it right, free.',
        description: 'Every job carries a 5-year written workmanship warranty. If anything we installed fails inside that window, we come back same-day at zero cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free electrical quote',
        subheading: 'Tell us what is going on and we reply fast with availability, options, and a flat-rate quote you can approve before we start.',
        ctaLabel: 'Request my free quote',
        urgency: 'Same-day slots in Highland Park & Crestwood fill quickly — book early',
        nextSteps: ['Share a few details','We confirm timing + flat price','We wire it, label it, and pass inspection'],
        guarantee: 'Free quotes • 5-year warranty • Master licensed',
        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Master licensed, locally owned, and trusted by 480+ metro homeowners since 2007.',
        phone: PHONE, email: 'help@brightcircuit.example',
        address: '215 Highland Park Ave, [City] Metro, 90584',
        hours: 'Open 24/7 for emergencies',
        licenseLine: 'License #EL-31827 • $2M insured • Master electrician owned',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-electrical-hero-01',
    differentiatorImage: 'demo-electrical-differentiator-01',
    checklistImage: 'demo-electrical-checklist-01',
    galleryImage1: 'demo-electrical-gallery-01',
    galleryImage2: 'demo-electrical-gallery-02',
    galleryImage3: 'demo-electrical-gallery-03',
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    testimonialAvatar1: 'demo-electrical-avatar-01',
    testimonialAvatar2: 'demo-electrical-avatar-02',
    testimonialAvatar3: 'demo-electrical-avatar-03',
    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo licensed electrician installing residential 200 amp electrical panel',
    differentiatorImage: 'real photo professional electrician with toolbelt smiling at customer home',
    checklistImage: 'real photo electrician inspecting circuit breaker panel labeled wiring',
    galleryImage1: 'real photo new 200 amp electrical panel installation labeled breakers',
    galleryImage2: 'real photo Tesla wall charger EV install garage neat conduit',
    galleryImage3: 'real photo whole home surge protector GFI outlet install',
    testimonialAvatar1: 'real photo professional headshot of happy electrical customer, woman late 30s, warm friendly smile, residential setting',
    testimonialAvatar2: 'real photo professional headshot of satisfied electrical customer, man early 40s, casual confident, daylight',
    testimonialAvatar3: 'real photo warm portrait of mature electrical repeat customer, woman 50s, natural light, trustworthy expression',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'jobType', type: 'select', label: 'What kind of job?', placeholder: 'Select job type', required: false, options: ['Panel upgrade','EV charger','Outlets & switches','Lighting & fans','Whole-home rewire','Generator / surge','Troubleshooting'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: panel, outlets, EV charger? (Include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'Electrician Lead Gen',
    description: 'High-converting lead-gen page for residential electricians — same-day service, flat-rate quotes, 5-year warranty.',
    tags: ['electrician','electrical','panel-upgrade','ev-charger','local-services','home-services','lead-gen'],
  },
};

export default spec;
