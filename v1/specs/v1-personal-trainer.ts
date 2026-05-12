/**
 * v1-personal-trainer
 *
 * High-Converting Local Service blueprint for personal trainers + small-group studios.
 */

import { TemplateSpec } from './schema';

const BRAND = 'IronCore Personal Training';
const PHONE = '(555) 612-0455';

const spec: TemplateSpec = {
  templateId: 'v1-personal-trainer',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'personal-trainer',
  theme: 'theme-fitness-bold',

  sections: [
    { type: 'AnnouncementBar', props: { text: '💪 NSCA-Certified Coaches • Free 60-Min Strategy Session • First Month $99', phone: PHONE, hours: 'Mon–Sat 5am–9pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Book Free Session', ctaHref: '#contact', navLinks: [
      { label: 'Programs', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'NSCA-certified coaches • Programs built for your body • Serving Eastside, Riverwest & 14+ neighborhoods',
        headline: 'Drop 20 lbs and 4 inches off your waist — by Labor Day.',
        subheadline: 'Stop spinning your wheels with random workouts and "75 hard." Our NSCA-certified coaches build a strength + nutrition program around your body, your schedule, and your goal — and we hold you accountable every week.',
        bullets: ['1-on-1 NSCA-certified coach — not a 22-year-old with an Instagram','Custom strength + nutrition plan tuned to your body and life','Weekly accountability check-ins + measurable progress every 4 weeks'],
        proofPoints: ['4.9★ • 220+ reviews','NSCA-certified','Avg. 18 lbs in 90 days'],
        ctaLabel: 'Book my free strategy session',
        formHeading: 'Tell us about your goals',
        formSubheading: 'A real coach replies within 1 hour during business hours.',
        trustBadge: '✓ Free 60-min strategy session — InBody scan + custom plan, no charge.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9★ Google', detail: 'from 224 reviews', icon: 'star' },
      { label: 'NSCA-certified', detail: 'CSCS coaches', icon: 'shield' },
      { label: '8+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'Avg. 18 lbs', detail: 'lost in 90 days', icon: 'clock' },
      { label: '500+ transformations', detail: 'real before/afters', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Programs built for real bodies and real lives',
        subheading: 'Every program is custom-designed by an NSCA-CSCS coach — no generic templates, no "WOD of the day".',
        services: [
          { title: '1-on-1 personal training', description: 'Private coaching in our Eastside studio — custom strength program, nutrition plan, and weekly check-ins for $299/mo.', icon: 'wrench', benefit: 'Fastest results' },
          { title: 'Small-group strength', description: '4-person Riverwest classes — coached programming, real progressive overload, no random Crossfit-style workouts.', icon: 'tool', benefit: 'Affordable + accountable' },
          { title: 'Nutrition coaching', description: 'Macro-based plans across Highland — no shakes, no detoxes, just food you actually eat with weekly accountability.', icon: 'shield', benefit: 'No more "diet" yo-yo' },
          { title: '90-day transformation', description: 'Eastside\'s "drop 15+ lbs in 90 days" sprint — InBody scans, weekly photos, daily accountability, and a finish line.', icon: 'search', benefit: 'Measurable transformation' },
          { title: 'Online + hybrid coaching', description: 'Custom programs in our app for travel weeks across Eastside — workouts, check-ins, and video form-review on demand.', icon: 'tool', benefit: 'Coaching that travels with you' },
          { title: 'Athletic + sport conditioning', description: 'Sport-specific speed, agility, and strength programs for Riverwest high-school and adult athletes — measurable PR gains.', icon: 'search', benefit: 'Win the next season' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 220+ members picked IronCore',
        heading: 'Tired of "trainers" who count reps, post selfies, and never check on you?',
        subheading: 'Cookie-cutter "12-week programs," 22-year-old coaches reading from an iPad, and "diets" that fail the moment you go on vacation end here.',
        items: [
          { title: 'NSCA-CSCS coaches', description: 'Every coach holds the NSCA-Certified Strength & Conditioning Specialist credential — the gold-standard cert. Not a weekend Instagram course.' },
          { title: 'Custom-built programs', description: 'Your program is written for your body and goals — assessed via InBody scan, FMS movement screen, and a real conversation about your life.' },
          { title: 'Weekly accountability', description: 'You get a weekly check-in (text or video). Off track? We adjust the plan that day. No "see you in 3 months".' },
          { title: 'Measurable progress every 4 weeks', description: 'Re-scan with InBody every 4 weeks. Body fat, lean mass, strength PRs — all tracked and visible. No guessing.' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every program — included',
        heading: 'What your free strategy session actually covers',
        subheading: 'Every free session we run for Eastside, Riverwest, and Highland clients includes the work below — no obligation, no pitch.',
        items: [
          'Free strategy session in Eastside, Riverwest, Highland, Cedar Park + Maple Heights',
          '60-minute in-person assessment + InBody scan',
          'FMS movement screen + injury history review',
          'Custom 4-week strength + nutrition outline',
          'Honest answer: are you a fit for our program or not',
          'No high-pressure sales — sleep on it, decide later',
          'First month $99 if you join (vs. $299 standard)',
          'Cancel any time — no annual contracts',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Done starting and stopping?',
        headline: 'Book your free 60-minute strategy session today.',
        subheadline: 'Our head coach assesses your body, listens to your goals, and writes a custom 4-week outline — at zero cost, zero obligation.',
        ctaLabel: 'Book my free session', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 220+ members say',
        subheading: 'Verified Google reviews from members in Eastside, Riverwest, and Highland.',
        testimonials: [
          { quote: 'Down 24 lbs and 5 inches off the waist in 90 days at the Eastside studio. Two prior trainers and two diets failed me. The accountability check-ins were the difference. First time I finished a program.', highlight: '24 lbs in 90 days', rating: 5, name: 'Curtis B.', title: 'Eastside member' , avatarAsset: 'testimonialAvatar1', fallbackAsset: 'fallbackTestimonialAvatar1' },
          { quote: 'Riverwest small-group classes — I\'m 52 and stronger than I was at 30. Coach modified everything around my old shoulder injury. Sane, progressive, no Crossfit nonsense. Bought 12 months upfront.', highlight: 'stronger than at 30', rating: 5, name: 'Tonya M.', title: 'Riverwest member' , avatarAsset: 'testimonialAvatar2', fallbackAsset: 'fallbackTestimonialAvatar2' },
          { quote: 'I have hated working out my whole life. Highland coach built a 30-min/3x-week plan I can actually do. Lost 11 lbs by month 2 — and I no longer dread Sunday meal prep.', highlight: '11 lbs by month 2', rating: 5, name: 'Sebastian L.', title: 'Highland member' , avatarAsset: 'testimonialAvatar3', fallbackAsset: 'fallbackTestimonialAvatar3' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent member transformations',
        subheading: 'Snapshots from Eastside, Riverwest, and Highland — real members, real numbers, real before/afters.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: '24 lbs in 90 days — Eastside member, 1-on-1 coaching.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Riverwest small-group strength — 52, stronger than at 30.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Highland nutrition + 30-min plan — 11 lbs in 2 months.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From "starting Monday" to finishing the program in 4 steps',
        subheading: 'No phone tag, no pressure. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us your goals', description: 'Submit the form with your goal (lose X lbs, get stronger, fit back in jeans). A real coach replies in 1 hour.' },
          { title: '2. Free 60-min strategy session', description: 'In-person assessment + InBody scan + FMS movement screen. Honest answer on whether we fit your goals.' },
          { title: '3. Custom 4-week plan', description: 'You leave with a written 4-week strength + nutrition outline. Take it home, decide later \u2014 no pressure to sign.' },
          { title: '4. Train + measure progress', description: 'Weekly check-ins, monthly InBody re-scans, and a real coach in your corner. Cancel any time.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Personal training questions, answered straight',
        items: [
          { question: 'How fast can I start?', answer: 'Most Eastside and Riverwest members start training within 1 week of the strategy session. Evening and 5am slots available.' },
          { question: 'Is the strategy session really free?', answer: 'Yes \u2014 free 60-minute in-person assessment with a head coach. InBody scan + 4-week outline included. No deposit, no obligation.' },
          { question: 'I\u2019m totally out of shape \u2014 will I be able to keep up?', answer: 'Yes. Every program is built around your current fitness, schedule, and any injuries. We start where you are, not where Instagram says you should be.' },
          { question: 'Are your coaches actually certified?', answer: 'Yes \u2014 every coach holds NSCA-CSCS, the gold-standard strength + conditioning credential. Not a weekend course or Instagram cert.' },
          { question: 'What if it\u2019s not working?', answer: 'Weekly check-ins catch this in week 1, not month 3. We adjust the plan that day. And there are no annual contracts \u2014 cancel any time.' },
          { question: 'What neighborhoods do you serve?', answer: 'Eastside, Riverwest, Highland, Cedar Park, Maple Heights, plus 9+ surrounding metro neighborhoods.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Members from across the metro',
        heading: 'Trusted by members from these communities',
        subheading: 'Two studio locations \u2014 most members train within 15 minutes of home.',
        areas: ['Eastside','Riverwest','Highland','Cedar Park','Maple Heights','Stoneview','Lakeview','Cedar Hollow','Pinegrove','Glen Acres','Foxhill','Birch Park','Northridge','Hawthorne','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don\u2019t see your neighborhood? Most members commute 10\u201320 minutes. Two-location membership included. Coverage spans [City] and surrounding [County].',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our 30-Day Results Promise',
        headline: 'No measurable progress in 30 days? Next month is on us.',
        description: 'Show up 3x/week, follow the plan, hit your check-ins \u2014 if your InBody scan doesn\u2019t show measurable progress at day 30, we credit your next month free. Guaranteed. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Book your free 60-minute strategy session today',
        subheading: 'Our head coach assesses your body, listens to your goals, and writes a custom 4-week outline \u2014 zero cost, zero obligation, zero pressure.',
        ctaLabel: 'Book my free session',
        urgency: '5am + evening slots fill up 1 week ahead \u2014 book early for fastest scheduling',
        nextSteps: ['Tell us your goals','Free 60-min strategy session','Custom 4-week plan + InBody scan'],
        guarantee: 'Free session \u2022 No contracts \u2022 30-day results guarantee',
        privacyNote: 'No spam \u2014 your info is private and only used to schedule.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'NSCA-certified coaches, custom programs, and 220+ trusting members since 2017.',
        phone: PHONE, email: 'coach@ironcoretraining.example',
        address: '2240 Eastside Blvd, [City] Metro, 90155',
        hours: 'Mon\u2013Sat 5am\u20139pm',
        licenseLine: 'NSCA-CSCS certified \u2022 CPR + First Aid certified \u2022 Fully insured',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-personal-trainer-hero-01',
    differentiatorImage: 'demo-personal-trainer-differentiator-01',
    checklistImage: 'demo-personal-trainer-checklist-01',
    galleryImage1: 'demo-personal-trainer-gallery-01',
    galleryImage2: 'demo-personal-trainer-gallery-02',
    galleryImage3: 'demo-personal-trainer-gallery-03',
    fallbackHeroImageId: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    fallbackDifferentiatorImage: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackChecklistImage: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage1: '/v1/assets/placeholders/local/local-services-trust-card-01.svg',
    fallbackGalleryImage2: '/v1/assets/placeholders/local/local-services-trust-card-02.svg',
    fallbackGalleryImage3: '/v1/assets/placeholders/local/local-services-trust-hero-01.svg',
    logo: '/v1/assets/placeholders/common/logo-placeholder.svg',
    avatar: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    testimonialAvatar1: 'demo-personal-trainer-avatar-01',
    testimonialAvatar2: 'demo-personal-trainer-avatar-02',
    testimonialAvatar3: 'demo-personal-trainer-avatar-03',
    fallbackTestimonialAvatar1: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar2: '/v1/assets/placeholders/common/avatar-placeholder.svg',
    fallbackTestimonialAvatar3: '/v1/assets/placeholders/common/avatar-placeholder.svg',
  },

  assetSearchSeeds: {
    heroImageId: 'real photo personal trainer coaching client strength training private studio barbell',
    differentiatorImage: 'real photo NSCA certified coach assessing client InBody scan movement screen',
    checklistImage: 'real photo personal training studio strategy session consultation clipboard',
    galleryImage1: 'real photo client transformation before after weight loss strength training',
    galleryImage2: 'real photo small group strength training class progressive overload gym',
    galleryImage3: 'real photo nutrition coaching meal prep macros healthy plate',
    testimonialAvatar1: 'real photo professional headshot of happy personal-trainer customer, woman late 30s, warm friendly smile, residential setting',
    testimonialAvatar2: 'real photo professional headshot of satisfied personal-trainer customer, man early 40s, casual confident, daylight',
    testimonialAvatar3: 'real photo warm portrait of mature personal-trainer repeat customer, woman 50s, natural light, trustworthy expression',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Full name', required: true },
    { name: 'goalType', type: 'select', label: 'Your main goal?', placeholder: 'Select your goal', required: false, options: ['Lose weight','Build strength','Athletic performance','Tone & shape','General fitness','Post-rehab'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for confirmations)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: what is your goal? (Lose weight, get stronger, etc.)', required: false },
  ],

  metadata: {
    name: 'Personal Trainer Lead Gen',
    description: 'High-converting lead-gen page for personal trainers + small-group studios \u2014 NSCA-certified coaches, custom programs, free strategy session, measurable progress.',
    tags: ['personal-trainer','fitness','strength','nutrition','coaching','transformation','lead-gen'],
  },
};

export default spec;
