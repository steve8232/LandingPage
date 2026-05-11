/**
 * v1-roofing
 *
 * High-Converting Local Service blueprint for residential roofing contractors.
 */

import { TemplateSpec } from './schema';

const BRAND = 'Summit Peak Roofing';
const PHONE = '(555) 837-2200';

const spec: TemplateSpec = {
  templateId: 'v1-roofing',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'roofing',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🏠 Free Roof Inspections • Storm Damage Specialists • Lifetime Workmanship Warranty', phone: PHONE, hours: 'Open now • 24/7 storm response' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Book Free Inspection', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'GAF Master Elite • Insurance-claim experts • Serving Cedar Heights, Stonebridge & 40+ neighborhoods',
        headline: 'A roof that survives the next storm. Quoted free, today.',
        subheadline: 'Stop letting a sketchy "we were in the area" roofer talk you into work you do not need. Our team climbs your roof, photographs every issue, and writes a transparent quote — same day.',
        bullets: ['Free 30-point roof inspection with photo report — no obligation','Insurance-claim help: we handle the adjuster meeting in Stonebridge','Lifetime workmanship + 50-year material warranty in writing'],
        proofPoints: ['4.9★ • 580+ reviews','GAF Master Elite','Lifetime warranty'],
        ctaLabel: 'Book my free roof inspection',
        formHeading: 'Tell us about your roof',
        formSubheading: 'A real estimator replies within 15 minutes during business hours.',
        trustBadge: '✓ Free inspections. No high-pressure sales. Most homeowners get a quote in 24 hours.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 583 reviews', icon: 'star' },
      { label: 'GAF Master Elite', detail: 'top 3% of US roofers', icon: 'shield' },
      { label: '18+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Free inspections', detail: '24/7 storm response', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited since 2010', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Roofing work — done once, done right',
        subheading: 'A real estimator climbs the roof, documents every issue with photos, and writes a fixed quote you can take to your insurance carrier.',
        services: [
          { title: 'Storm & hail damage', description: 'Free 30-point inspection plus full insurance-claim support — we meet your adjuster on-site in Cedar Heights.', icon: 'wrench', benefit: 'Claim approved or no charge' },
          { title: 'Full roof replacement', description: 'GAF Timberline HDZ or premium architectural shingles installed in 1–2 days, lifetime workmanship warranty.', icon: 'tool', benefit: 'New roof, peace of mind' },
          { title: 'Repairs & leaks', description: 'Same-day leak stops, missing shingle replacements, and flashing repairs across Stonebridge and Hilltop.', icon: 'shield', benefit: 'Dry attic by tonight' },
          { title: 'Gutters & soffit', description: 'Seamless aluminum gutters, leaf guards, and rotted fascia repair bundled with re-roofs at a discount.', icon: 'search', benefit: 'No more clogs or drips' },
          { title: 'Attic ventilation & insulation', description: 'Ridge vents, baffles, and R-49 attic insulation bundled with re-roofs in Stonebridge — bills drop within a billing cycle.', icon: 'shield', benefit: 'Cooler attic, lower bills' },
          { title: 'Skylights & flashing', description: 'Velux skylight installs and step/counter-flashing repairs across Hilltop — no more chimney leaks, no more dark hallways.', icon: 'tool', benefit: 'Daylight, no leaks' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 580+ neighbors picked Summit Peak',
        heading: 'Tired of door-knockers, vague quotes, and storm-chasers?',
        subheading: '"We were in the area" sales pitches, missing permits, and crews that disappear after the deposit end here.',
        items: [
          { title: 'GAF Master Elite certified', description: 'Top 3% of US roofers — annual factory training, written warranties backed by GAF, not just us.' },
          { title: 'Photo report on every inspection', description: 'No more "trust me, you need a new roof." We send a 30-photo report you can keep, with or without a quote.' },
          { title: 'Insurance-claim experts', description: 'We meet your adjuster on-site, document the damage, and have a 92% claim approval rate in the metro.' },
          { title: 'Same crew, start to finish', description: 'In-house roofing crews — no day labor, no subcontractor mystery. Foreman on-site every day.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every inspection — included',
        heading: 'What your free roof inspection actually covers',
        subheading: 'Most "free inspections" are 5-minute drive-bys. Here is what shows up at your Cedar Heights, Stonebridge, or Hilltop home.',
        items: [
          'Free arrival window in Cedar Heights, Stonebridge, Hilltop, Pinegrove + Riverside Hills',
          'Full 30-point roof inspection (shingles, flashing, vents, decking)',
          'Attic inspection for active or hidden leaks',
          'Drone photo report of every slope',
          'Insurance-claim consultation (no obligation)',
          'Written, itemized quote with material grades + colors',
          'Lifetime workmanship + 50-year material warranty',
          'Tear-off, haul-away, and full magnet-sweep cleanup',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Storm damage? Old roof? Unsure?',
        headline: 'Find out for free in 24 hours.',
        subheadline: 'Tell us your address and we book a same-week inspection slot in Cedar Heights, Stonebridge or Hilltop — written quote, no obligation.',
        ctaLabel: 'Book my free inspection', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 580+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Cedar Heights, Stonebridge, and Hilltop.',
        testimonials: [
          { quote: 'Hailstorm hit Cedar Heights in May — Summit Peak met my insurance adjuster and got my full roof approved at $18,400. Five other roofers said the damage was "not enough."', highlight: '$18,400 claim approved', rating: 5, name: 'Marcus T.', title: 'Cedar Heights homeowner' },
          { quote: 'Replaced our 22-year-old roof in Stonebridge in a single day, magnet-swept the lawn three times. My toddler walks barefoot — zero nails missed.', highlight: 'zero nails missed', rating: 5, name: 'Jennifer L.', title: 'Stonebridge homeowner' },
          { quote: 'A "discount roofer" wanted $4K to repair our leak in Hilltop. Summit Peak found the real cause — vent flashing — and fixed it for $480 with a 5-year warranty.', highlight: 'fixed it for $480', rating: 5, name: 'Eric N.', title: 'Hilltop homeowner' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent roofs in your neighborhood',
        subheading: 'Snapshots from Cedar Heights, Stonebridge, and Hilltop — what a tidy install actually looks like.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'GAF Timberline HDZ replacement in Cedar Heights — 1-day install, magnet-swept.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Storm-damage repair in Stonebridge — claim documented, slope re-decked.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Seamless gutter + leaf-guard install in Hilltop — color-matched fascia.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From storm to new roof in 4 steps',
        subheading: 'No sales-pressure visits, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us your address', description: 'Submit the form or call. A real human in our Stonebridge office picks up in under 90 seconds.' },
          { title: '2. We schedule a free inspection', description: 'Confirmed in writing within 15 minutes — with the estimator name, ETA, and what to expect.' },
          { title: '3. 30-point inspection + photo report', description: 'Estimator climbs the roof, photographs every slope, and writes a transparent quote you can take to insurance.' },
          { title: '4. Install + lifetime warranty', description: '1–2 day install, magnet sweep, photo walkthrough, and the warranty paperwork emailed.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Roofing questions, answered straight',
        items: [
          { question: 'How fast can you actually get out for an inspection?', answer: 'In Cedar Heights, Stonebridge, and Hilltop we book most free inspections within 48 hours — same-day on storm-damage emergencies.' },
          { question: 'Are inspections really free?', answer: 'Yes — no trip fee, no obligation. We send a 30-photo report you can keep whether you hire us or not.' },
          { question: 'Do you handle insurance claims?', answer: 'Absolutely. We meet your adjuster on-site, document the damage, and have a 92% claim approval rate in the metro.' },
          { question: 'How long does a re-roof take?', answer: 'Most single-family re-roofs in Cedar Heights and Stonebridge are done in 1–2 days, including tear-off, decking inspection, and magnet sweep.' },
          { question: 'What is your warranty?', answer: 'Lifetime workmanship from us, plus a 50-year non-prorated material warranty from GAF. Both in writing, both transferable.' },
          { question: 'What neighborhoods do you serve?', answer: 'Cedar Heights, Stonebridge, Hilltop, Pinegrove, Riverside Hills, plus 35+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-week coverage for these communities — and 35+ surrounding neighborhoods.',
        areas: ['Cedar Heights','Stonebridge','Hilltop','Pinegrove','Riverside Hills','Westbrook','Northshore','Eastpoint','Birchwood','Maple Lake','Foxglen','Stoneview','Whitfield','Hazelwood','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our Lifetime Workmanship Promise',
        headline: 'If our install fails — we make it right, free, forever.',
        description: 'Every re-roof carries a lifetime workmanship warranty plus a 50-year GAF material warranty. If anything we installed fails, we come back at zero cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free roof inspection + photo report',
        subheading: 'Tell us your address and we book a same-week inspection slot, document everything with photos, and write a transparent quote.',
        ctaLabel: 'Request my free inspection',
        urgency: 'Storm-season inspection slots in Cedar Heights & Stonebridge fill quickly — book early',
        nextSteps: ['Share a few details','We confirm timing + send a photo report','We install, magnet-sweep, and warranty it for life'],
        guarantee: 'Free inspections • Lifetime workmanship • GAF Master Elite',
        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'GAF Master Elite, locally owned, and trusted by 580+ metro homeowners since 2007.',
        phone: PHONE, email: 'help@summitpeakroofing.example',
        address: '925 Cedar Heights Dr, [City] Metro, 90623',
        hours: 'Mon–Sat 7am–7pm • 24/7 storm response',
        licenseLine: 'License #RC-29481 • $2M insured • GAF Master Elite #1842',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-roofing-hero-01',
    differentiatorImage: 'demo-roofing-differentiator-01',
    checklistImage: 'demo-roofing-checklist-01',
    galleryImage1: 'demo-roofing-gallery-01',
    galleryImage2: 'demo-roofing-gallery-02',
    galleryImage3: 'demo-roofing-gallery-03',
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
    heroImageId: 'real photo professional roofer installing architectural shingles residential home',
    differentiatorImage: 'real photo roofing crew foreman with clipboard inspecting roof',
    checklistImage: 'real photo roofer inspecting attic with flashlight pointing at decking',
    galleryImage1: 'real photo new GAF Timberline architectural shingle roof installation',
    galleryImage2: 'real photo storm damage hail roof inspection insurance adjuster',
    galleryImage3: 'real photo seamless aluminum gutter installation residential home',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'projectType', type: 'select', label: 'What is the project?', placeholder: 'Select project type', required: false, options: ['Leak / repair','Storm damage','Full replacement','Inspection','Gutters','Skylight'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the photo report)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: leak, storm damage, or full re-roof? (Include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'Roofing Lead Gen',
    description: 'High-converting lead-gen page for residential roofers — free inspections, insurance-claim support, lifetime warranty.',
    tags: ['roofing','roof-replacement','storm-damage','insurance-claim','local-services','home-services','lead-gen'],
  },
};

export default spec;
