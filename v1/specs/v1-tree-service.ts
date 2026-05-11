/**
 * v1-tree-service
 *
 * High-Converting Local Service blueprint for tree-removal + arborist companies.
 */

import { TemplateSpec } from './schema';

const BRAND = 'OakGuard Tree Service';
const PHONE = '(555) 836-1140';

const spec: TemplateSpec = {
  templateId: 'v1-tree-service',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'tree-service',
  theme: 'theme-outdoor-green',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🌳 24/7 Storm Response • ISA-Certified Arborist On-Staff • $5M Insured', phone: PHONE, hours: 'Open 24/7 for emergencies' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'ISA-certified arborist • $5M insured • Serving Oakwood, Pinegrove & 25+ neighborhoods',
        headline: 'Dangerous tree gone today — without dropping it on your roof.',
        subheadline: 'When a 60-foot oak is leaning over your house, you don\'t need 4 quotes from "guys with chainsaws." You need an ISA-certified arborist, $5M insurance, and a precision crane crew who do this every day.',
        bullets: ['ISA-certified arborist on every job — not a guy with a magnet sign','$5M general liability + workers comp — protect your home and us','24/7 emergency storm response — most jobs scheduled within 48 hours'],
        proofPoints: ['4.9★ • 290+ reviews','ISA-certified','$5M insured'],
        ctaLabel: 'Get my free tree quote',
        formHeading: 'Tell us about your tree',
        formSubheading: 'A real arborist replies within 1 hour during business hours, 2 hours after-hours.',
        trustBadge: '✓ Free on-property quotes. Storm emergencies dispatched within 2 hours.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 291 reviews', icon: 'star' },
      { label: 'ISA-certified', detail: 'arborist on staff', icon: 'shield' },
      { label: '15+ years', detail: 'in the metro', icon: 'medal' },
      { label: '$5M insured', detail: 'workers comp + liability', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited 2011', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we cut, climb, and remove',
        subheading: 'Crane-equipped, climber-led crew with 15 years of metro tree experience — including the 100-year oaks no one else will touch.',
        services: [
          { title: 'Tree removal (any size)', description: 'Removing 80-foot oaks over Oakwood roofs with precision rigging and crane assist — no driveway dent, no roof shingle.', icon: 'wrench', benefit: 'Hazard gone safely' },
          { title: '24/7 storm + emergency', description: 'Trees on houses in Pinegrove dispatched within 2 hours, day or night — we work directly with your insurance.', icon: 'tool', benefit: 'Roof safe tonight' },
          { title: 'Pruning + crown work', description: 'Deadwood removal, crown raise, and shape-pruning across Hillcrest by ISA-certified arborists — no flush cuts, no topping.', icon: 'shield', benefit: 'Stronger, safer trees' },
          { title: 'Stump grinding + cleanup', description: 'Below-grade stump grinding plus haul-away on every Birchwood job — leave us a planting bed, not a hole.', icon: 'search', benefit: 'Grass-ready by Friday' },
          { title: 'Cabling & bracing', description: 'Steel-cabled and Cobra-system bracing on split or co-dominant Oakwood trees — keep the canopy, prevent the failure.', icon: 'tool', benefit: 'Save the tree, gain years' },
          { title: 'Hazard inspection & risk reports', description: 'ISA-certified arborist hazard reports for HOAs, insurers, and homeowners across Pinegrove — written + photo evidence.', icon: 'search', benefit: 'Documented peace of mind' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 290+ neighbors picked OakGuard',
        heading: 'Tired of "tree guys" with no insurance and a $300 chainsaw?',
        subheading: 'Trucks dropping logs on driveways, $400-and-disappear estimates, and crews who put climbers up without ropes end here.',
        items: [
          { title: 'ISA-certified, every job', description: 'An ISA-Certified Arborist evaluates every job — biology, lean, decay risk. Not just "yeah we can drop that".' },
          { title: '$5M insured + workers comp', description: 'Full general liability AND workers comp on every climber. Ask for COIs in writing — most "tree guys" can\'t produce one.' },
          { title: 'Crane-assist + precision rigging', description: 'Knuckle-boom crane and proper rigging on tight removals — no fences flattened, no driveways dented, no shingles broken.' },
          { title: 'Cleanup left magazine-ready', description: 'Stump-grind below grade, rake clean, and haul every twig and chip. You should not be able to tell we were there.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every tree job — included',
        heading: 'What your written quote actually covers',
        subheading: 'Every flat-rate quote we send to Oakwood, Pinegrove, and Hillcrest homes includes the work below — no hidden fees.',
        items: [
          'Free on-property quote in Oakwood, Pinegrove, Hillcrest, Birchwood + Greenfield',
          'ISA-certified arborist evaluation',
          'COI for $5M liability + workers comp on request',
          'Crane-assist or rigging at no extra charge when needed',
          'Drop-zone tarps + lawn protection plywood',
          'Stump-grinding to 4–6 inches below grade',
          'Haul-away of all wood, brush, and chips',
          'Final rake-and-blow cleanup',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Tree leaning? Storm damage?',
        headline: 'Get a free arborist evaluation today.',
        subheadline: 'A real ISA-certified arborist visits your property, evaluates the tree, and emails a written quote within 48 hours — zero cost, zero obligation.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE + ' (24/7 emergencies)',
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 290+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Oakwood, Pinegrove, and Hillcrest.',
        testimonials: [
          { quote: '90-foot oak fell on our Oakwood house at 11pm during the storm. OakGuard had a crane onsite by 6am, tree off the roof by noon, tarp up before rain. Worked directly with our insurance — saved us $14K in delays.', highlight: 'tree off roof by noon', rating: 5, name: 'Hannah Q.', title: 'Oakwood homeowner' },
          { quote: 'Three other Pinegrove "tree guys" said our 80-ft sycamore was impossible without breaking the fence. OakGuard\'s crane crew dropped it in pieces, no damage. Driveway clean by 5pm.', highlight: 'no damage, clean by 5pm', rating: 5, name: 'Andrew F.', title: 'Pinegrove homeowner' },
          { quote: 'Asked for proof of insurance — 4 of 5 Hillcrest tree services couldn\'t produce one. OakGuard emailed COI in 5 minutes. That tells you everything. Pruned 6 oaks beautifully.', highlight: 'COI in 5 minutes', rating: 5, name: 'Linda M.', title: 'Hillcrest homeowner' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent jobs in your neighborhood',
        subheading: 'Snapshots from Oakwood, Pinegrove, and Hillcrest — large removals, surgical pruning, full cleanup.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: '90-foot oak storm removal in Oakwood — crane-assist, 6am dispatch.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: '80-foot sycamore removal in Pinegrove — no fence damage, full cleanup.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Hillcrest crown reduction + deadwood — ISA-certified pruning.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From danger to done in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us about the tree', description: 'Submit the form with photos, location, and any urgency. ISA-certified arborist replies in 1 hour (2 after-hours).' },
          { title: '2. Free on-property evaluation', description: 'Arborist visits, evaluates risk + biology, emails a written quote within 48 hours. COI on request.' },
          { title: '3. Schedule + crew arrives', description: 'Most jobs scheduled within 1 week, storm emergencies dispatched in 2 hours. Marked trucks, uniformed crew.' },
          { title: '4. Job + magazine-ready cleanup', description: 'Removal/pruning completed safely with rigging or crane. Stump-grind below grade, rake-and-blow, haul-away.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Tree service questions, answered straight',
        items: [
          { question: 'How fast can you come?', answer: 'Storm emergencies in Oakwood and Pinegrove dispatched within 2 hours, day or night. Standard jobs scheduled within 1 week.' },
          { question: 'Are quotes really free?', answer: 'Yes — an ISA-certified arborist visits and emails a written flat-rate quote within 48 hours. No deposit, no obligation.' },
          { question: 'Are you really insured?', answer: 'Yes — $5M general liability AND workers comp on every climber. We email a Certificate of Insurance (COI) in 5 minutes on request.' },
          { question: 'Will my lawn or driveway be damaged?', answer: 'No — we use plywood mats, tarp drop zones, and crane assist on tight jobs. 15 years and zero driveway claims.' },
          { question: 'Do you grind the stump?', answer: 'Yes — included in the quote on most removals. We grind to 4–6 inches below grade and rake clean, ready for grass or planting.' },
          { question: 'What neighborhoods do you serve?', answer: 'Oakwood, Pinegrove, Hillcrest, Birchwood, Greenfield, plus 20+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-week service for these communities — and 20+ surrounding neighborhoods. 24/7 storm dispatch.',
        areas: ['Oakwood','Pinegrove','Hillcrest','Birchwood','Greenfield','Stoneview','Lakeview','Cedar Hollow','Maple Heights','Glen Acres','Foxhill','Northridge','Hawthorne','Cedar Park','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our $5M-Insured Promise',
        headline: 'Your home is protected — in writing.',
        description: 'Every job is backed by $5M general liability AND workers comp. If we damage anything on your property, we fix it. Ask for our Certificate of Insurance — we email it within 5 minutes. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free arborist evaluation in 48 hours',
        subheading: 'A real ISA-certified arborist visits, evaluates the tree, and emails a written flat-rate quote — zero cost, zero obligation.',
        ctaLabel: 'Request my free quote',
        urgency: 'Storm-season slots in Oakwood & Pinegrove fill quickly — call 24/7 for emergencies',
        nextSteps: ['Send tree photos + address','Free on-property arborist evaluation','We remove + clean up + haul away'],
        guarantee: '$5M insured • ISA-certified • 24/7 emergency response',
        privacyNote: 'No spam — we only contact you about your job.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'ISA-certified, $5M-insured, and trusted by 290+ metro homeowners since 2010.',
        phone: PHONE, email: 'help@oakguardtree.example',
        address: '226 Oakwood Ridge, [City] Metro, 90119',
        hours: 'Open 24/7 for emergencies • Office Mon–Sat 7am–6pm',
        licenseLine: 'ISA-Certified Arborist #ISA-4471 • Insured $5M GL + workers comp',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-tree-service-hero-01',
    differentiatorImage: 'demo-tree-service-differentiator-01',
    checklistImage: 'demo-tree-service-checklist-01',
    galleryImage1: 'demo-tree-service-gallery-01',
    galleryImage2: 'demo-tree-service-gallery-02',
    galleryImage3: 'demo-tree-service-gallery-03',
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
    heroImageId: 'real photo arborist climber harness rope large oak tree removal residential',
    differentiatorImage: 'real photo crane truck tree removal residential precision rigging professional',
    checklistImage: 'real photo stump grinder operator residential lawn cleanup tree service',
    galleryImage1: 'real photo storm damaged tree on roof emergency removal crane',
    galleryImage2: 'real photo large tree removal sycamore precision rigging residential',
    galleryImage3: 'real photo arborist pruning oak tree crown reduction professional',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'jobType', type: 'select', label: 'What is the job?', placeholder: 'Select job type', required: false, options: ['Tree removal','Pruning / trim','Storm / emergency','Stump grinding','Cabling / bracing','Hazard inspection'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: what tree, how big, any urgency? (Photos help — include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'Tree Service Lead Gen',
    description: 'High-converting lead-gen page for tree removal + arborist services — ISA-certified, $5M insured, 24/7 storm response.',
    tags: ['tree-service','arborist','tree-removal','storm-cleanup','stump-grinding','outdoor','local-services','lead-gen'],
  },
};

export default spec;
