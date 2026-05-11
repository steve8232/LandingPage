/**
 * v1-pressure-washing
 *
 * High-Converting Local Service blueprint for pressure / soft-wash exterior cleaners.
 */

import { TemplateSpec } from './schema';

const BRAND = 'CleanSlate Soft Wash';
const PHONE = '(555) 712-4400';

const spec: TemplateSpec = {
  templateId: 'v1-pressure-washing',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'pressure-washing',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '💦 Free Online Quotes • Soft-Wash Safe for Roofs + Siding • 8+ Years Local', phone: PHONE, hours: 'Mon–Sat 7am–7pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Soft-wash certified • SH-safe formulas • Serving Lakemont, Aspen Bluff & 25+ neighborhoods',
        headline: 'Make your house look new again — by lunch on Saturday.',
        subheadline: 'Stop renting a $79 pressure washer that ruins your siding. Our soft-wash kills mold and algae at the root, lasts 4× longer than power washing, and never blasts paint off your trim.',
        bullets: ['Free no-contact quote in 24 hours from a Google Earth measure','Soft-wash kills mold + algae for 12+ months — not a quick rinse','100% satisfaction guarantee or we re-clean it free'],
        proofPoints: ['4.9★ • 320+ reviews','Soft-wash certified','12-month results'],
        ctaLabel: 'Get my free wash quote',
        formHeading: 'Tell us what needs cleaning',
        formSubheading: 'A real estimator replies within 1 hour during business hours.',
        trustBadge: '✓ Free quotes via address. No obligation. Most jobs scheduled within the week.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 322 reviews', icon: 'star' },
      { label: 'Soft-wash certified', detail: 'SoftWash Systems trained', icon: 'shield' },
      { label: '8+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Free online quotes', detail: '24-hour turnaround', icon: 'clock' },
      { label: 'BBB A+', detail: 'fully insured $2M', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we wash, brighten, and protect',
        subheading: 'A trained tech matches the right method (soft-wash, hot-water, surface-clean) to each surface — no one-size-fits-all blasting.',
        services: [
          { title: 'House soft-wash', description: 'Vinyl, brick, stucco, and Hardie siding washed in Lakemont with SH-safe formula — 12-month algae-free guarantee.', icon: 'wrench', benefit: 'Like-new house in 3 hours' },
          { title: 'Roof soft-wash', description: 'Black streaks (Gloeocapsa magma) gone in one visit, with zero high-pressure damage to shingles in Aspen Bluff.', icon: 'tool', benefit: 'No more black streaks' },
          { title: 'Driveways & concrete', description: 'Surface-clean rotary on driveways, walkways, and pool decks — oil and rust spots treated separately.', icon: 'shield', benefit: 'Looks freshly poured' },
          { title: 'Decks, fences, patios', description: 'Wood-safe soft-wash plus optional stain/seal upgrade for cedar and pressure-treated decks across Brookhaven.', icon: 'search', benefit: '2× longer wood life' },
          { title: 'Commercial & HOA wash', description: 'Strip-mall sidewalks, dumpster pads, drive-thru lanes, and HOA common areas in Lakemont — after-hours scheduling.', icon: 'tool', benefit: 'Pristine for opening hours' },
          { title: 'Gutter brightening', description: 'Tiger-stripe streaks scrubbed off seamless gutters across Aspen Bluff — paired with a full house wash for a uniform finish.', icon: 'search', benefit: 'No more dirty gutter lines' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 320+ neighbors picked CleanSlate',
        heading: 'Tired of "pressure washers" who blast paint off your house?',
        subheading: 'Stripped paint, water in your soffit, and "results" that come back in 3 weeks end here. Real soft-wash kills mold at the root.',
        items: [
          { title: 'Soft-wash, not high-pressure', description: 'Roofs and siding washed at <500 PSI with biodegradable SH solution — kills algae for 12+ months, never strips paint.' },
          { title: 'No-contact online quotes', description: 'Send your address; we measure with Google Earth and email a fixed quote in 24 hours. No high-pressure sales visit.' },
          { title: 'Trained, in-house techs', description: 'SoftWash Systems Certified, in uniform, fully insured. Same crew every time — no day labor with rented gear.' },
          { title: '100% re-clean guarantee', description: 'If a stain comes back inside 30 days or a spot was missed, we re-clean it free. No questions, no fine print.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every wash — included',
        heading: 'What your free quote actually covers',
        subheading: 'Every flat-rate quote we send to Lakemont, Aspen Bluff, and Brookhaven includes the work below — no surprise add-ons.',
        items: [
          'Free 24-hour online quote in Lakemont, Aspen Bluff, Brookhaven, Westview + Maple Grove',
          'Soft-wash siding rinse + spot-treat',
          '12-month algae-free guarantee on house wash',
          'Plant + landscape protection with pre-rinse',
          'Eaves, downspouts, and shutters included',
          'Driveway pre-treat for oil/rust spots',
          'Photo before/after report on every job',
          '100% re-clean satisfaction guarantee',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Stop scrubbing. Start enjoying.',
        headline: 'Your free wash quote is one address away.',
        subheadline: 'Send your address and we measure with Google Earth and email a flat-rate quote within 24 hours — no in-home visit needed.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 320+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Lakemont, Aspen Bluff, and Brookhaven.',
        testimonials: [
          { quote: 'Soft-washed our 4,200 sqft Lakemont house in 3 hours — black streaks on the roof, mildew on siding, all gone. 14 months later still clean. Worth twice what they charged.', highlight: '14 months later still clean', rating: 5, name: 'Brian H.', title: 'Lakemont homeowner' },
          { quote: 'Other "pressure washers" in Aspen Bluff stripped my neighbor\'s paint. CleanSlate uses real soft-wash with the right chemistry. House looks 5 years newer.', highlight: 'house looks 5 years newer', rating: 5, name: 'Margie F.', title: 'Aspen Bluff homeowner' },
          { quote: 'Brookhaven driveway had oil spots and 2 years of grime — surface-clean rotary plus pre-treat got 95% of it out. Zero damage to the concrete. Friendly tech too.', highlight: 'zero damage to concrete', rating: 5, name: 'James O.', title: 'Brookhaven homeowner' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Before & afters in your neighborhood',
        subheading: 'Snapshots from Lakemont, Aspen Bluff, and Brookhaven — the difference is the soft-wash chemistry.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Soft-wash house + roof in Lakemont — 12-month algae-free guarantee.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Black-streak roof clean in Aspen Bluff — zero high-pressure damage.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Driveway surface-clean + oil pre-treat in Brookhaven — like new concrete.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From dirty exterior to magazine-ready in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Send your address', description: 'Submit the form. We measure with Google Earth and confirm details by email or text.' },
          { title: '2. Free 24-hour quote', description: 'Flat-rate quote in your inbox within 24 hours. No high-pressure sales visit, no obligation.' },
          { title: '3. Schedule + we show up', description: 'Same-week slot, uniformed tech in marked truck. Plants pre-rinsed, neighbors warned.' },
          { title: '4. We wash + photo report', description: 'Soft-wash applied, surfaces rinsed, before/after photos sent. 30-day re-clean guarantee.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Pressure washing questions, answered straight',
        items: [
          { question: 'Will high pressure damage my siding?', answer: 'Real soft-wash uses <500 PSI plus algae-killing solution — same effect as 4,000 PSI but zero risk to vinyl, paint, or shingles.' },
          { question: 'Are quotes really free?', answer: 'Yes — send your address and we measure with Google Earth. Flat-rate quote in your inbox within 24 hours, no obligation.' },
          { question: 'How long do results last?', answer: 'Soft-wash kills mold and algae at the root, so house washes in Lakemont and Aspen Bluff stay clean 12–18 months — 4× longer than power washing.' },
          { question: 'What about my plants?', answer: 'We pre-rinse all landscaping, tarp delicate beds, and post-rinse after the wash. Zero plant damage in 8 years.' },
          { question: 'What is your guarantee?', answer: 'If a stain comes back or a spot is missed inside 30 days, we re-clean it free. No questions, no fine print.' },
          { question: 'What neighborhoods do you serve?', answer: 'Lakemont, Aspen Bluff, Brookhaven, Westview, Maple Grove, plus 20+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-week coverage for these communities — and 20+ surrounding neighborhoods.',
        areas: ['Lakemont','Aspen Bluff','Brookhaven','Westview','Maple Grove','Hilltop','Stoneview','Cedar Hollow','Northridge','Sunnyside','Hawthorne','Birch Park','Foxhill','Greenview','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 30-Day Re-Clean Promise',
        headline: 'If a spot comes back — we re-clean it, free.',
        description: 'Every wash carries a 30-day re-clean guarantee plus a 12-month algae-free guarantee on house washes. If anything is missed or comes back, we return at zero cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free wash quote in 24 hours',
        subheading: 'Send your address and we measure with Google Earth and email a flat-rate quote — no in-home visit needed.',
        ctaLabel: 'Request my free quote',
        urgency: 'Spring/summer slots in Lakemont & Aspen Bluff fill quickly — book early',
        nextSteps: ['Send your address','We measure + email a flat-rate quote','We wash + send before/after photos'],
        guarantee: 'Free quotes • 12-month algae-free • 30-day re-clean',
        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Soft-wash certified, locally owned, and trusted by 320+ metro homeowners since 2017.',
        phone: PHONE, email: 'help@cleanslatewash.example',
        address: '614 Lakemont Rd, [City] Metro, 90329',
        hours: 'Mon–Sat 7am–7pm',
        licenseLine: 'Licensed & insured $2M • SoftWash Systems Certified #4821',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-pressure-washing-hero-01',
    differentiatorImage: 'demo-pressure-washing-differentiator-01',
    checklistImage: 'demo-pressure-washing-checklist-01',
    galleryImage1: 'demo-pressure-washing-gallery-01',
    galleryImage2: 'demo-pressure-washing-gallery-02',
    galleryImage3: 'demo-pressure-washing-gallery-03',
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
    heroImageId: 'real photo professional soft wash technician cleaning vinyl siding house exterior',
    differentiatorImage: 'real photo pressure washer surface cleaner concrete driveway clean line',
    checklistImage: 'real photo soft wash house exterior before after mold algae removal',
    galleryImage1: 'real photo soft wash vinyl siding house clean before after',
    galleryImage2: 'real photo roof black streak removal soft wash before after',
    galleryImage3: 'real photo driveway surface cleaning rotary tool clean concrete',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'surfaceType', type: 'select', label: 'What surface?', placeholder: 'Select surface', required: false, options: ['House siding','Driveway / concrete','Deck / patio','Roof (soft wash)','Fence','Commercial / HOA'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: house, roof, driveway? (Include full address for Google Earth measure)', required: false },
  ],

  metadata: {
    name: 'Pressure Washing Lead Gen',
    description: 'High-converting lead-gen page for pressure / soft-wash exterior cleaners — free online quotes, soft-wash certified, 30-day re-clean guarantee.',
    tags: ['pressure-washing','soft-wash','house-washing','roof-cleaning','local-services','home-services','lead-gen'],
  },
};

export default spec;
