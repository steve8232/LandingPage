/**
 * v1-carpet-cleaning
 *
 * High-Converting Local Service blueprint for carpet, upholstery, and tile cleaners.
 */

import { TemplateSpec } from './schema';

const BRAND = 'PureFiber Carpet Cleaning';
const PHONE = '(555) 488-7610';

const spec: TemplateSpec = {
  templateId: 'v1-carpet-cleaning',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'carpet-cleaning',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🛋️ Truck-Mounted Hot-Water Extraction • Dries in 4 Hours • Pet + Kid Safe', phone: PHONE, hours: 'Mon–Sat 7am–7pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Truck-mounted extraction • Dries in 4 hours • Serving Lakewood, Sunset Hills & 24+ neighborhoods',
        headline: 'Carpets that look — and smell — brand new by tonight.',
        subheadline: 'Stop renting a Rug Doctor that pushes dirt around. Truck-mounted hot-water extraction at 230°F lifts pet stains, ground-in dirt, and odors at the fiber level — and your carpets dry in 4 hours, not 4 days.',
        bullets: ['IICRC-certified techs and truck-mounted equipment, not rental boxes','Pet-safe, kid-safe formulas with deep-stain pre-treatment included','Dry in 4 hours or your next room is free'],
        proofPoints: ['4.9★ • 380+ reviews','IICRC-certified','4-hour dry time'],
        ctaLabel: 'Get my free carpet quote',
        formHeading: 'Tell us about your carpets',
        formSubheading: 'A real estimator replies within 1 hour during business hours.',
        trustBadge: '✓ Free quotes by phone or photo. No surprise upcharges. Pet stains included.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 384 reviews', icon: 'star' },
      { label: 'IICRC-certified', detail: 'master textile cleaner', icon: 'shield' },
      { label: '11+ years', detail: 'in the metro', icon: 'medal' },
      { label: '4-hour dry', detail: 'guaranteed', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited 2014', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we deep-clean (and how)',
        subheading: 'Truck-mounted hot-water extraction at 230°F — the only method recommended by every major carpet manufacturer.',
        services: [
          { title: 'Carpet hot-water extraction', description: 'Living rooms, bedrooms, and stairs in Lakewood — pre-treat, agitate, extract, deodorize. Dry in 4 hours.', icon: 'wrench', benefit: 'Like-new carpet' },
          { title: 'Pet stain + odor removal', description: 'Sunset Hills pet families: enzyme treatment penetrates the pad to neutralize urine at the source — not mask it.', icon: 'tool', benefit: 'No more pet smell' },
          { title: 'Upholstery + sectional', description: 'Microfiber, leather, and natural-fiber sofas cleaned safely across Bayview — fabric-specific solutions, no shrinkage.', icon: 'shield', benefit: 'Couches like new' },
          { title: 'Tile + grout restoration', description: 'High-pressure rotary plus alkaline pre-treat in Maplecrest kitchens and baths — grout 3 shades lighter, sealed optional.', icon: 'search', benefit: 'Grout looks new' },
          { title: 'Area & Oriental rugs', description: 'Off-site, hand-wash submersion cleaning for Oriental and wool rugs — pickup and delivery free across Bayview.', icon: 'tool', benefit: 'Treasured rugs revived' },
          { title: 'Commercial & office', description: 'Low-moisture encapsulation for office carpets in Lakewood — dry in one hour, ready before the workday starts.', icon: 'shield', benefit: 'Open by 8 AM' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 380+ neighbors picked PureFiber',
        heading: 'Tired of "carpet cleaners" who soak your floor and call it a day?',
        subheading: 'Soaking-wet pad, "we couldn\'t get the pet stain out," and 4-day dry times end here.',
        items: [
          { title: 'Truck-mounted, not portable', description: '230°F water and high-PSI extraction stays in the truck. Result: 90% of moisture lifted, dries in 4 hours, no mildew risk.' },
          { title: 'IICRC-certified techs', description: 'Real master-level textile training. We identify fiber type before treating — no shrinkage, no color bleed, no fabric damage.' },
          { title: 'Pet stains included free', description: 'Most cleaners charge $40+/spot for pet treatment. Our enzyme pre-treat is included on every job, every spot, every time.' },
          { title: '4-hour dry guarantee', description: 'If your carpet isn\'t dry-to-touch in 4 hours, the next room is free. We measure with a moisture meter before we leave.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every clean — included',
        heading: 'What your free quote actually covers',
        subheading: 'Every flat-rate quote we send to Lakewood, Sunset Hills, and Bayview homes includes the work below — no upcharges.',
        items: [
          'Free phone or photo quote in Lakewood, Sunset Hills, Bayview, Maplecrest + Northridge',
          'Pre-vacuum and 12-step soil agitation',
          'Pet stain + odor enzyme pre-treatment (free)',
          'Hot-water extraction at 230°F (truck-mounted)',
          'Furniture moved + replaced on protective pads',
          'Deodorizing rinse — no perfume residue',
          'Moisture-meter test before we leave',
          '4-hour dry guarantee — or next room free',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Done living with stains?',
        headline: 'Your free carpet quote is one phone call away.',
        subheadline: 'Send a few photos and approximate room count. Real estimator replies within 1 hour with a flat-rate quote — no in-home visit needed.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 380+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Lakewood, Sunset Hills, and Bayview.',
        testimonials: [
          { quote: 'Two dogs and a 5-year-old in our Lakewood house. PureFiber lifted stains I was sure were permanent — including the red Kool-Aid in the master closet. Carpets dry in 3 hours. Magic.', highlight: 'lifted permanent stains', rating: 5, name: 'Christine L.', title: 'Lakewood homeowner' },
          { quote: 'Sunset Hills rental had cat urine in 2 rooms. Other cleaners said "replace the pad." PureFiber\'s enzyme treatment killed the smell in one visit. Saved us $1,800 in flooring.', highlight: 'saved us $1,800', rating: 5, name: 'Devon T.', title: 'Sunset Hills landlord' },
          { quote: 'White microfiber sectional in Bayview, 3 years of grime, soda spills, dog drool. PureFiber matched the cleaner to the fabric and brought it back to white. Stunned.', highlight: 'brought it back to white', rating: 5, name: 'Maya K.', title: 'Bayview homeowner' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Before & afters in your neighborhood',
        subheading: 'Snapshots from Lakewood, Sunset Hills, and Bayview — fibers brightened, stains gone, smells neutralized.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Pet-stain rescue in Lakewood — enzyme treatment, lifted clean.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Sunset Hills tenant turnover — full carpet refresh, 4-hour dry.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Microfiber sectional restoration in Bayview — like-new fabric.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From stained to spotless in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Send a photo or list rooms', description: 'Submit the form with rough room count, fiber type if known, and any stain photos. Real human replies in 1 hour.' },
          { title: '2. Free flat-rate quote', description: 'Quote in your inbox same day. Pick a 2-hour window — same-week openings most weeks.' },
          { title: '3. Truck-mounted clean', description: 'IICRC-certified tech in marked van, 230°F extraction, pet-stain pre-treat, deodorize, moisture-test.' },
          { title: '4. Walk-through + dry guarantee', description: 'We walk every room with you, log moisture readings, and back it with a 4-hour dry guarantee.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Carpet cleaning questions, answered straight',
        items: [
          { question: 'How fast can you book me?', answer: 'Most Lakewood and Sunset Hills jobs are scheduled within 3–5 business days. Stain emergencies often booked same-week.' },
          { question: 'Are quotes really free?', answer: 'Yes — send rough room count and a few photos. We email a flat-rate quote within 1 hour during business hours.' },
          { question: 'Will my carpets shrink or bleed?', answer: 'No — we identify fiber type and use the right cleaning agent. IICRC-certified, 11+ years, zero shrinkage incidents.' },
          { question: 'How long do they take to dry?', answer: 'Truck-mounted extraction lifts 90% of moisture. Dry-to-touch in 4 hours guaranteed — or your next room is free.' },
          { question: 'Do you remove pet stains and smells?', answer: 'Yes — enzyme treatment penetrates the pad and breaks down odor at the source. Included free, no per-spot upcharge.' },
          { question: 'What neighborhoods do you serve?', answer: 'Lakewood, Sunset Hills, Bayview, Maplecrest, Northridge, plus 19+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-week service for these communities — and 19+ surrounding neighborhoods.',
        areas: ['Lakewood','Sunset Hills','Bayview','Maplecrest','Northridge','Stoneview','Cedar Hollow','Westbrook','Pinegrove','Glen Acres','Birch Park','Foxhill','Greenview','Hawthorne','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 4-Hour Dry Promise',
        headline: 'Carpets dry in 4 hours — or your next room is free.',
        description: 'Truck-mounted extraction lifts 90%+ of moisture every time. If a moisture-meter test before we leave shows otherwise, your next room is on us. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your carpet cleaning quote in 1 hour',
        subheading: 'Send a few photos and rough room count. Real estimator emails a flat-rate quote in an hour — no in-home visit needed.',
        ctaLabel: 'Request my free quote',
        urgency: 'Pre-holiday slots in Lakewood & Sunset Hills fill up — book early',
        nextSteps: ['Send rooms + stain photos','We email a flat-rate quote','We deep-clean + 4-hour dry guarantee'],
        guarantee: 'Free quotes • Pet stains free • 4-hour dry guarantee',
        privacyNote: 'No spam — we only contact you about your service.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'IICRC-certified, locally owned, and trusted by 380+ metro homeowners since 2014.',
        phone: PHONE, email: 'help@purefibercarpets.example',
        address: '88 Lakewood Pl, [City] Metro, 90455',
        hours: 'Mon–Sat 7am–7pm',
        licenseLine: 'Insured $2M • IICRC Master Textile Cleaner #M-2247',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-carpet-cleaning-hero-01',
    differentiatorImage: 'demo-carpet-cleaning-differentiator-01',
    checklistImage: 'demo-carpet-cleaning-checklist-01',
    galleryImage1: 'demo-carpet-cleaning-gallery-01',
    galleryImage2: 'demo-carpet-cleaning-gallery-02',
    galleryImage3: 'demo-carpet-cleaning-gallery-03',
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
    heroImageId: 'real photo professional carpet cleaning truck mounted hot water extraction technician',
    differentiatorImage: 'real photo carpet cleaner wand extraction stain removal residential living room',
    checklistImage: 'real photo carpet cleaning before after pet stain removal residential',
    galleryImage1: 'real photo carpet pet stain removal before after enzyme treatment',
    galleryImage2: 'real photo clean residential carpet bedroom recently steam cleaned',
    galleryImage3: 'real photo upholstery couch sofa cleaning microfiber before after',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'jobType', type: 'select', label: 'What needs cleaning?', placeholder: 'Select cleaning type', required: false, options: ['Carpet (rooms / stairs)','Upholstery / sofa','Area / Oriental rugs','Pet stains / odor','Tile + grout','Commercial / office'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: rooms + stairs + any pet stains? (Include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'Carpet Cleaning Lead Gen',
    description: 'High-converting lead-gen page for carpet, upholstery, and tile cleaners — truck-mounted extraction, pet stains included, 4-hour dry guarantee.',
    tags: ['carpet-cleaning','upholstery','tile-grout','pet-stains','local-services','home-services','lead-gen'],
  },
};

export default spec;
