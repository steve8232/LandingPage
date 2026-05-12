/**
 * v1-junk-removal
 *
 * High-Converting Local Service blueprint for full-service junk removal companies.
 */

import { TemplateSpec } from './schema';

const BRAND = 'HaulPro Junk Removal';
const PHONE = '(555) 217-9008';

const spec: TemplateSpec = {
  templateId: 'v1-junk-removal',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'junk-removal',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🚚 Same-Day Pickup • Upfront Pricing • We Donate + Recycle 60%+ of Loads', phone: PHONE, hours: 'Mon–Sun 7am–8pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Book Pickup', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Same-day pickup • Upfront flat pricing • Serving Riverbend, Oak Hill & 30+ neighborhoods',
        headline: 'That pile of junk — gone today, no heavy lifting.',
        subheadline: 'Stop renting a truck and begging your brother-in-law for help. We do all the lifting, sweep up after, and donate or recycle 60%+ of every load. Upfront pricing texted before we arrive.',
        bullets: ['Same-day or next-day pickup in most metro neighborhoods','Upfront flat price texted before arrival — never a surprise','We do ALL the lifting from anywhere on the property'],
        proofPoints: ['4.9★ • 510+ reviews','Licensed + insured','60%+ donated/recycled'],
        ctaLabel: 'Get my free quote',
        formHeading: 'Tell us what needs to go',
        formSubheading: 'Real human replies within 15 minutes during business hours.',
        trustBadge: '✓ Free quotes by photo or phone. No deposit. Pay only when junk is gone.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 512 reviews', icon: 'star' },
      { label: 'Licensed + insured', detail: '$2M general liability', icon: 'shield' },
      { label: '6+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Same-day', detail: 'pickup most days', icon: 'clock' },
      { label: '60%+ donated', detail: 'reuse + recycle', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we haul (and where it actually goes)',
        subheading: 'Two-person crew, 18-cubic-yard truck, and a donation-first sort process — most loads are out of your driveway in 30 minutes.',
        services: [
          { title: 'Whole-house cleanouts', description: 'Estate, foreclosure, and downsizing cleanouts in Riverbend — top-to-bottom, including attic, basement, and garage.', icon: 'wrench', benefit: 'House empty in one day' },
          { title: 'Garage + basement', description: 'Decades of stuff hauled out of Oak Hill homes — we sort donate vs. dump as we load.', icon: 'tool', benefit: 'Reclaim your space' },
          { title: 'Furniture + appliance pickup', description: 'Couches, mattresses, fridges, and washers removed and recycled per EPA guidelines across Cedar Ridge.', icon: 'shield', benefit: 'No landfill guilt' },
          { title: 'Construction + yard debris', description: 'Drywall, flooring, fencing, branches, and demo debris hauled — same-day in Hawthorne and Northridge.', icon: 'search', benefit: 'Job site cleared fast' },
          { title: 'Hot tub & shed removal', description: 'Demo and haul-away on hot tubs, sheds, swing sets, and play structures in Cedar Ridge — no power-tool noise on you.', icon: 'tool', benefit: 'Yard cleared safely' },
          { title: 'Estate & hoarder cleanout', description: 'Compassionate, sort-as-we-go estate and hoarder cleanouts in Hawthorne — donations photographed, receipts emailed.', icon: 'shield', benefit: 'Discreet and respectful' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 510+ neighbors picked HaulPro',
        heading: 'Tired of "junk haulers" who no-call, no-show, and dump it all?',
        subheading: 'Surprise upcharges, two-hour windows, and "we just landfill it all" end here.',
        items: [
          { title: 'Upfront flat pricing', description: 'Price texted before we leave the truck — based on volume in the truck, not how long we take or how heavy it is.' },
          { title: 'Donation-first sorting', description: 'We partner with 4 local charities. 60%+ of items get donated or recycled — and you get the receipts for taxes.' },
          { title: '2-hour arrival windows', description: 'Real-time text 30 minutes before arrival. No 8am–noon windows that ruin your day.' },
          { title: 'We do ALL the lifting', description: 'Attic, basement, third floor, behind the shed — we carry it all out. You point, we lift.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every pickup — included',
        heading: 'What your flat-rate price actually covers',
        subheading: 'Every quote we send to Riverbend, Oak Hill, and Cedar Ridge homes includes the work below — no hidden fees.',
        items: [
          'Same-day pickup in Riverbend, Oak Hill, Cedar Ridge, Hawthorne + Northridge',
          'All labor — we lift everything from anywhere on the property',
          'Loading, hauling, and proper disposal in one price',
          'Sweep-up after the load',
          'Donation drop-offs to 4 local charities',
          'Appliance + electronics recycling (EPA-compliant)',
          'Tax-deductible donation receipts emailed',
          'No deposit — pay only when junk is gone',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Stop tripping over it.',
        headline: 'Get a flat-rate quote in 15 minutes.',
        subheadline: 'Send a few photos or a quick description and we text you a flat-rate price — no in-home visit, no obligation.',
        ctaLabel: 'Get my free quote', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 510+ local customers say',
        subheading: 'Verified Google reviews from neighbors in Riverbend, Oak Hill, and Cedar Ridge.',
        testimonials: [
          { quote: 'Cleared out my late dad\'s Riverbend basement in 90 minutes — 30 years of stuff. Crew was kind, sorted donations vs. dump on the fly, and the price matched the texted quote exactly.', highlight: '30 years of stuff in 90 minutes', rating: 5, name: 'Allison P.', title: 'Riverbend resident' , avatarAsset: 'testimonialAvatar1', fallbackAsset: 'fallbackTestimonialAvatar1' },
          { quote: 'Three other Oak Hill haulers no-showed. HaulPro arrived in a 2-hour window, hauled an old hot tub plus 6 truckloads of garage junk, and donated half. Saved my weekend.', highlight: 'saved my weekend', rating: 5, name: 'Marcus B.', title: 'Oak Hill homeowner' , avatarAsset: 'testimonialAvatar2', fallbackAsset: 'fallbackTestimonialAvatar2' },
          { quote: 'Cedar Ridge construction cleanout — drywall, old cabinets, broken tile. Same-day pickup, fair flat rate, sweep-up included. Hiring them again on the next remodel.', highlight: 'fair flat rate, sweep-up included', rating: 5, name: 'Diana R.', title: 'Cedar Ridge contractor' , avatarAsset: 'testimonialAvatar3', fallbackAsset: 'fallbackTestimonialAvatar3' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent hauls in your neighborhood',
        subheading: 'Snapshots from Riverbend, Oak Hill, and Cedar Ridge — full trucks, empty driveways, satisfied customers.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Whole-basement cleanout in Riverbend — out in 90 minutes.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Garage + hot tub haul in Oak Hill — half donated, half recycled.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Construction debris pickup in Cedar Ridge — same-day, swept clean.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From cluttered to clear in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Send a photo or description', description: 'Submit the form with a couple photos or a quick list. We reply with a flat-rate quote in 15 minutes.' },
          { title: '2. Pick a 2-hour window', description: 'Same-day or next-day in most metro neighborhoods. We text 30 minutes before arrival.' },
          { title: '3. We point + lift', description: 'You point, we lift. Attic, basement, behind the shed — we carry it out, sort donate vs. dump.' },
          { title: '4. Pay when junk is gone', description: 'Sweep-up, final walk-through, then pay only when the load is on the truck. Donation receipts emailed.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Junk removal questions, answered straight',
        items: [
          { question: 'How fast can you come?', answer: 'Most Riverbend and Oak Hill pickups are same-day or next-day. We confirm a 2-hour window after we send your quote.' },
          { question: 'Are quotes really free?', answer: 'Yes — send a few photos or a description and we text a flat-rate quote in 15 minutes during business hours.' },
          { question: 'How is pricing calculated?', answer: 'Flat rate by volume in the truck (1/8 to full truckload). You see the price before we lift a thing — no surprise upcharges.' },
          { question: 'Do you really donate items?', answer: 'Yes — we partner with 4 local charities and donate or recycle 60%+ of every load. You get tax-deductible receipts.' },
          { question: 'What can\'t you take?', answer: 'Hazardous waste (paint, chemicals, asbestos) by law. We can recommend local drop-off options for those.' },
          { question: 'What neighborhoods do you serve?', answer: 'Riverbend, Oak Hill, Cedar Ridge, Hawthorne, Northridge, plus 25+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-day or next-day pickup for these communities — and 25+ surrounding neighborhoods.',
        areas: ['Riverbend','Oak Hill','Cedar Ridge','Hawthorne','Northridge','Stoneview','Lakeview','Maplebrook','Westbrook','Pinegrove','Glen Acres','Birch Park','Foxhill','Greenview','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our Upfront-Pricing Promise',
        headline: 'The price we text is the price you pay.',
        description: 'Every quote is flat-rate by volume — texted before we lift a thing. No surprise upcharges, no hourly billing tricks. If we miss something, we eat the cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your junk-removal quote in 15 minutes',
        subheading: 'Send a few photos or a quick description and we text a flat-rate price — same-day pickup in most metro neighborhoods.',
        ctaLabel: 'Request my free quote',
        urgency: 'Same-day slots in Riverbend & Oak Hill fill up by noon — book early',
        nextSteps: ['Send photos or list','We text a flat-rate quote in 15 min','We pick up + sweep + recycle'],
        guarantee: 'Free quotes • Upfront pricing • 60%+ donated/recycled',
        privacyNote: 'No spam — we only contact you about your pickup.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Locally owned, fully insured, and trusted by 510+ metro households since 2019.',
        phone: PHONE, email: 'help@haulprojunk.example',
        address: '247 Riverbend Way, [City] Metro, 90572',
        hours: 'Mon–Sun 7am–8pm',
        licenseLine: 'Licensed & insured $2M • EPA-compliant disposal • Background-checked techs',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-junk-removal-hero-01',
    differentiatorImage: 'demo-junk-removal-differentiator-01',
    checklistImage: 'demo-junk-removal-checklist-01',
    galleryImage1: 'demo-junk-removal-gallery-01',
    galleryImage2: 'demo-junk-removal-gallery-02',
    galleryImage3: 'demo-junk-removal-gallery-03',
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    testimonialAvatar1: 'demo-junk-removal-avatar-01',
    testimonialAvatar2: 'demo-junk-removal-avatar-02',
    testimonialAvatar3: 'demo-junk-removal-avatar-03',
    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo professional junk removal crew loading truck residential driveway',
    differentiatorImage: 'real photo two man junk hauler crew carrying furniture house cleanout',
    checklistImage: 'real photo junk removal team sorting donation items truck loading',
    galleryImage1: 'real photo full junk removal truck residential basement cleanout',
    galleryImage2: 'real photo old appliance hot tub haul away crew',
    galleryImage3: 'real photo construction debris drywall pickup truck job site',
    testimonialAvatar1: 'real photo professional headshot of happy junk-removal customer, woman late 30s, warm friendly smile, residential setting',
    testimonialAvatar2: 'real photo professional headshot of satisfied junk-removal customer, man early 40s, casual confident, daylight',
    testimonialAvatar3: 'real photo warm portrait of mature junk-removal repeat customer, woman 50s, natural light, trustworthy expression',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'jobType', type: 'select', label: 'What needs hauling?', placeholder: 'Select job type', required: false, options: ['Single item','Furniture / appliance','Garage / basement','Whole-house cleanout','Construction debris','Hot tub / shed'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for receipt)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: what needs to go? (Furniture, appliances, whole basement?) Include city/ZIP.', required: false },
  ],

  metadata: {
    name: 'Junk Removal Lead Gen',
    description: 'High-converting lead-gen page for full-service junk removal — same-day pickup, upfront flat pricing, 60%+ donated/recycled.',
    tags: ['junk-removal','hauling','cleanout','recycling','local-services','home-services','lead-gen'],
  },
};

export default spec;
