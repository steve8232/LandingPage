/**
 * v1-dog-grooming
 *
 * High-Converting Local Service blueprint for dog grooming + mobile groomers.
 */

import { TemplateSpec } from './schema';

const BRAND = 'Pawfect Cut Dog Grooming';
const PHONE = '(555) 422-0918';

const spec: TemplateSpec = {
  templateId: 'v1-dog-grooming',
  version: 'v1',
  category: 'leadgen',
  goal: 'call',
  niche: 'dog-grooming',
  theme: 'theme-wellness-warm',

  sections: [
    { type: 'AnnouncementBar', props: { text: '\ud83d\udc36 Fear-Free Certified \u2022 No Cage Drying \u2022 New-Client $15 Off First Groom', phone: PHONE, hours: 'Tue\u2013Sat 8am\u20136pm' } },
    { type: 'StickyHeader', props: { brandName: BRAND, phone: PHONE, ctaLabel: 'Book Appointment', ctaHref: '#contact', navLinks: [
      { label: 'Services', href: '#services' }, { label: 'Why Us', href: '#why' }, { label: 'Reviews', href: '#reviews' }, { label: 'FAQ', href: '#faq' }, { label: 'Contact', href: '#contact' },
    ] } },
    {
      type: 'HeroLeadForm',
      props: {
        eyebrow: 'Fear-Free Certified \u2022 No cage drying, ever \u2022 Serving Westlake, Cedar Park & 16+ neighborhoods',
        headline: 'A grooming day your dog actually enjoys \u2014 home in 2 hours, not 6.',
        subheadline: 'Stop dropping your dog off at "puppy jail" for a 6-hour stay with cage dryers and strangers. Our Fear-Free Certified groomers do one dog at a time, hand-dry every coat, and have your dog home in about 2 hours.',
        bullets: ['Fear-Free Certified groomer \u2014 trained to keep anxious dogs calm','One-dog-at-a-time appointments \u2014 no kennel stays, no cage dryers','Home in about 2 hours, not 6 \u2014 we text photos when ready'],
        proofPoints: ['4.9\u2605 \u2022 410+ reviews','Fear-Free Certified','One-dog-at-a-time'],
        ctaLabel: 'Book my dog\u2019s appointment',
        formHeading: 'Tell us about your dog',
        formSubheading: 'A real groomer replies within 1 hour during business hours.',
        trustBadge: '\u2713 New-client $15 off first full groom \u2014 same-week appointments often available.',
        imageAsset: 'heroImageId', fallbackAsset: 'fallbackHeroImageId',
      },
    },
    { type: 'TrustStrip', props: { items: [
      { label: '4.9\u2605 Google', detail: 'from 412 reviews', icon: 'star' },
      { label: 'Fear-Free Certified', detail: 'all groomers', icon: 'shield' },
      { label: '9+ years', detail: 'in the metro', icon: 'medal' },
      { label: 'No cage drying', detail: 'hand-dry every coat', icon: 'clock' },
      { label: '6,000+ groom appts', detail: 'happy tails', icon: 'badge' },
    ] } },
    {
      type: 'ServiceList',
      props: {
        heading: 'Grooming services for every coat, every breed, every temperament',
        subheading: 'Every appointment is one-dog-at-a-time \u2014 no group stays, no cage dryers, no rushing.',
        services: [
          { title: 'Full groom', description: 'Bath, hand-dry, breed-specific cut, ear clean, nail trim, and sanitary trim in our Westlake studio. Most dogs done in 2 hours.', icon: 'wrench', benefit: 'Looks great, calm experience' },
          { title: 'Bath & tidy', description: 'Quick bath + hand-dry + nail trim + ear clean across Cedar Park \u2014 perfect between full grooms or for short-coat breeds.', icon: 'tool', benefit: 'Fast freshen-up' },
          { title: 'Nail + paw care', description: 'Walk-in nail trims, paw-pad shave, and dremel finish in Highland \u2014 no appointment needed Tuesdays + Thursdays.', icon: 'shield', benefit: 'In and out in 15 min' },
          { title: 'De-shed treatment', description: 'Brookline\u2019s gold-standard double-coat de-shed \u2014 reduces shedding 60\u201380% for 4\u20136 weeks. Huskies, Goldens, GSDs welcome.', icon: 'search', benefit: 'Less hair on couch' },
          { title: 'Mobile in-driveway grooming', description: 'Self-contained mobile salon parked in your Westlake driveway — no kennels, no cage drying, no separation anxiety.', icon: 'tool', benefit: 'Calmer, faster groom' },
          { title: 'Senior & special-needs grooming', description: 'Patient, low-stress grooms for senior dogs and anxious puppies in Highland — extra rest breaks, gentle handling, no muzzling.', icon: 'search', benefit: 'Stress-free for older dogs' },
        ],
      },
    },
    {
      type: 'DifferentiatorBlock',
      props: {
        eyebrow: 'Why 410+ owners picked Pawfect Cut',
        heading: 'Tired of cage dryers, 6-hour drop-offs, and dogs coming home shaking?',
        subheading: 'Big-box pet stores and chain groomers run on volume \u2014 cage dryers, kennel stays, and groomers handling 8 dogs at once. We do the opposite.',
        items: [
          { title: 'Fear-Free Certified groomers', description: 'Every groomer holds Fear-Free Certified Professional status \u2014 trained in anxiety reduction, low-stress handling, and recognizing dog body language.' },
          { title: 'One dog at a time', description: 'Your dog is the only dog being groomed during your appointment. No kennel waits, no cage dryers, no chaos. Calm room, calm dog.' },
          { title: 'No cage drying, ever', description: 'We hand-dry every coat with high-velocity dryers \u2014 no heated cage dryers (the kind that have caused tragic injuries at chain groomers).' },
          { title: 'Home in about 2 hours', description: 'Drop off, do an errand, get a text with photos when done. No 6-hour kennel stays. No \u201cwe\u2019ll call you sometime today.\u201d' },
        ],
        imageAsset: 'differentiatorImage', fallbackAsset: 'fallbackDifferentiatorImage', imageSide: 'right',
      },
    },
    {
      type: 'ChecklistSection',
      props: {
        eyebrow: 'Every full groom \u2014 included',
        heading: 'What\u2019s included with every full-groom appointment',
        subheading: 'Every full-groom appointment in Westlake, Cedar Park, and Highland includes the work below \u2014 no surprise add-on fees.',
        items: [
          'Service in Westlake, Cedar Park, Highland, Brookline + Maple Heights',
          'Warm hypoallergenic bath + double shampoo + conditioner',
          'Hand-dry with low-heat high-velocity dryer (no cage drying)',
          'Breed-specific or owner-requested cut',
          'Ear clean + check + plucking if needed',
          'Nail trim + dremel smooth finish',
          'Sanitary trim + paw-pad shave',
          'Bandana or bow + cologne spritz on the way out',
        ],
        imageAsset: 'checklistImage', fallbackAsset: 'fallbackChecklistImage', imageSide: 'left',
      },
    },
    {
      type: 'MidPageCTA',
      props: {
        eyebrow: 'Anxious dog? Senior dog? First-time groom?',
        headline: 'Book your dog\u2019s calm, low-stress appointment today.',
        subheadline: 'Tell us about your dog \u2014 breed, age, anxiety, prior groom history \u2014 and we\u2019ll match the calmest groomer + slot for them.',
        ctaLabel: 'Book my dog\u2019s appointment', ctaHref: '#contact', secondaryText: 'or call ' + PHONE,
      },
    },
    {
      type: 'TestimonialsCards',
      props: {
        heading: 'What 410+ dog owners say',
        subheading: 'Verified Google reviews from owners in Westlake, Cedar Park, and Highland.',
        testimonials: [
          { quote: 'Switched after PetSmart left my Goldendoodle in a cage dryer for 5 hours \u2014 came home panting and traumatized. Pawfect Cut had her home in 2 hours, hand-dried, tail wagging. Never going back.', highlight: 'tail wagging', rating: 5, name: 'Jasmine R.', title: 'Westlake owner' },
          { quote: 'My senior 14-year-old shih tzu HATES grooming. Pawfect did her on a soft mat, took breaks, and texted me photos throughout. First time in years she came home calm.', highlight: 'came home calm', rating: 5, name: 'Walter T.', title: 'Cedar Park owner' },
          { quote: 'Husky de-shed in Highland was unreal \u2014 60% less hair on the couch for 5 weeks. Groomer explained the process, no upsells, fair price. Booked 6 months ahead.', highlight: '60% less hair', rating: 5, name: 'Briana O.', title: 'Highland owner' },
        ],
      },
    },
    {
      type: 'PhotoGalleryStrip',
      props: {
        heading: 'Recent grooms from our studio',
        subheading: 'Snapshots from Westlake, Cedar Park, and Highland \u2014 calm dogs, clean cuts, happy tails.',
        items: [
          { imageAsset: 'galleryImage1', fallbackAsset: 'fallbackGalleryImage1', caption: 'Westlake Goldendoodle full groom \u2014 home in 2 hours.' },
          { imageAsset: 'galleryImage2', fallbackAsset: 'fallbackGalleryImage2', caption: 'Cedar Park senior shih tzu \u2014 calm, low-stress appointment.' },
          { imageAsset: 'galleryImage3', fallbackAsset: 'fallbackGalleryImage3', caption: 'Highland husky de-shed \u2014 60% less couch hair.' },
        ],
      },
    },


    {
      type: 'ProcessSteps',
      props: {
        eyebrow: 'How it works',
        heading: 'From booking to tail-wagging in 4 steps',
        subheading: 'No phone tag, no surprise fees. Here is exactly what happens after you submit the form.',
        steps: [
          { title: '1. Tell us about your dog', description: 'Submit the form with breed, age, coat, anxiety level, and any health concerns. A real groomer replies in 1 hour.' },
          { title: '2. We match the right groomer', description: 'For senior + anxious dogs we match the calmest groomer + a quiet time-slot. First-time clients get a meet-and-greet.' },
          { title: '3. Drop-off + 2-hour groom', description: 'Drop off, do an errand. Bath, hand-dry, breed-specific cut, ears, nails. We text photos when ready.' },
          { title: '4. Pickup + recurring schedule', description: 'Pickup with bandana + cologne. Most clients book a recurring 4\u20136 week schedule on the spot \u2014 saves $5/visit.' },
        ],
      },
    },
    {
      type: 'FAQAccordion',
      props: {
        heading: 'Dog grooming questions, answered straight',
        items: [
          { question: 'How fast can I get an appointment?', answer: 'Most Westlake and Cedar Park clients book within 5\u20137 days. Tuesdays and Thursdays are usually open same-week.' },
          { question: 'Do you really not use cage dryers?', answer: 'Correct \u2014 every dog is hand-dried with a low-heat, high-velocity dryer. No cage dryers, ever. We won\u2019t put a dog in a heated kennel.' },
          { question: 'Can you handle my anxious or senior dog?', answer: 'Yes \u2014 every groomer is Fear-Free Certified. Senior + anxious dogs get a calmer slot, soft mat, breaks, and we never force a groom.' },
          { question: 'Are you Fear-Free Certified?', answer: 'Yes \u2014 every groomer holds Fear-Free Certified Professional status. Trained in anxiety reduction and low-stress handling.' },
          { question: 'What if my dog freaks out mid-groom?', answer: 'We pause, offer treats and breaks, and call you. We\u2019ll never force a groom. Worst-case we finish another day at no extra cost.' },
          { question: 'What neighborhoods do you serve?', answer: 'Westlake, Cedar Park, Highland, Brookline, Maple Heights, plus 11+ surrounding metro neighborhoods.' },
        ],
      },
    },
    {
      type: 'ServiceAreas',
      props: {
        eyebrow: 'Owners from across the metro',
        heading: 'Trusted by dog owners from these communities',
        subheading: 'Conveniently located off the highway \u2014 most clients arrive within 20 minutes.',
        areas: ['Westlake','Cedar Park','Highland','Brookline','Maple Heights','Stoneview','Lakeview','Cedar Hollow','Pinegrove','Glen Acres','Foxhill','Birch Park','Northridge','Hawthorne','[Your Neighborhood]','[Your Zip]'],
        footnote: 'Don\u2019t see your neighborhood? Most owners drive 15\u201320 minutes. Worth the calm groom. Coverage spans [City] and surrounding [County].',
      },
    },
    {
      type: 'GuaranteeBar',
      props: {
        eyebrow: 'Our Calm Dog Guarantee',
        headline: 'Not happy with the groom? We re-groom free within 7 days.',
        description: 'If the cut isn\u2019t quite right or your dog seemed stressed, bring them back within 7 days for a free re-groom or touch-up. No questions, no fees \u2014 a happy dog and owner is the standard. Backed by [City] families and [Neighborhood] neighbors since day one.',
      },
    },
    {
      type: 'FinalCTA',
      props: {
        heading: 'Book your dog\u2019s calm, low-stress appointment today',
        subheading: 'Fear-Free Certified groomers, one dog at a time, no cage drying, home in about 2 hours \u2014 with photos texted to you when ready.',
        ctaLabel: 'Book my dog\u2019s appointment',
        urgency: 'Tuesday + Thursday slots fill up 1 week ahead \u2014 book early for fastest scheduling',
        nextSteps: ['Tell us about your dog','Matched with the calmest groomer','2-hour calm groom + photos texted'],
        guarantee: '$15 off first groom \u2022 No cage drying \u2022 7-day re-groom guarantee',
        privacyNote: 'No spam \u2014 your info is private and only used to schedule.',
      },
    },
    {
      type: 'Footer',
      props: {
        brandName: BRAND,
        tagline: 'Fear-Free Certified groomers, one-dog-at-a-time appointments, and 410+ wagging tails since 2016.',
        phone: PHONE, email: 'hello@pawfectcutgrooming.example',
        address: '802 Westlake Ave, [City] Metro, 90188',
        hours: 'Tue\u2013Sat 8am\u20136pm',
        licenseLine: 'Fear-Free Certified \u2022 Pet First Aid certified \u2022 Fully insured + bonded',
      },
    },
  ],

  assets: {
    heroImageId: 'demo-dog-grooming-hero-01',
    differentiatorImage: 'demo-dog-grooming-differentiator-01',
    checklistImage: 'demo-dog-grooming-checklist-01',
    galleryImage1: 'demo-dog-grooming-gallery-01',
    galleryImage2: 'demo-dog-grooming-gallery-02',
    galleryImage3: 'demo-dog-grooming-gallery-03',
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
    heroImageId: 'real photo professional dog groomer hand drying calm goldendoodle bright studio',
    differentiatorImage: 'real photo fear free certified groomer brushing happy dog one at a time studio',
    checklistImage: 'real photo dog grooming bath shampoo hypoallergenic warm towel',
    galleryImage1: 'real photo goldendoodle full groom before after bandana studio',
    galleryImage2: 'real photo senior shih tzu calm groom soft mat low stress',
    galleryImage3: 'real photo husky de-shed treatment double coat brush professional',
  },

  form: [
    { name: 'name', type: 'text', placeholder: 'Your full name', required: true },
    { name: 'serviceType', type: 'select', label: 'What service?', placeholder: 'Select service', required: false, options: ['Full groom (bath + cut)','Bath & tidy','Nail trim','De-shed treatment','Senior / special needs','Mobile in-driveway'] },
    { name: 'phone', type: 'tel', placeholder: 'Best phone number', required: true },
    { name: 'email', type: 'email', placeholder: 'Email (for confirmations)', required: true },
    { name: 'message', type: 'textarea', placeholder: 'Briefly: dog\u2019s breed, age, coat, and any anxiety or health notes', required: false },
  ],

  metadata: {
    name: 'Dog Grooming Lead Gen',
    description: 'High-converting lead-gen page for dog grooming \u2014 Fear-Free Certified, no cage drying, one-dog-at-a-time appointments, calm low-stress experience.',
    tags: ['dog-grooming','pet-grooming','fear-free','wellness','calm','one-on-one','lead-gen'],
  },
};

export default spec;
