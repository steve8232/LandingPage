/**
 * v1-lawn-landscaping
 *
 * High-Converting Local Service blueprint for lawn-care + landscaping companies.
 */

import { TemplateSpec } from './schema';

const BRAND = 'GreenAcre Lawn & Landscape';
const PHONE = '(555) 770-2244';

const spec: TemplateSpec = {
  templateId: 'v1-lawn-landscaping',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'lawn-landscaping',
  theme: 'theme-outdoor-green',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🌿 Free Lawn Analysis • Weed-Free Guarantee • Locally Owned, Family-Run', phone: PHONE, hours: 'Mon–Sat 7am–6pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Weed-free guarantee • Same crew every visit • Serving Cedar Park, Riverstone & 26+ neighborhoods',
        headline: 'The thickest, greenest lawn on your block — by the 4th cut.',
        subheadline: 'Stop fighting crabgrass and brown patches alone. Our 6-step custom program builds a deep-root, weed-free lawn that holds up through August heat — backed by a free re-treat if weeds come back.',
        bullets: ['Custom 6-step program tuned to your soil + grass type','Same 2-person crew every visit — they know your sprinklers and dogs','Weed-free guarantee — free re-treat if weeds come back in 14 days'],
        proofPoints: ['4.9★ • 460+ reviews','Licensed applicator','Weed-free guarantee'],
        ctaLabel: 'Get my free lawn analysis',
        formHeading: 'Tell us about your lawn',
        formSubheading: 'A real lawn-care pro replies within 1 hour during business hours.',
        trustBadge: '✓ Free on-property soil + lawn analysis. No long-term contracts. Cancel any time.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 463 reviews', icon: 'star' },
      { label: 'Licensed applicator', detail: 'state-certified #L-3344', icon: 'shield' },
      { label: '12+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Same crew', detail: 'every visit', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited 2015', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we mow, treat, and transform',
        subheading: 'A complete lawn + landscape program tuned to your soil — no one-size-fits-all "spray and pray".',
        services: [
          { title: 'Weekly + bi-weekly mowing', description: 'Same crew every visit in Cedar Park — sharp blades, edged walks + driveway, blown clean. No skipped weeks, no surprises.', icon: 'wrench', benefit: 'Always show-ready' },
          { title: '6-step lawn treatment program', description: 'Custom fertilizer + weed-control plan tuned to your Riverstone soil — pre-emergent in spring, deep-root feeding through fall.', icon: 'tool', benefit: 'Thickest grass on the block' },
          { title: 'Aeration + overseeding', description: 'Core-aerate compacted clay across Maple Heights and overseed with premium turf-type tall fescue blends — every fall.', icon: 'shield', benefit: '2× thicker by spring' },
          { title: 'Landscape design + install', description: 'New beds, mulch refresh, paver patios, and 4-season plantings in Hillside — full-service from sketch to install.', icon: 'search', benefit: 'Curb appeal that sells' },
          { title: 'Spring & fall cleanups', description: 'Leaf removal, bed clean-out, perennial cutbacks, and gutter check across Cedar Park — full curb-appeal reset in one day.', icon: 'tool', benefit: 'Yard ready for the season' },
          { title: 'Irrigation & drainage', description: 'Smart sprinkler installs, head repairs, and French-drain solutions for soggy spots in Maple Heights backyards.', icon: 'shield', benefit: 'Smart watering, dry yard' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 460+ neighbors picked GreenAcre',
        heading: 'Tired of "lawn guys" who skip weeks, miss spots, and never call back?',
        subheading: 'Trampled flower beds, dull-blade scalps, and "we forgot to fertilize" months end here.',
        items: [
          { title: 'Same crew, every visit', description: 'You get the same 2-person crew every week. They know your sprinkler heads, your dogs, and the bed line that drives you crazy.' },
          { title: 'Custom 6-step program', description: 'Most "lawn services" use the same bag of fertilizer on every yard. We test your soil, ID your grass, and build a 6-step plan tuned to your lawn.' },
          { title: 'Sharp blades, edged every visit', description: 'Dull blades shred grass and brown the tips. We sharpen daily, edge walks + driveways every visit, and blow clean — every cut, every week.' },
          { title: 'Weed-free guarantee', description: 'If weeds break through within 14 days of a treatment, we re-treat free. No paperwork, no fine print.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every visit — included',
        heading: 'What your weekly service actually covers',
        subheading: 'Every visit we do in Cedar Park, Riverstone, and Maple Heights includes the work below — guaranteed.',
        items: [
          'Free on-property analysis in Cedar Park, Riverstone, Maple Heights, Hillside + Greenfield',
          'Mow at correct height for your grass type',
          'Sharp blades — sharpened every morning',
          'Edge walks, driveways, and bed lines',
          'String-trim around beds, fences, posts',
          'Blow clean walks, patios, driveway',
          'Quick visual on shrubs + bed health',
          'Weed-free guarantee — free re-treat if needed',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Done with the brown patches?',
        headline: 'Free lawn analysis + custom plan in 48 hours.',
        subheadline: 'A real lawn-care pro visits your property, identifies weeds and soil issues, and emails a custom 6-step plan — at zero cost, no obligation.',
        ctaLabel: 'Get my free analysis', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 460+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Cedar Park, Riverstone, and Maple Heights.',
        testimonials: [
          { quote: 'Our Cedar Park lawn was 60% crabgrass. By the 4th treatment it was the thickest yard in the cul-de-sac. Same 2 guys every visit — they even bring treats for our dog.', highlight: 'thickest yard in the cul-de-sac', rating: 5, name: 'Patrick M.', title: 'Cedar Park homeowner' , avatarAsset: 'testimonialAvatar1', fallbackAsset: 'fallbackTestimonialAvatar1' },
          { quote: 'Riverstone HOA forced us to fix our dead spots before sale. GreenAcre aerated, overseeded, and treated — by closing the lawn was magazine-cover green. Buyer\'s agent commented.', highlight: 'magazine-cover green', rating: 5, name: 'Becca H.', title: 'Riverstone homeowner' , avatarAsset: 'testimonialAvatar2', fallbackAsset: 'fallbackTestimonialAvatar2' },
          { quote: 'Hired 3 other "lawn guys" before GreenAcre — all skipped weeks or scalped the grass. GreenAcre has been every Wednesday at 9am for 18 months. Maple Heights yard never looked better.', highlight: 'every Wednesday at 9am', rating: 5, name: 'Rashid V.', title: 'Maple Heights homeowner' , avatarAsset: 'testimonialAvatar3', fallbackAsset: 'fallbackTestimonialAvatar3' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent transformations in your neighborhood',
        subheading: 'Snapshots from Cedar Park, Riverstone, and Maple Heights — thicker turf, cleaner edges, healthier color.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Cedar Park lawn — 60% crabgrass to thickest yard in the cul-de-sac.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Riverstone aeration + overseed — magazine-cover green by spring.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Maple Heights bed refresh + mulch — like-new curb appeal.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From patchy to picture-perfect in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us about your lawn', description: 'Submit the form with rough lot size, current issues, and goals. Real lawn-care pro replies in 1 hour.' },
          { title: '2. Free on-property analysis', description: 'We visit, ID your grass + weeds, test soil pH, and email a custom 6-step plan. Zero obligation.' },
          { title: '3. Same crew, weekly visits', description: 'You get the same 2-person crew every week. Sharp blades, edged walks, blown clean.' },
          { title: '4. Visible thicker color in 4 cuts', description: 'By the 4th visit you see thicker color, fewer weeds, sharper edges. Backed by our weed-free guarantee.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Lawn + landscape questions, answered straight',
        items: [
          { question: 'How fast can you start?', answer: 'Most Cedar Park and Riverstone customers get their first visit within 5–7 business days. Spring (March–May) books 1–2 weeks out.' },
          { question: 'Are quotes really free?', answer: 'Yes — we visit on-property, test soil, and email a custom plan within 48 hours. No deposit, no obligation.' },
          { question: 'Are you licensed for chemicals?', answer: 'Yes — state-licensed applicator #L-3344. Pet- and kid-safe formulations on every property; signage posted after each treatment.' },
          { question: 'Do I have to sign a contract?', answer: 'No — month-to-month, cancel any time. We earn your repeat business every visit, not by trapping you in a contract.' },
          { question: 'What is your guarantee?', answer: 'Weed-free guarantee — if weeds break through within 14 days of a treatment, we come back and re-treat free.' },
          { question: 'What neighborhoods do you serve?', answer: 'Cedar Park, Riverstone, Maple Heights, Hillside, Greenfield, plus 21+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every week',
        subheading: 'Same-week service for these communities — and 21+ surrounding neighborhoods.',
        areas: ['Cedar Park','Riverstone','Maple Heights','Hillside','Greenfield','Stoneview','Lakeview','Cedar Hollow','Pinegrove','Glen Acres','Birch Park','Foxhill','Northridge','Hawthorne','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our Weed-Free Promise',
        headline: 'Weeds back in 14 days? We re-treat — free.',
        description: 'Every treatment carries a 14-day weed-free guarantee. If weeds break through, we come back and re-treat the affected area at zero cost. No paperwork, no fine print. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free lawn analysis in 48 hours',
        subheading: 'A real lawn-care pro visits, tests your soil, and emails a custom 6-step plan — zero cost, zero obligation.',
        ctaLabel: 'Request my free analysis',
        urgency: 'Spring slots in Cedar Park & Riverstone fill up by mid-April — book early',
        nextSteps: ['Tell us about your lawn','Free on-property analysis','We mow + treat + guarantee'],
        guarantee: 'Free analysis • Same crew every visit • Weed-free guarantee',
        privacyNote: 'No spam — we only contact you about your lawn.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Family-owned, state-licensed, and trusted by 460+ metro homeowners since 2013.',
        phone: PHONE, email: 'help@greenacrelawn.example',
        address: '907 Cedar Park Trail, [City] Metro, 90288',
        hours: 'Mon–Sat 7am–6pm',
        licenseLine: 'Licensed applicator #L-3344 • Insured $2M • Background-checked crews',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-lawn-landscaping-hero-01',
    differentiatorImage: 'demo-lawn-landscaping-differentiator-01',
    checklistImage: 'demo-lawn-landscaping-checklist-01',
    galleryImage1: 'demo-lawn-landscaping-gallery-01',
    galleryImage2: 'demo-lawn-landscaping-gallery-02',
    galleryImage3: 'demo-lawn-landscaping-gallery-03',
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    testimonialAvatar1: 'demo-lawn-landscaping-avatar-01',
    testimonialAvatar2: 'demo-lawn-landscaping-avatar-02',
    testimonialAvatar3: 'demo-lawn-landscaping-avatar-03',
    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo lush green manicured residential lawn fresh stripes mowing professional',
    differentiatorImage: 'real photo lawn care technician fertilizer spreader thick grass treatment',
    checklistImage: 'real photo crew mowing edging blowing residential lawn professional landscape',
    galleryImage1: 'real photo before after thick green lawn fresh treatment residential',
    galleryImage2: 'real photo aeration overseeding residential lawn fall preparation',
    galleryImage3: 'real photo fresh mulch landscaped flower bed residential curb appeal',
    testimonialAvatar1: 'real photo professional headshot of happy lawn-landscaping customer, woman late 30s, warm friendly smile, residential setting',
    testimonialAvatar2: 'real photo professional headshot of satisfied lawn-landscaping customer, man early 40s, casual confident, daylight',
    testimonialAvatar3: 'real photo warm portrait of mature lawn-landscaping repeat customer, woman 50s, natural light, trustworthy expression',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'serviceType', type: 'select', label: 'What service?', placeholder: 'Select service', required: false, options: ['Mowing / recurring','Lawn treatment','Aeration / overseeding','Mulch / bed install','Spring / fall cleanup','Irrigation / drainage'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the analysis)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: lot size, current issues, goals? (Include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'Lawn & Landscape Lead Gen',
    description: 'High-converting lead-gen page for lawn care + landscaping — same crew every visit, custom 6-step program, weed-free guarantee.',
    tags: ['lawn-care','landscaping','mowing','fertilization','aeration','local-services','outdoor','lead-gen'],
  },
};

export default spec;
