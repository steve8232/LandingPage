/**
 * v1-plumber
 *
 * High-Converting Local Service blueprint for residential & light-commercial
 * plumbers. 16-section flow: AnnouncementBar -> StickyHeader -> HeroLeadForm
 * -> TrustStrip -> ServiceList -> DifferentiatorBlock -> ChecklistSection
 * -> MidPageCTA -> TestimonialsCards -> PhotoGalleryStrip -> ProcessSteps
 * -> FAQAccordion -> ServiceAreas -> GuaranteeBar -> FinalCTA -> Footer.
 */

import { TemplateSpec } from './schema';

const BRAND = 'Aqua Pro Plumbing';
const PHONE = '(555) 412-7700';

const spec: TemplateSpec = {
  templateId: 'v1-plumber',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'plumber',
  theme: 'theme-home-services-blue',

  sections: [
    {
      type: 'AnnouncementBar',
      props: {
        text: '⚡ 2-Hour Response Window • Free Quotes • 12+ Years Serving the Metro',
        phone: PHONE,
        hours: 'Open now • 24/7 emergency',
      },
    },
    {
      type: 'StickyHeader',
      props: {
        brandName: BRAND,
        phone: PHONE,
        ctaLabel: 'Get Free Quote',
        ctaHref: '#contact',
        navLinks: [
          { label: 'Services', href: '#services' },
          { label: 'Why Us', href: '#why' },
          { label: 'Reviews', href: '#reviews' },
          { label: 'FAQ', href: '#faq' },
          { label: 'Contact', href: '#contact' },
        ],
      },
    },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: '24/7 emergency • Up-front pricing • Licensed & insured in Lakeside, Riverside & 35+ neighborhoods',
        headline: 'Hot water today. Dry floors tonight.',
        subheadline:
          'Stop guessing whether the next plumber will show up. Our techs arrive in under 2 hours, quote a flat price before any wrench turns, and clean up before they leave.',
        bullets: [
          'Same-day appointments — even Sundays in Maple Heights',
          'Flat-rate quotes in writing — no hourly surprises',
          '2-year warranty on every part and every minute of labor',
        ],
        proofPoints: ['4.9★ • 600+ reviews', 'Licensed & insured', '2-hr response'],
        ctaLabel: 'Get my free quote in 30 mins',
        formHeading: 'Tell us what is going on',
        formSubheading: 'Reply within 15 minutes during business hours.',
        trustBadge: '✓ No obligation. Most quotes returned in under 30 minutes.',
        imageAsset: 'heroImageId',
        fallbackAsset: 'fallbackHeroImageId',
      },
    },
    {
      type: 'TrustStrip',
      props: {
        items: [
          { label: '4.9★ Google', detail: 'from 612 reviews', icon: 'star' },
          { label: 'Licensed & insured', detail: 'Master plumber #PL-48219', icon: 'shield' },
          { label: '12+ years', detail: 'serving the metro', icon: 'medal' },
          { label: '2-hour response', detail: 'on emergency calls', icon: 'clock' },
          { label: 'BBB A+ rated', detail: 'accredited since 2014', icon: 'badge' },
        ],
      },
    },
    {
      type: 'ServiceList',
      props: {
        heading: 'What we fix — and how fast in your neighborhood',
        subheading:
          'Tell us what is wrong and we recommend the cheapest fix that actually lasts, with a flat price you approve before we start.',
        services: [
          { title: 'Emergency leaks & burst pipes', description: 'Stop the damage in under 60 minutes — even at 2 AM in Riverside.', icon: 'wrench', benefit: 'Stop the flood today' },
          { title: 'Drain cleaning & sewer service', description: 'Camera inspections plus targeted clears so it stays clear for 12+ months.', icon: 'tool', benefit: 'Flow restored same day' },
          { title: 'Water heaters (tank + tankless)', description: 'Repairs, replacements, and same-day install on most models in Maple Heights.', icon: 'shield', benefit: 'Hot showers back tonight' },
          { title: 'Fixtures, faucets & toilets', description: 'Clean swaps and upgrades with no-mess workmanship and a tidy walkthrough.', icon: 'search', benefit: 'Looks new, works new' },
          { title: 'Sewer line & main repair', description: 'Trenchless main-line replacement and pipe-bursting in Sunset Park — most yards saved, most jobs done in one day.', icon: 'tool', benefit: 'Restored without trenching' },
          { title: 'Sump pumps & re-pipes', description: 'Sump pump install with battery backup, plus whole-home re-pipes for older Oak Grove homes — no more rust water.', icon: 'shield', benefit: 'Dry basement, lasting peace' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 600+ neighbors picked us',
        heading: 'Tired of the plumber merry-go-round?',
        subheading: 'No-shows, vague quotes, and floors trashed by muddy boots end here. This is what working with our crew actually looks like in Lakeside and Sunset Park.',
        items: [
          { title: 'No "we will call you back"', description: 'A real person answers in under 90 seconds, 24/7. We confirm your slot in writing within 15 minutes.' },
          { title: 'Flat prices, in writing', description: 'You see the total before any work starts. No "we hit a snag" upcharges, ever.' },
          { title: 'Floors covered, boots off', description: 'Drop cloths, shoe covers, and a full cleanup walkthrough every visit. Your house looks better when we leave.' },
          { title: 'Master-plumber owned', description: '12+ years, 600+ reviews, and a 2-year warranty backing every job we sign.' },
        ],
        imageAsset: 'differentiatorImage',
        fallbackAsset: 'fallbackDifferentiatorImage',
        imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every visit — included',
        heading: 'Here is exactly what your $0 quote covers',
        subheading: 'No fine print. Every flat-rate price you approve includes the items below — even on a $99 drain clear.',
        items: [
          'Same-day arrival window in Lakeside, Riverside, Maple Heights, Oak Grove + Sunset Park',
          'Flat-rate quote in writing before any work',
          'Drop cloths and shoe covers on every floor',
          'Camera or visual diagnosis included',
          'Full cleanup + photo walkthrough when complete',
          '2-year parts and labor warranty',
          'Master-plumber sign-off on every job',
          'Up-front parts pricing — no markups over 15%',
        ],
        imageAsset: 'checklistImage',
        fallbackAsset: 'fallbackChecklistImage',
        imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Stop guessing. Start fixing.',
        headline: 'Your free quote is 30 minutes away.',
        subheadline: 'Tell us what is going on and we lock in a same-day slot for Lakeside, Riverside or Maple Heights — flat price, no surprises.',
        ctaLabel: 'Get my free quote',
        ctaHref: '#contact',
        secondaryText: `or call ${PHONE}`,
      },
    },


    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 600+ local homeowners say',
        subheading: 'Fast response, fair pricing, work that holds up — verified Google reviews from the metro.',
        testimonials: [
          { quote: 'Burst pipe at 11 PM in Lakeside and they had a tech in my kitchen by midnight. Saved my hardwood floors and my weekend.', highlight: 'saved my hardwood floors', rating: 5, name: 'Robert M.', title: 'Lakeside homeowner' , avatarAsset: 'testimonialAvatar1', fallbackAsset: 'fallbackTestimonialAvatar1' },
          { quote: 'Quoted exactly what I paid — $389 flat for a tankless install in Riverside. No upsell, no surprises. Will absolutely call them again.', highlight: 'no surprises', rating: 5, name: 'Jennifer H.', title: 'Riverside property manager' , avatarAsset: 'testimonialAvatar2', fallbackAsset: 'fallbackTestimonialAvatar2' },
          { quote: 'Replaced our water heater in three hours, cleaned up better than the install crew. 12 years in Maple Heights and these are the best plumbers we have hired.', highlight: 'cleaned up better', rating: 5, name: 'Tom R.', title: 'Maple Heights repeat customer' , avatarAsset: 'testimonialAvatar3', fallbackAsset: 'fallbackTestimonialAvatar3' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent jobs in your neighborhood',
        subheading: 'Snapshots from Lakeside, Riverside, and Sunset Park — the cleanliness and craftsmanship you can expect.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Tankless water heater install in Lakeside — labeled shut-offs, tidy walkthrough.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Re-piped under-sink in Riverside — sealed surfaces, full cleanup.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Sewer camera + targeted clear in Maple Heights — flow restored same day.' },
        ],
      },
    },
    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From burst pipe to dry floors in 4 steps',
        subheading: 'No phone tag, no chasing. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. You tell us what is going on', description: 'Submit the form or call. A real human in our Riverside office picks up in under 90 seconds.' },
          { title: '2. We lock in a same-day slot', description: 'Confirmed in writing within 15 minutes — with the tech name, ETA, and flat-rate quote.' },
          { title: '3. We diagnose + you approve', description: 'Drop cloths down, camera or visual check, and a single flat price for you to approve.' },
          { title: '4. We fix it and clean up', description: 'Repair done, photo walkthrough, full cleanup, and a 2-year warranty in your inbox.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Plumbing questions, answered straight',
        subheading: 'Quick answers to the questions Lakeside and Riverside homeowners ask us most.',
        items: [
          { question: 'How fast can you actually get to me?', answer: 'On 92% of emergency calls in Lakeside, Riverside, and Maple Heights we have a tech on-site in under 2 hours — including nights and weekends.' },
          { question: 'Do you charge for quotes or diagnostics?', answer: 'No. Standard quotes are 100% free. For complex jobs needing a camera scope we waive the $79 diagnostic if you book the repair.' },
          { question: 'Are you licensed and insured?', answer: 'Yes — master-plumber owned (License #PL-48219) and fully insured up to $2M. We send proof with every quote.' },
          { question: 'What if the price changes mid-job?', answer: 'It does not. Every job is a flat rate you approve in writing before any wrench turns. If we miss something, we eat the difference.' },
          { question: 'Do you guarantee your work?', answer: 'Every part and every minute of labor is covered for 2 full years. If anything fails in that window we come back free.' },
          { question: 'What neighborhoods do you serve?', answer: 'We service Lakeside, Riverside, Maple Heights, Oak Grove, Sunset Park, and 30+ surrounding metro neighborhoods. Not sure? Just ask in the form.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Local crews, local routes',
        heading: 'Proudly serving the metro every day',
        subheading: 'Same-day coverage for these communities — and 30+ surrounding neighborhoods.',
        areas: [
          'Lakeside', 'Riverside', 'Maple Heights', 'Oak Grove', 'Sunset Park',
          'Harbor Point', 'Pine Ridge', 'Cedar Hills', 'Brookside', 'Westmont',
          'East Village', 'North Park', 'Bayview', 'Glen Acres',
        ,'[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your [Neighborhood]? We cover [City] and surrounding [County] — just ask.',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 2-Year Promise',
        headline: 'If it leaks, breaks, or backs up — we make it right, free.',
        description: 'Every job carries a written 2-year warranty on parts and labor. If anything we touched fails, we come back the same day at zero cost. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Get your free plumbing quote in 30 minutes',
        subheading: 'Tell us what is going on and we reply fast with availability, options, and a flat price you can approve before we start.',
        ctaLabel: 'Request my free quote',
        urgency: 'Same-day slots in Lakeside & Riverside fill quickly — book early',
        nextSteps: ['Share a few details', 'We confirm timing + flat price', 'We show up, fix it, and clean up'],
        guarantee: 'Up-front pricing • 2-year warranty • Master-plumber owned',
        privacyNote: 'No spam — we only contact you about your request.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Master-plumber-owned. Licensed, insured, and trusted by 600+ metro homeowners since 2013.',
        phone: PHONE,
        email: 'help@aquaproplumbing.example',
        address: '4218 Riverside Ave, [City] Metro, 90217',
        hours: 'Open 24/7 for emergencies',
        licenseLine: 'License #PL-48219 • Fully insured up to $2M',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-plumber-hero-01',
    differentiatorImage: 'demo-plumber-differentiator-01',
    checklistImage: 'demo-plumber-checklist-01',
    galleryImage1: 'demo-plumber-gallery-01',
    galleryImage2: 'demo-plumber-gallery-02',
    galleryImage3: 'demo-plumber-gallery-03',

    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',

    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    testimonialAvatar1: 'demo-plumber-avatar-01',
    testimonialAvatar2: 'demo-plumber-avatar-02',
    testimonialAvatar3: 'demo-plumber-avatar-03',
    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo plumber repairing kitchen sink residential home',
    differentiatorImage: 'real photo professional plumber smiling with toolbox in customer home',
    checklistImage: 'real photo plumber installing water heater clean utility room',
    galleryImage1: 'real photo tankless water heater installation clean labeled pipes',
    galleryImage2: 'real photo plumber under sink repair copper fittings tidy work',
    galleryImage3: 'real photo sewer drain camera inspection plumber van',
    testimonialAvatar1: 'real photo professional headshot of happy plumber customer, woman late 30s, warm friendly smile, residential setting',
    testimonialAvatar2: 'real photo professional headshot of satisfied plumber customer, man early 40s, casual confident, daylight',
    testimonialAvatar3: 'real photo warm portrait of mature plumber repeat customer, woman 50s, natural light, trustworthy expression',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'issueType', type: 'select', label: 'What type of issue?', placeholder: 'Select issue type', required: false, options: ['Leak / burst pipe','Drain or sewer clog','Water heater','Fixture install','Re-pipe / repair','Other'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for the quote)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: what is going on? (Include city/ZIP and any deadlines)', required: false },
  ],

  metadata: {
    name: 'Plumber Lead Gen',
    description:
      'High-converting lead-gen landing page for residential and emergency plumbers. ' +
      'Above-the-fold quote form, trust strip, differentiator, mid-page CTA, FAQ, ' +
      'service areas, guarantee bar, and footer.',
    tags: ['plumber', 'plumbing', 'local-services', 'home-services', 'lead-gen', 'emergency'],
  },
};

export default spec;
