/**
 * v1-window-cleaning
 *
 * High-Converting Local Service blueprint for residential window cleaners.
 */

import { TemplateSpec } from './schema';

const BRAND = 'CrystalView Window Cleaners';
const PHONE = '(555) 384-1190';

const spec: TemplateSpec = {
  templateId: 'v1-window-cleaning',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'window-cleaning',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '✨ Free Online Quotes • Streak-Free Guarantee • Inside + Out Specialists', phone: PHONE, hours: 'Mon–Sat 7am–6pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Quote', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Inside + outside • Tracks + screens included • Serving Hillside, Maplebrook & 22+ neighborhoods',
        headline: 'Clear views. Streak-free. By Friday at 5.',
        subheadline: 'Stop scrubbing windows on a ladder every spring. Our team cleans inside and out, deep-cleans tracks and screens, and guarantees streak-free glass — or we come back.',
        bullets: ['Free 60-second online quote based on window count','Tracks, sills, and screens deep-cleaned at no extra charge','Streak-free guarantee — we re-clean any window free'],
        proofPoints: ['4.9★ • 280+ reviews','Fully insured','Streak-free guarantee'],
        ctaLabel: 'Get my free window quote',
        formHeading: 'Tell us about your home',
        formSubheading: 'A real estimator replies within 1 hour during business hours.',
        trustBadge: '✓ Free quotes online. No deposit. Most homes done in under 4 hours.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 281 reviews', icon: 'star' },
      { label: 'Fully insured', detail: '$2M general liability', icon: 'shield' },
      { label: '7+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Streak-free', detail: 'guaranteed every window', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited since 2018', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we clean inside, outside, and behind',
        subheading: 'A trained 2-person team works inside and out simultaneously — most Hillside homes done in 3–4 hours.',
        services: [
          { title: 'Interior + exterior glass', description: 'Inside and outside cleaned the same visit in Hillside — no streaks, no rags-on-windows, just water-fed-pole + squeegee.', icon: 'wrench', benefit: 'Crystal-clear views' },
          { title: 'Tracks, sills & screens', description: 'Tracks vacuumed, sills wiped, and screens hand-washed — included free in every Maplebrook full-home wash.', icon: 'tool', benefit: 'No more black gunk' },
          { title: 'Hard-water + mineral removal', description: 'Sprinkler-spotted glass and shower doors restored with mineral-safe formulas — even on 5+ year buildup.', icon: 'shield', benefit: 'Restores etched glass' },
          { title: 'Skylights, sunrooms, atriums', description: 'High-up and awkward-angle glass cleaned safely with water-fed-pole tech — no ladder-on-roof risk.', icon: 'search', benefit: 'Light floods back in' },
          { title: 'Gutter cleaning & flush', description: 'Hand-clean every gutter, downspout flush, and roof-debris removal across Hillside — photo report on completion.', icon: 'tool', benefit: 'No clog, no overflow' },
          { title: 'Solar panels & commercial glass', description: 'Pure-water rinse on residential solar arrays plus storefront and office glass throughout Maplebrook — minimum-streak guarantee.', icon: 'search', benefit: 'Cleaner glass = more sales' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 280+ neighbors picked CrystalView',
        heading: 'Tired of "window cleaners" who skip tracks and leave streaks?',
        subheading: 'Half-cleaned windows, screens left dusty, and "sorry we missed those" upstairs panes end here.',
        items: [
          { title: 'Inside + outside, same visit', description: 'Two-person team works in tandem so most homes finish in one visit, including upstairs and skylights.' },
          { title: 'Tracks + screens free', description: 'Tracks vacuumed and screens hand-washed in soapy water on every full-home job. Most "cheaper" services charge extra.' },
          { title: 'Water-fed-pole tech', description: 'Pure-water poles reach 4-story windows without ladders — safer for techs and zero ladder-marks on your siding.' },
          { title: 'Streak-free guarantee', description: 'If a window streaks or a spot is missed within 7 days, we re-clean it free. Period.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every visit — included',
        heading: 'What your free quote actually covers',
        subheading: 'Every full-home quote we send to Hillside, Maplebrook, and Forestpark homes includes the work below.',
        items: [
          'Free online quote in Hillside, Maplebrook, Forestpark, Pinegrove + Sunnyside',
          'Inside + outside glass on every window',
          'Tracks vacuumed and wiped down',
          'Screens removed, hand-washed, replaced',
          'Sills + frames wiped clean',
          'Hard-water spot-treatment as needed',
          'Booties + drop cloths in every room',
          '7-day streak-free guarantee',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Done squinting through smudges?',
        headline: 'Your free window quote is 60 seconds away.',
        subheadline: 'Tell us your home size and window count and we email a flat-rate quote within 1 hour — no in-home visit, no obligation.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 280+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Hillside, Maplebrook, and Forestpark.',
        testimonials: [
          { quote: 'Two-person team did 28 windows in our Hillside house in under 4 hours — inside, outside, tracks, screens. Streak-free everywhere. The light through the kitchen is shocking.', highlight: '28 windows in under 4 hours', rating: 5, name: 'Catherine S.', title: 'Hillside homeowner' , avatarAsset: 'testimonialAvatar1', fallbackAsset: 'fallbackTestimonialAvatar1' },
          { quote: 'Maplebrook home had 3 years of mineral spots from sprinklers. CrystalView restored 14 windows like new — saved us $4K replacing the glass. Worth every dollar.', highlight: 'saved us $4K', rating: 5, name: 'Greg M.', title: 'Maplebrook homeowner' , avatarAsset: 'testimonialAvatar2', fallbackAsset: 'fallbackTestimonialAvatar2' },
          { quote: 'The screens, the tracks, the sills — everywhere I thought "they will skip that," they didn\'t. Forestpark home looks 10 years newer. Booking the next clean already.', highlight: '10 years newer', rating: 5, name: 'Yuki T.', title: 'Forestpark homeowner' , avatarAsset: 'testimonialAvatar3', fallbackAsset: 'fallbackTestimonialAvatar3' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent jobs in your neighborhood',
        subheading: 'Snapshots from Hillside, Maplebrook, and Forestpark — clear glass, clean tracks, light flooding in.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Full-home interior + exterior wash in Hillside — 28 windows, 4 hours.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Hard-water mineral restoration in Maplebrook — like-new glass.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Water-fed-pole 3-story atrium clean in Forestpark — no ladder needed.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From smudges to spotless in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us your home size', description: 'Submit the form with home size and approx. window count. A real human replies within 1 hour.' },
          { title: '2. Free flat-rate quote', description: 'Quote in your inbox the same day. Pick a date that works — no high-pressure sales.' },
          { title: '3. 2-person team arrives', description: 'Uniformed, in marked van, with booties and drop cloths. Most homes done in 3–4 hours.' },
          { title: '4. Walk-through + 7-day guarantee', description: 'We walk every window with you, replace screens, vacuum tracks, and email your invoice. Streak-free or we return.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Window cleaning questions, answered straight',
        items: [
          { question: 'How fast can you book me?', answer: 'Most Hillside and Maplebrook homes are scheduled within 3–5 business days. Spring (April–June) books 1–2 weeks out.' },
          { question: 'Are quotes really free?', answer: 'Yes — send your home size and window count, we email a flat-rate quote within 1 hour during business hours.' },
          { question: 'Do you remove screens?', answer: 'Always. We remove every accessible screen, hand-wash in soapy water, and re-install. Free with every full-home job.' },
          { question: 'What about hard-water spots?', answer: 'We can remove most mineral spots with a mineral-safe formula — even on glass etched 5+ years. Quoted separately if needed.' },
          { question: 'What is your guarantee?', answer: '7-day streak-free guarantee. If any window streaks or a spot is missed, we come back and re-clean it free.' },
          { question: 'What neighborhoods do you serve?', answer: 'Hillside, Maplebrook, Forestpark, Pinegrove, Sunnyside, plus 18+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-week coverage for these communities — and 18+ surrounding neighborhoods.',
        areas: ['Hillside','Maplebrook','Forestpark','Pinegrove','Sunnyside','Cedar Hollow','Stoneview','Westbrook','Northridge','Lakeview','Hawthorne','Glen Acres','Birch Park','Foxhill','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 7-Day Streak-Free Promise',
        headline: 'If a window streaks — we re-clean it, free.',
        description: 'Every wash carries a 7-day streak-free guarantee. If any window streaks or a spot is missed, we come back and re-clean it at zero cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free window cleaning quote in 1 hour',
        subheading: 'Tell us your home size and window count and we email a flat-rate quote within an hour — no in-home visit needed.',
        ctaLabel: 'Request my free quote',
        urgency: 'Spring slots in Hillside & Maplebrook fill quickly — book early',
        nextSteps: ['Share home size + window count','We email a flat-rate quote','We clean inside + out + tracks + screens'],
        guarantee: 'Free quotes • Streak-free guarantee • Tracks + screens included',
        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Locally owned, fully insured, and trusted by 280+ metro homeowners since 2018.',
        phone: PHONE, email: 'help@crystalviewwindows.example',
        address: '1185 Hillside Dr, [City] Metro, 90471',
        hours: 'Mon–Sat 7am–6pm',
        licenseLine: 'Fully insured $2M • Bonded • Background-checked techs',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-window-cleaning-hero-01',
    differentiatorImage: 'demo-window-cleaning-differentiator-01',
    checklistImage: 'demo-window-cleaning-checklist-01',
    galleryImage1: 'demo-window-cleaning-gallery-01',
    galleryImage2: 'demo-window-cleaning-gallery-02',
    galleryImage3: 'demo-window-cleaning-gallery-03',
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    testimonialAvatar1: 'demo-window-cleaning-avatar-01',
    testimonialAvatar2: 'demo-window-cleaning-avatar-02',
    testimonialAvatar3: 'demo-window-cleaning-avatar-03',
    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo professional window cleaner squeegee residential glass clear sunlight',
    differentiatorImage: 'real photo window cleaner with water fed pole 2 story house no ladder',
    checklistImage: 'real photo window cleaner vacuuming tracks screen removal residential',
    galleryImage1: 'real photo clean residential window interior streak free crystal clear',
    galleryImage2: 'real photo hard water mineral spot removal glass restoration before after',
    galleryImage3: 'real photo skylight atrium glass cleaning water fed pole sun',
    testimonialAvatar1: 'real photo professional headshot of happy window-cleaning customer, woman late 30s, warm friendly smile, residential setting',
    testimonialAvatar2: 'real photo professional headshot of satisfied window-cleaning customer, man early 40s, casual confident, daylight',
    testimonialAvatar3: 'real photo warm portrait of mature window-cleaning repeat customer, woman 50s, natural light, trustworthy expression',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'jobType', type: 'select', label: 'What kind of cleaning?', placeholder: 'Select cleaning type', required: false, options: ['Exterior only','Interior + exterior','Hard-water removal','Screens & tracks','Gutter cleaning','Commercial'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: home size + approx. window count? (Include city/ZIP)', required: false },
  ],

  metadata: {
    name: 'Window Cleaning Lead Gen',
    description: 'High-converting lead-gen page for residential window cleaners — free online quotes, tracks + screens included, 7-day streak-free guarantee.',
    tags: ['window-cleaning','residential','tracks-screens','soft-wash','local-services','home-services','lead-gen'],
  },
};

export default spec;
