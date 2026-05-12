/**
 * v1-pool-service
 *
 * High-Converting Local Service blueprint for residential pool maintenance + repair.
 */

import { TemplateSpec } from './schema';

const BRAND = 'CrystalBlue Pool Service';
const PHONE = '(555) 411-2299';

const spec: TemplateSpec = {
  templateId: 'v1-pool-service',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'pool-service',
  theme: 'theme-outdoor-green',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🏊 Weekly Service from $149/mo • CPO-Certified Techs • Crystal-Clear Guarantee', phone: PHONE, hours: 'Mon–Sat 7am–6pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'CPO-certified techs • Same tech every visit • Serving Lakeshore, Vista Bay & 22+ neighborhoods',
        headline: 'Crystal-clear pool every Friday — without ever touching a chemical.',
        subheadline: 'Stop guessing chlorine levels and chasing algae blooms. Our CPO-certified tech visits weekly, balances 8-point chemistry, brushes + vacuums, and emails a photo report — for one flat monthly rate.',
        bullets: ['Same CPO-certified tech every week — they know your pool, equipment, and HOA rules','8-point water chemistry test + balance every visit (not just chlorine)','Photo report after every visit + crystal-clear guarantee'],
        proofPoints: ['4.9★ • 240+ reviews','CPO-certified','Crystal-clear guarantee'],
        ctaLabel: 'Get my free pool quote',
        formHeading: 'Tell us about your pool',
        formSubheading: 'A real pool tech replies within 1 hour during business hours.',
        trustBadge: '✓ Free in-person evaluation. No long-term contracts. Cancel any time.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 244 reviews', icon: 'star' },
      { label: 'CPO-certified', detail: 'pool operators', icon: 'shield' },
      { label: '10+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Same tech', detail: 'every visit', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited 2016', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What every weekly visit covers',
        subheading: 'A CPO-certified tech in a marked truck, with proper equipment — not a kid with a brush and a guess.',
        services: [
          { title: 'Weekly maintenance', description: 'Same tech every Wednesday in Lakeshore — 8-point water test, brush + vacuum, skim, and equipment check.', icon: 'wrench', benefit: 'Always swim-ready' },
          { title: 'Green-pool recovery', description: 'Algae-bloom rescues across Vista Bay — shock + flocculate + filter cycle, swim-ready in 3 days vs. 2 weeks.', icon: 'tool', benefit: 'Crystal-clear in 3 days' },
          { title: 'Equipment repair + install', description: 'Pumps, filters, heaters, salt cells in Sunhaven — diagnostic in 24 hours, most parts on the truck.', icon: 'shield', benefit: 'Pool back online fast' },
          { title: 'Acid-wash + tile cleaning', description: 'Plaster restoration, calcium-line cleaning, and tile detail in Maplecrest — bring back the original blue.', icon: 'search', benefit: 'Pool looks new' },
          { title: 'Open & close season', description: 'Spring opens with full chemistry balance + cover removal in Lakeshore. Fall closes with antifreeze, plug, and safety cover.', icon: 'tool', benefit: 'Stress-free seasons' },
          { title: 'Leak detection & repair', description: 'Pressure tests, dye tests, and electronic leak detection on pool plumbing across Vista Bay — find leaks without jackhammers.', icon: 'search', benefit: 'Stop water + bill creep' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 240+ pool owners picked CrystalBlue',
        heading: 'Tired of "pool guys" who skip weeks, dump chlorine, and never explain the bill?',
        subheading: 'Cloudy water on Saturday mornings, surprise $400 chemical bills, and "your pump is shot" upsells end here.',
        items: [
          { title: 'Same CPO-certified tech', description: 'You get the same Certified Pool Operator every visit — they know your pump, your tile, your local water hardness.' },
          { title: '8-point chemistry, every visit', description: 'Most pool services test 2 things: chlorine and pH. We test 8 — including alkalinity, calcium, CYA, and salt — every time.' },
          { title: 'Photo report after every visit', description: 'You get a date- and time-stamped photo report with chemistry readings. Proof we were there, doing the work.' },
          { title: 'Flat monthly rate, no surprises', description: 'Chemicals are included in your monthly rate. No "oh you needed shock this week" surprise invoices, ever.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every visit — included',
        heading: 'What your weekly service actually covers',
        subheading: 'Every visit we do in Lakeshore, Vista Bay, and Sunhaven includes the work below — chemicals included.',
        items: [
          'Free in-person quote in Lakeshore, Vista Bay, Sunhaven, Maplecrest + Greenfield',
          '8-point water chemistry test + balance',
          'Chemicals included (chlorine, shock, conditioner)',
          'Brush walls, steps, and tile line',
          'Vacuum floor + skim surface debris',
          'Empty skimmer + pump baskets',
          'Filter pressure check + back-flush as needed',
          'Photo report after every visit (chemistry + condition)',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Cloudy water? Algae?',
        headline: 'Free in-person pool evaluation in 48 hours.',
        subheadline: 'A CPO-certified tech visits your pool, tests chemistry, evaluates equipment, and emails a flat monthly quote — zero cost, zero obligation.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 240+ local pool owners say',
        subheading: 'Verified Google reviews from neighbors in Lakeshore, Vista Bay, and Sunhaven.',
        testimonials: [
          { quote: 'Lakeshore pool went green after the heat wave — 3 other pool guys quoted $600+ "shock packages." CrystalBlue had it crystal-clear in 3 days for $180. Now on weekly service for $179/mo. Worth every penny.', highlight: 'crystal-clear in 3 days', rating: 5, name: 'Vincent R.', title: 'Lakeshore homeowner' , avatarAsset: 'testimonialAvatar1', fallbackAsset: 'fallbackTestimonialAvatar1' },
          { quote: 'Vista Bay tech is the same guy every Tuesday for 14 months. Knows my equipment, brings parts before I ask, photo report in my inbox by 11am. Best pool service we have ever had.', highlight: 'photo report in my inbox by 11am', rating: 5, name: 'Wendy A.', title: 'Vista Bay homeowner' , avatarAsset: 'testimonialAvatar2', fallbackAsset: 'fallbackTestimonialAvatar2' },
          { quote: 'Sunhaven pump died on July 4th. Other services said "Tuesday at earliest." CrystalBlue came that night, replaced it, swimming the next morning. Fair price, no upsell.', highlight: 'swimming the next morning', rating: 5, name: 'Jorge P.', title: 'Sunhaven homeowner' , avatarAsset: 'testimonialAvatar3', fallbackAsset: 'fallbackTestimonialAvatar3' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent jobs in your neighborhood',
        subheading: 'Snapshots from Lakeshore, Vista Bay, and Sunhaven — clear water, sparkling tile, balanced chemistry.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Lakeshore green-pool rescue — crystal-clear in 3 days.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Weekly service in Vista Bay — same tech 14 months running.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Sunhaven equipment swap — pump online next morning.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From cloudy to crystal-clear in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us about your pool', description: 'Submit the form with pool size, equipment notes, and current condition. Real pool tech replies in 1 hour.' },
          { title: '2. Free in-person evaluation', description: 'CPO-certified tech visits, tests water, evaluates equipment, and emails a flat monthly quote in 48 hours.' },
          { title: '3. Same tech every week', description: 'You get the same tech every week — they know your pool, your gate code, and your dog.' },
          { title: '4. Photo report after every visit', description: 'Chemistry readings, photos of equipment + water clarity emailed within 1 hour of every visit.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Pool service questions, answered straight',
        items: [
          { question: 'How fast can you start?', answer: 'Most Lakeshore and Vista Bay customers get their first weekly visit within 5–7 business days. Green-pool rescues often within 48 hours.' },
          { question: 'Are quotes really free?', answer: 'Yes — a CPO-certified tech visits, tests water, evaluates equipment, and emails a flat monthly quote in 48 hours. No deposit.' },
          { question: 'Are chemicals included?', answer: 'Yes — chlorine, shock, conditioner, and balance chemicals are included in your flat monthly rate. No surprise invoices.' },
          { question: 'What if my pool turns green?', answer: 'Included in weekly service — most algae blooms are crystal-clear in 3 days. We also do one-time green-pool recoveries for non-customers.' },
          { question: 'Do I have to be home?', answer: 'No — we work from gate codes, lockboxes, or a hidden key. Same tech every visit, fully bonded + insured.' },
          { question: 'What neighborhoods do you serve?', answer: 'Lakeshore, Vista Bay, Sunhaven, Maplecrest, Greenfield, plus 17+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local routes, local techs',
        heading: 'Proudly serving the metro every week',
        subheading: 'Weekly service for these communities — and 17+ surrounding neighborhoods.',
        areas: ['Lakeshore','Vista Bay','Sunhaven','Maplecrest','Greenfield','Stoneview','Lakeview','Cedar Hollow','Pinegrove','Glen Acres','Foxhill','Birch Park','Northridge','Hawthorne','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our Crystal-Clear Promise',
        headline: 'Cloudy water mid-week? We come back — free.',
        description: 'Every weekly visit is backed by our crystal-clear guarantee. If your water is cloudy or unbalanced between visits, we come back free and fix it. No surprise invoices. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free pool evaluation in 48 hours',
        subheading: 'A CPO-certified tech visits, tests water, evaluates equipment, and emails a flat monthly quote — zero cost, zero obligation.',
        ctaLabel: 'Request my free quote',
        urgency: 'Summer slots in Lakeshore & Vista Bay fill up by mid-May — book early',
        nextSteps: ['Tell us about your pool','Free in-person evaluation','Same tech every week + photo reports'],
        guarantee: 'Free quotes • Same tech every visit • Crystal-clear guarantee',
        privacyNote: 'No spam — we only contact you about your pool.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'CPO-certified, locally owned, and trusted by 240+ metro pool owners since 2015.',
        phone: PHONE, email: 'help@crystalbluepool.example',
        address: '341 Lakeshore Dr, [City] Metro, 90712',
        hours: 'Mon–Sat 7am–6pm',
        licenseLine: 'CPO-Certified Pool Operators • Insured $2M • Bonded crews',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-pool-service-hero-01',
    differentiatorImage: 'demo-pool-service-differentiator-01',
    checklistImage: 'demo-pool-service-checklist-01',
    galleryImage1: 'demo-pool-service-gallery-01',
    galleryImage2: 'demo-pool-service-gallery-02',
    galleryImage3: 'demo-pool-service-gallery-03',
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    testimonialAvatar1: 'demo-pool-service-avatar-01',
    testimonialAvatar2: 'demo-pool-service-avatar-02',
    testimonialAvatar3: 'demo-pool-service-avatar-03',
    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo professional pool technician testing water clear blue residential pool',
    differentiatorImage: 'real photo pool service tech brushing tile vacuum residential backyard',
    checklistImage: 'real photo pool chemistry test kit balanced clear water professional',
    galleryImage1: 'real photo crystal clear blue residential pool sparkling backyard',
    galleryImage2: 'real photo pool tech equipment maintenance pump filter residential',
    galleryImage3: 'real photo pool acid wash plaster restoration before after residential',
    testimonialAvatar1: 'real photo professional headshot of happy pool-service customer, woman late 30s, warm friendly smile, residential setting',
    testimonialAvatar2: 'real photo professional headshot of satisfied pool-service customer, man early 40s, casual confident, daylight',
    testimonialAvatar3: 'real photo warm portrait of mature pool-service repeat customer, woman 50s, natural light, trustworthy expression',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'serviceType', type: 'select', label: 'What service?', placeholder: 'Select service', required: false, options: ['Weekly maintenance','Open / close season','Equipment repair','Green-pool recovery','Leak detection','Tile / acid wash'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: pool size, equipment, any current issues? (Include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'Pool Service Lead Gen',
    description: 'High-converting lead-gen page for residential pool maintenance + repair — same CPO-certified tech, 8-point chemistry, photo report after every visit.',
    tags: ['pool-service','pool-maintenance','equipment-repair','green-pool','outdoor','local-services','lead-gen'],
  },
};

export default spec;
