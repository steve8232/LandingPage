/**
 * v1-med-spa
 *
 * High-Converting Local Service blueprint for medical spa + aesthetics clinics.
 */

import { TemplateSpec } from './schema';

const BRAND = 'Glow Aesthetic Med Spa';
const PHONE = '(555) 559-0184';

const spec: TemplateSpec = {
  templateId: 'v1-med-spa',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'med-spa',
  theme: 'theme-wellness-warm',

  sections: [
    { type: 'AnnouncementBar', props: { text: '✨ MD-Supervised • Free Personalized Consultations • New-Client $99 First Treatment', phone: PHONE, hours: 'Tue–Sat 9am–7pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Book Free Consult', ctaHref: '#contact', navLinks: [
      { label: 'Treatments', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'MD-supervised • Master injectors • Serving Highland Park, Beacon Hill & 18+ neighborhoods',
        headline: 'Look like the best version of you — naturally, never overdone.',
        subheadline: 'Stop being talked into "package deals" by chains pushing volume. Our MD-supervised master injectors design a treatment plan that fits your face, your goals, and your timeline — starting with a free 30-minute consultation.',
        bullets: ['MD-supervised every visit — board-certified physician on staff','Master injector with 5,000+ Botox and filler treatments performed','Free 30-minute personalized consult — no pressure, no upsells'],
        proofPoints: ['4.9★ • 360+ reviews','MD-supervised','Master injector'],
        ctaLabel: 'Book my free consultation',
        formHeading: 'Tell us about your goals',
        formSubheading: 'Our patient coordinator replies within 1 hour during business hours.',
        trustBadge: '✓ Free consult, no deposit. New-client $99 first treatment available.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 362 reviews', icon: 'star' },
      { label: 'MD-supervised', detail: 'board-certified', icon: 'shield' },
      { label: 'Master injector', detail: '5,000+ treatments', icon: 'medal' },
      { label: 'Free consult', detail: '30-min personalized', icon: 'clock' },
      { label: 'Allergan partner', detail: 'Black Diamond practice', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Treatments designed around your face — not a menu',
        subheading: 'Every treatment plan is custom-built by a master injector under MD supervision — no cookie-cutter packages, no rushing.',
        services: [
          { title: 'Botox + Dysport', description: 'Forehead lines, crow\'s feet, and 11s smoothed naturally in Highland Park — never frozen, never overdone.', icon: 'wrench', benefit: 'Natural, refreshed look' },
          { title: 'Dermal fillers', description: 'Lip enhancement, cheek contour, and tear-trough work in Beacon Hill — Juvederm + Restylane, custom-mapped to your face.', icon: 'tool', benefit: 'Subtle volume restoration' },
          { title: 'Laser + skin rejuvenation', description: 'Morpheus8, IPL photofacial, and laser hair removal across Cedar Crest — for tone, texture, and sun damage.', icon: 'shield', benefit: 'Smoother, brighter skin' },
          { title: 'Medical-grade facials', description: 'HydraFacial, dermaplaning, and chemical peels in Brookline — same-day glow, no downtime.', icon: 'search', benefit: 'Glow before any event' },
          { title: 'Body contouring', description: 'CoolTone muscle stimulation and EmSculpt-NEO sessions in Beacon Hill — non-surgical fat reduction + muscle build.', icon: 'tool', benefit: 'Targeted, no downtime' },
          { title: 'Microneedling + PRP', description: 'Collagen-induction microneedling with optional PRP across Cedar Crest — softens scars, fine lines, and stretch marks.', icon: 'search', benefit: 'Smoother, firmer skin' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 360+ patients picked Glow',
        heading: 'Tired of feeling rushed, oversold, or "frozen"?',
        subheading: 'Chain-spa upsell pressure, 10-minute Botox visits, and overdone results that look done end here.',
        items: [
          { title: 'MD on-site, every visit', description: 'A board-certified physician supervises every treatment plan and is on-site during injectables. Not "consulted by phone".' },
          { title: 'Master injector — 5,000+ treatments', description: 'Our lead injector has performed 5,000+ Botox and filler treatments. Hand-selected for "natural results" technique training.' },
          { title: '30-minute free consultation', description: 'You get a real 30-minute consult, in person, with the injector — to understand goals, concerns, and budget. No pressure to book.' },
          { title: 'Custom plans, not packages', description: 'No "Botox party" volume specials. We design a plan that fits your face, your timeline, and your budget — even if that\'s "wait 6 months".' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every consult — included',
        heading: 'What your free consultation actually covers',
        subheading: 'Every consult we offer in Highland Park, Beacon Hill, and Cedar Crest includes the work below — no obligation, no pressure.',
        items: [
          'Free consult in Highland Park, Beacon Hill, Cedar Crest, Brookline + Maple Heights',
          '30-minute in-person time with a master injector',
          'MD-supervised assessment of your goals',
          'Custom treatment plan written for your face',
          'Honest pricing — no "package" upsell pressure',
          'Photo documentation for before/after tracking',
          'Allergan + Galderma partner pricing',
          'New-client $99 first treatment available',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Curious but cautious?',
        headline: 'Book your free 30-minute consultation today.',
        subheadline: 'A master injector + MD review your face, listen to your goals, and design a custom plan — at zero cost, zero obligation.',
        ctaLabel: 'Book my free consult', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 360+ patients say',
        subheading: 'Verified Google reviews from patients in Highland Park, Beacon Hill, and Cedar Crest.',
        testimonials: [
          { quote: 'Tried Botox at a Highland Park chain — looked frozen, hated it. Glow\'s injector took 30 minutes to map my face and used half the units. Look refreshed, not "done." Going back forever.', highlight: 'refreshed, not done', rating: 5, name: 'Mariana C.', title: 'Highland Park patient' , avatarAsset: 'testimonialAvatar1', fallbackAsset: 'fallbackTestimonialAvatar1' },
          { quote: 'Got tear-trough filler in Beacon Hill at 47 — 3 years of compliments, no one knows. The MD walked me through risks before booking. Felt like I was at a real medical practice.', highlight: '3 years of compliments', rating: 5, name: 'Diane W.', title: 'Beacon Hill patient' , avatarAsset: 'testimonialAvatar2', fallbackAsset: 'fallbackTestimonialAvatar2' },
          { quote: 'Morpheus8 for melasma in Cedar Crest — 4 sessions, brown patches gone. Other clinics pushed packages I didn\'t need. Glow custom-built a 4-treatment plan and it worked.', highlight: 'brown patches gone', rating: 5, name: 'Amara J.', title: 'Cedar Crest patient' , avatarAsset: 'testimonialAvatar3', fallbackAsset: 'fallbackTestimonialAvatar3' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent results from our practice',
        subheading: 'Snapshots from Highland Park, Beacon Hill, and Cedar Crest — natural-looking results, no overdone faces.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Highland Park Botox + filler — refreshed, never frozen.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Beacon Hill tear-trough + cheek contour — subtle, lasting result.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Cedar Crest Morpheus8 melasma reduction — 4-session plan.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From curious to confident in 4 steps',
        subheading: 'No phone tag, no pressure. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us your goals', description: 'Submit the form with what you\'d like to address (lines, lips, skin tone, sun damage). Patient coordinator replies in 1 hour.' },
          { title: '2. Free 30-min in-person consult', description: 'Master injector + MD assess your face, walk through options, and answer every question — no pressure to book.' },
          { title: '3. Custom plan + transparent pricing', description: 'You leave with a written plan and exact pricing. Take it home, sleep on it. No "today only" pressure.' },
          { title: '4. Treatment + follow-up', description: 'Treatment performed under MD supervision. We photo-document and check in at 2 weeks for touch-ups, included.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Aesthetic treatment questions, answered straight',
        items: [
          { question: 'How fast can I book a consult?', answer: 'Most Highland Park and Beacon Hill consults are scheduled within 5 business days. We always offer evening + Saturday slots.' },
          { question: 'Are consults really free?', answer: 'Yes — free 30-minute in-person consult with a master injector. No deposit, no obligation to book treatment.' },
          { question: 'Will I look frozen or "done"?', answer: 'No — our injectors are trained in "natural results" technique. We start conservative and you can add more later if desired.' },
          { question: 'Are treatments MD-supervised?', answer: 'Yes — a board-certified physician oversees every treatment plan and is on-site during injectables. Real medical practice.' },
          { question: 'What if I have a bad reaction?', answer: 'Reactions are extremely rare with skilled injectors, but our MD is on-site and on-call. We follow up at 2 weeks for touch-ups, included free.' },
          { question: 'What neighborhoods do you serve?', answer: 'Highland Park, Beacon Hill, Cedar Crest, Brookline, Maple Heights, plus 13+ surrounding metro neighborhoods.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Patients from across the metro',
        heading: 'Trusted by patients from these communities',
        subheading: 'Conveniently located off the highway — most patients arrive within 25 minutes.',
        areas: ['Highland Park','Beacon Hill','Cedar Crest','Brookline','Maple Heights','Stoneview','Lakeview','Cedar Hollow','Pinegrove','Glen Acres','Foxhill','Birch Park','Northridge','Hawthorne','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don’t see your neighborhood? Most patients drive 20–30 minutes. Worth the trip. Coverage spans [City] and surrounding [County].',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 2-Week Touch-Up Promise',
        headline: 'Not perfect at 2 weeks? Free touch-up.',
        description: 'Every Botox + filler treatment includes a complimentary 2-week follow-up. If anything is asymmetric or under-dosed, we touch it up at zero cost — guaranteed. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Book your free 30-minute consultation today',
        subheading: 'A master injector + MD assess your face, listen to your goals, and design a custom plan — zero cost, zero obligation, zero pressure.',
        ctaLabel: 'Book my free consult',
        urgency: 'Evening + Saturday slots fill up 2 weeks ahead — book early for fastest scheduling',
        nextSteps: ['Tell us your goals','Free 30-min consult with master injector','Custom plan + transparent pricing'],
        guarantee: 'Free consult • MD-supervised • 2-week touch-up included',
        privacyNote: 'No spam — your info stays HIPAA-compliant and confidential.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'MD-supervised aesthetics, master injector technique, and 360+ trusting patients since 2017.',
        phone: PHONE, email: 'patients@glowmedspa.example',
        address: '1408 Highland Park Ave, [City] Metro, 90168',
        hours: 'Tue–Sat 9am–7pm',
        licenseLine: 'MD-supervised • Board-certified physician on staff • Licensed master injector',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-med-spa-hero-01',
    differentiatorImage: 'demo-med-spa-differentiator-01',
    checklistImage: 'demo-med-spa-checklist-01',
    galleryImage1: 'demo-med-spa-gallery-01',
    galleryImage2: 'demo-med-spa-gallery-02',
    galleryImage3: 'demo-med-spa-gallery-03',
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    testimonialAvatar1: 'demo-med-spa-avatar-01',
    testimonialAvatar2: 'demo-med-spa-avatar-02',
    testimonialAvatar3: 'demo-med-spa-avatar-03',
    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo modern medical spa interior calm aesthetic clinic master injector consultation',
    differentiatorImage: 'real photo aesthetic injector botox filler treatment professional female patient',
    checklistImage: 'real photo med spa consultation room patient face mapping injector',
    galleryImage1: 'real photo natural botox before after refreshed female face',
    galleryImage2: 'real photo dermal filler lip cheek subtle natural before after',
    galleryImage3: 'real photo morpheus8 hydrafacial skin rejuvenation glow before after',
    testimonialAvatar1: 'real photo professional headshot of happy med-spa customer, woman late 30s, warm friendly smile, residential setting',
    testimonialAvatar2: 'real photo professional headshot of satisfied med-spa customer, man early 40s, casual confident, daylight',
    testimonialAvatar3: 'real photo warm portrait of mature med-spa repeat customer, woman 50s, natural light, trustworthy expression',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'treatmentType', type: 'select', label: 'Treatment of interest?', placeholder: 'Select treatment', required: false, options: ['Botox / Dysport','Dermal fillers','Laser / IPL','Microneedling / PRP','Hydrafacial / peels','Body contouring'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for confirmations)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: what would you like to address? (Lines, lips, skin tone, etc.)', required: false },
  ],

  metadata: {
    name: 'Med Spa Lead Gen',
    description: 'High-converting lead-gen page for medical spa + aesthetics — MD-supervised, master injector, free 30-minute consult, natural results.',
    tags: ['med-spa','aesthetics','botox','filler','laser','wellness','luxury','lead-gen'],
  },
};

export default spec;
