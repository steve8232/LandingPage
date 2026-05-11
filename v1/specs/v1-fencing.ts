/**
 * v1-fencing
 *
 * High-Converting Local Service blueprint for fence installers and repair contractors.
 */

import { TemplateSpec } from './schema';

const BRAND = 'IronGate Fence Co.';
const PHONE = '(555) 481-2940';

const spec: TemplateSpec = {
  templateId: 'v1-fencing',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'fencing',
  theme: 'theme-home-services-blue',

  sections: [
    { type: 'AnnouncementBar', props: { text: '🪵 Free On-Site Estimates • Concrete-Set Posts on Every Install • 12+ Years Local', phone: PHONE, hours: 'Mon–Sat 7am–6pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Get Free Estimate', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Wood, vinyl, aluminum, chain-link • Concrete-set posts • Serving Oakridge, Stonewood & 30+ neighborhoods',
        headline: 'A fence that stays straight for 20 years. Quoted free, today.',
        subheadline: 'Stop chasing fence guys who set posts in dirt and disappear after the deposit. Our crews concrete-set every post, dig under the frost line, and back every install with a 10-year structural warranty.',
        bullets: ['Free in-home estimate with custom 3D yard sketch','Concrete-set posts to 36" — never dirt-pack','10-year structural warranty in writing on every install'],
        proofPoints: ['4.9★ • 360+ reviews','Licensed & insured','10-year warranty'],
        ctaLabel: 'Get my free fence estimate',
        formHeading: 'Tell us about your yard',
        formSubheading: 'A real estimator replies within 30 minutes during business hours.',
        trustBadge: '✓ Free estimates. No deposit until materials arrive. Most installs in 7–10 days.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 364 reviews', icon: 'star' },
      { label: 'Licensed & insured', detail: 'License #FN-21847', icon: 'shield' },
      { label: '12+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Free estimates', detail: 'in-home + 3D sketch', icon: 'clock' },
      { label: 'BBB A+', detail: 'accredited since 2014', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Fences we build, repair, and stand behind',
        subheading: 'A real estimator walks your yard, marks the line, calls 811 for utilities, and writes a fixed quote with a 3D sketch.',
        services: [
          { title: 'Wood privacy fences', description: 'Cedar or pressure-treated 6\' privacy in Oakridge — concrete-set posts, dog-eared or flat top, 10-year warranty.', icon: 'wrench', benefit: 'Privacy in 7 days' },
          { title: 'Vinyl & composite', description: 'Maintenance-free white vinyl panels in Stonewood — never paint, never rot, lifetime material warranty.', icon: 'tool', benefit: 'No painting, ever' },
          { title: 'Aluminum & ornamental', description: 'Powder-coated aluminum pool fencing and ornamental yard fences — meets local pool code in Lakeview.', icon: 'shield', benefit: 'Pool-code compliant' },
          { title: 'Chain-link & repairs', description: 'Galvanized or vinyl-coated chain-link, plus storm-damage repairs and gate rehangs for any fence type.', icon: 'search', benefit: 'Yard secure today' },
          { title: 'Gates & automatic openers', description: 'Custom wood, steel, or aluminum gates with optional auto-openers, keypads, and cell-phone control across Lakeview.', icon: 'tool', benefit: 'Drive-through entry' },
          { title: 'Decorative & farm fencing', description: 'Split-rail, picket, post-and-rail, and welded-wire fencing for Stonewood acreage and front-yard accents.', icon: 'search', benefit: 'Curb-appeal fencing' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 360+ neighbors picked IronGate',
        heading: 'Tired of fence guys who skip the concrete?',
        subheading: 'Posts that lean after one winter, gates that drag, and "free" estimates that turn into 4-week ghost-jobs end here.',
        items: [
          { title: 'Concrete-set posts to 36"', description: 'Every post sits in a 60-lb concrete bag, set below the frost line. We do not "dirt-pack" — ever.' },
          { title: '811 dial + permits handled', description: 'We dial 811 for utility locates, pull HOA and city permits, and meet inspectors so you do not have to.' },
          { title: 'In-house crew, foreman daily', description: 'IronGate employees on every job — no day labor, no subcontractor mystery. Foreman walks the line each morning.' },
          { title: '10-year structural warranty', description: 'If a post leans or a panel fails inside 10 years, we come back and reset it free. In writing, every install.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every install — included',
        heading: 'What your free fence estimate actually covers',
        subheading: 'Every quote we send to Oakridge, Stonewood, Lakeview, Brookmill, and Pinegrove homes includes the work below.',
        items: [
          'Free on-site estimate in Oakridge, Stonewood, Lakeview, Brookmill + Pinegrove',
          '3D yard sketch + line walk-through',
          '811 utility dial + HOA permit handling',
          'Concrete-set posts (60 lbs/post min)',
          'Galvanized hardware on every gate',
          'Daily site cleanup + final walk-through',
          '10-year structural warranty',
          'Stain or seal upgrade options on wood fences',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Done with leaning posts and dragging gates?',
        headline: 'Your free fence estimate is one call away.',
        subheadline: 'Tell us about your yard and we book a same-week walk-through in Oakridge, Stonewood or Lakeview — written quote, 3D sketch.',
        ctaLabel: 'Get my free estimate', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 360+ local homeowners say',
        subheading: 'Verified Google reviews from neighbors in Oakridge, Stonewood, and Lakeview.',
        testimonials: [
          { quote: 'Got 5 fence quotes in Oakridge — IronGate was the only crew that mentioned frost depth and concrete. 3 winters later, every post still plumb. Worth every penny.', highlight: 'still plumb 3 winters later', rating: 5, name: 'Megan O.', title: 'Oakridge homeowner' },
          { quote: 'Vinyl pool fence in Stonewood — passed inspection first try, looks better than our neighbor\'s install from last year. Crew was polite and tidy every day.', highlight: 'passed inspection first try', rating: 5, name: 'Carlos R.', title: 'Stonewood homeowner' },
          { quote: 'Storm took out 40 feet of fence in Lakeview. IronGate had a quote in 24 hours and a new fence in 4 days — including hauling away the old one. Saved my sanity.', highlight: 'new fence in 4 days', rating: 5, name: 'Tina L.', title: 'Lakeview homeowner' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent fences in your neighborhood',
        subheading: 'Snapshots from Oakridge, Stonewood, and Lakeview — straight lines, plumb posts, tidy yards.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: '6\' cedar privacy fence in Oakridge — concrete-set, dog-eared top, sealed.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'White vinyl pool fence in Stonewood — pool-code compliant, lifetime material warranty.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Aluminum ornamental fence in Lakeview — powder-coated black, no rust ever.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From bare yard to finished fence in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us about your yard', description: 'Submit the form or call. A real human in our Oakridge office picks up in under 2 minutes.' },
          { title: '2. Free on-site estimate + 3D sketch', description: 'Estimator walks the line, calls 811, and emails a fixed quote with a 3D yard sketch within 48 hours.' },
          { title: '3. We pull permits + schedule', description: 'HOA approval and city permit handled by us. Install date locked in writing with a 10% deposit.' },
          { title: '4. We dig, concrete, install, clean up', description: 'Posts set in concrete to 36", panels hung straight, gates squared, and the yard left tidier than we found it.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Fence questions, answered straight',
        items: [
          { question: 'How fast can you install?', answer: 'Most Oakridge and Stonewood fence installs happen 7–10 days after estimate approval. Storm-damage repairs typically same-week.' },
          { question: 'Are estimates really free?', answer: 'Yes — free on-site estimate plus a 3D yard sketch. No deposit until materials are delivered.' },
          { question: 'Do you set posts in concrete?', answer: 'Always. Every post sits in 60+ lbs of concrete, dug below the frost line. No "dirt-pack" jobs, ever.' },
          { question: 'Do you handle HOA + permits?', answer: 'We dial 811 for utilities, submit HOA paperwork, and pull city permits. We even meet the inspector for you.' },
          { question: 'What is your warranty?', answer: '10 years on workmanship — if a post leans or a panel fails, we reset it free. Vinyl panels carry a lifetime material warranty from the manufacturer.' },
          { question: 'What neighborhoods do you serve?', answer: 'Oakridge, Stonewood, Lakeview, Brookmill, Pinegrove, plus 25+ surrounding metro neighborhoods. Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-week coverage for these communities — and 25+ surrounding neighborhoods.',
        areas: ['Oakridge','Stonewood','Lakeview','Brookmill','Pinegrove','Hilltop','Westbrook','Cedar Hollow','Maple Ridge','Birch Park','Foxhill','Sunnyside','Ashbury','Riverside Hills','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 10-Year Structural Promise',
        headline: 'If a post leans or a panel fails — we make it right, free.',
        description: 'Every install carries a 10-year written structural warranty. If anything we built leans, sags, or fails inside that window, we come back and reset it at zero cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free fence estimate + 3D sketch',
        subheading: 'Tell us about your yard and we book a same-week walk-through, dial 811, and send a fixed quote with a 3D sketch.',
        ctaLabel: 'Request my free estimate',
        urgency: 'Spring/summer install slots in Oakridge & Stonewood fill quickly — book early',
        nextSteps: ['Share a few details','We confirm timing + 3D sketch + fixed quote','We dig, concrete-set, install, clean up'],
        guarantee: 'Free estimates • 10-year warranty • Concrete-set posts',
        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Locally owned, licensed, and trusted by 360+ metro homeowners since 2013.',
        phone: PHONE, email: 'help@irongatefence.example',
        address: '358 Oakridge Ln, [City] Metro, 90521',
        hours: 'Mon–Sat 7am–6pm',
        licenseLine: 'License #FN-21847 • $2M insured • 811 partner',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-fencing-hero-01',
    differentiatorImage: 'demo-fencing-differentiator-01',
    checklistImage: 'demo-fencing-checklist-01',
    galleryImage1: 'demo-fencing-gallery-01',
    galleryImage2: 'demo-fencing-gallery-02',
    galleryImage3: 'demo-fencing-gallery-03',
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
    heroImageId: 'real photo professional fence installer building cedar privacy fence backyard',
    differentiatorImage: 'real photo fence crew foreman with measuring tape concrete bag posts',
    checklistImage: 'real photo fence post hole digger concrete setting clean job site',
    galleryImage1: 'real photo new cedar privacy fence backyard residential straight line',
    galleryImage2: 'real photo white vinyl pool fence backyard pool deck installation',
    galleryImage3: 'real photo black aluminum ornamental fence yard powder coated',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'projectType', type: 'select', label: 'What kind of fence?', placeholder: 'Select project type', required: false, options: ['Wood privacy','Vinyl','Aluminum','Chain link','Repair / replace boards','Gate / opener'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: wood, vinyl, aluminum, or repair? (Include city/ZIP and approx. linear feet)', required: false },
  ],

  metadata: {
    name: 'Fencing Lead Gen',
    description: 'High-converting lead-gen page for fence installers — free estimates with 3D sketch, concrete-set posts, 10-year warranty.',
    tags: ['fencing','fence-installation','privacy-fence','vinyl-fence','local-services','home-services','lead-gen'],
  },
};

export default spec;
