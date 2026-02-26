// Spintax system and example preview content for template previews
// Spintax syntax: {option1|option2|option3} randomly picks one option

export interface PreviewContent {
  companyName: string;
  headline: string;
  subheadline: string;
  cta: string;
  offerName: string;
  offerDescription: string;
  sellingPoints: string[];
  testimonials: Array<{ quote: string; name: string; title: string }>;
  phone: string;
  email: string;
}

/**
 * Resolve spintax in a string: {option1|option2|option3} → picks one randomly
 * Uses a seeded approach based on template ID for consistent previews
 */
export function resolveSpintax(text: string, seed: number = 0): string {
  let counter = seed;
  return text.replace(/\{([^{}]+)\}/g, (_match, group: string) => {
    const options = group.split('|');
    const index = Math.abs(counter++) % options.length;
    return options[index];
  });
}

/**
 * Resolve all spintax in a PreviewContent object
 */
export function resolvePreviewContent(content: PreviewContent, seed: number = 0): PreviewContent {
  const resolve = (text: string) => resolveSpintax(text, seed);
  return {
    companyName: resolve(content.companyName),
    headline: resolve(content.headline),
    subheadline: resolve(content.subheadline),
    cta: resolve(content.cta),
    offerName: resolve(content.offerName),
    offerDescription: resolve(content.offerDescription),
    sellingPoints: content.sellingPoints.map(p => resolve(p)),
    testimonials: content.testimonials.map(t => ({
      quote: resolve(t.quote),
      name: resolve(t.name),
      title: resolve(t.title),
    })),
    phone: content.phone,
    email: content.email,
  };
}

// ─── Example content with spintax for each template ───

const saasModernContent: PreviewContent = {
  companyName: '{CloudFlow|Taskify|Buildstack}',
  headline: '{Ship {Features|Products|Updates} 10x Faster|Scale Your {SaaS|Platform|App} With Confidence|The {Smartest|Fastest|Easiest} Way to Build & Deploy}',
  subheadline: '{Automate your workflow and eliminate busywork.|One platform to manage, deploy, and scale your product.|Join 5,000+ teams who streamlined their development pipeline.}',
  cta: '{Start Free Trial|Get Started Free|Try It Free →}',
  offerName: '{CloudFlow Pro|Taskify Business|Buildstack Teams}',
  offerDescription: '{All-in-one platform with CI/CD, monitoring, and team collaboration built in.|Automated workflows, real-time analytics, and seamless integrations.|Everything you need to ship faster — from idea to production.}',
  sellingPoints: [
    '{99.9% uptime guarantee|Zero-downtime deployments|Enterprise-grade reliability}',
    '{Integrates with 200+ tools|Works with your existing stack|Plug-and-play integrations}',
    '{Real-time collaboration|Team dashboards & insights|Built-in project management}',
    '{SOC 2 & GDPR compliant|Bank-level encryption|Enterprise security built in}',
  ],
  testimonials: [
    { quote: '{Cut our deployment time by 80%.|We shipped our MVP in 2 weeks instead of 2 months.|Finally, a tool that just works.}', name: '{Sarah Chen|Alex Rivera|Jordan Park}', title: '{CTO at ScaleUp|VP Engineering at Runway|Lead Dev at Foxtail}' },
    { quote: '{The ROI was immediate — we saved $40K in the first quarter.|Our team productivity doubled within a month.|Best developer tool we\'ve adopted in years.}', name: '{Marcus Webb|Lisa Nguyen|David Kim}', title: '{Founder, NovaTech|Head of Product, Layerform|Engineering Manager, Coral}' },
  ],
  phone: '(888) 555-0101',
  email: 'hello@cloudflow.io',
};

const saasDarkContent: PreviewContent = {
  companyName: '{NeuralEdge|DarkPulse|Synthwave AI}',
  headline: '{AI-Powered {Analytics|Intelligence|Insights} for Modern Teams|Unlock the Power of {Machine Learning|AI|Deep Learning}|{Next-Gen|Cutting-Edge|Revolutionary} AI Infrastructure}',
  subheadline: '{Transform raw data into actionable intelligence in seconds.|Build, train, and deploy ML models with zero infrastructure hassle.|The developer-first AI platform trusted by 10,000+ engineers.}',
  cta: '{Launch Your Model →|Start Building Free|Request Early Access}',
  offerName: '{NeuralEdge Pro|DarkPulse Enterprise|Synthwave Platform}',
  offerDescription: '{GPU-accelerated inference, automated model tuning, and real-time monitoring.|End-to-end ML pipeline with one-click deployment and A/B testing.|From prototype to production in minutes, not months.}',
  sellingPoints: [
    '{10x faster model training|Sub-100ms inference latency|GPU clusters on demand}',
    '{One-click deployment to any cloud|Auto-scaling infrastructure|Multi-cloud support}',
    '{Built-in experiment tracking|Real-time model monitoring|Automated drift detection}',
    '{Python & TypeScript SDKs|REST & GraphQL APIs|Native Jupyter integration}',
  ],
  testimonials: [
    { quote: '{Reduced our ML pipeline from days to hours.|The inference speed is unreal — 50ms average.|Finally, ML infrastructure that scales with us.}', name: '{Dr. Priya Sharma|Kai Tanaka|Elena Volkov}', title: '{AI Lead at DeepMind|Staff Engineer at Stripe|ML Director at Spotify}' },
    { quote: '{We went from prototype to production in one afternoon.|The auto-scaling saved us $200K in cloud costs.|Best ML platform on the market, hands down.}', name: '{James Liu|Anika Patel|Omar Hassan}', title: '{CTO, Quantum Labs|VP of AI, Nexus|Founder, DataForge}' },
  ],
  phone: '(888) 555-0102',
  email: 'team@neuraledge.ai',
};

const ecommerceCleanContent: PreviewContent = {
  companyName: '{Maison Belle|Artisan & Co|The Craft Collective}',
  headline: '{Handcrafted {Elegance|Beauty|Luxury} for Your Home|Discover {Curated|Artisan|Premium} Collections|{Timeless|Exquisite|Beautiful} Pieces, Thoughtfully Made}',
  subheadline: '{Sustainably sourced, beautifully designed, delivered to your door.|Each piece tells a story — discover yours today.|Free shipping on orders over $75. Satisfaction guaranteed.}',
  cta: '{Shop the Collection|Explore Now|Browse Bestsellers →}',
  offerName: '{Spring Collection|Artisan Essentials|Signature Series}',
  offerDescription: '{Hand-poured candles, organic linens, and artisan ceramics for the modern home.|Curated collections featuring small-batch, ethically made goods.|Premium materials meet timeless design in every piece.}',
  sellingPoints: [
    '{Free shipping over $75|Complimentary gift wrapping|Free returns within 30 days}',
    '{Sustainably sourced materials|Ethically made & fair trade|Eco-friendly packaging}',
    '{Handcrafted by skilled artisans|Small-batch production|One-of-a-kind pieces}',
    '{100% satisfaction guarantee|Easy 30-day returns|Lifetime quality warranty}',
  ],
  testimonials: [
    { quote: '{The quality is exceptional — even better than the photos.|Every item arrived beautifully packaged. Such attention to detail.|I get compliments on these pieces constantly.}', name: '{Emily Watson|Rebecca Torres|Claire Beaumont}', title: '{Interior Designer|Loyal Customer|Home Décor Blogger}' },
    { quote: '{My go-to for unique, thoughtful gifts.|The craftsmanship is unlike anything on the mass market.|Absolutely love the sustainability ethos.}', name: '{Michael Brooks|Sophia Lee|Nadia Ibrahim}', title: '{Gift Shopper|Repeat Customer|Eco-Living Advocate}' },
  ],
  phone: '(888) 555-0103',
  email: 'hello@maisonbelle.com',
};

const ecommerceBoldContent: PreviewContent = {
  companyName: '{FLASHDEAL|MEGASAVE|DEALZONE}',
  headline: '{{MASSIVE|HUGE|EPIC} SALE — Up to 70% OFF|{FLASH SALE|LIMITED TIME|TODAY ONLY}: Save Big Now|Don\'t Miss the {Biggest|Best|Ultimate} Deals of the Year}',
  subheadline: '{Thousands of items marked down. Limited stock — act fast!|Top brands at unbeatable prices. Free express shipping today.|Once they\'re gone, they\'re gone. Shop the sale now.}',
  cta: '{SHOP THE SALE →|GRAB YOUR DEAL|SAVE NOW →}',
  offerName: '{Flash Sale Event|Mega Clearance|Deal of the Day}',
  offerDescription: '{Up to 70% off electronics, fashion, and home essentials. Today only!|Clearance prices on top brands — limited quantities available.|New deals every hour. Set alerts so you never miss out.}',
  sellingPoints: [
    '{Up to 70% off retail prices|Lowest prices guaranteed|Price match guarantee}',
    '{Free express shipping today|Same-day delivery available|Free 2-day shipping}',
    '{Easy 60-day returns|No-hassle refund policy|Free return shipping}',
    '{Secure checkout & buyer protection|Verified seller guarantee|24/7 customer support}',
  ],
  testimonials: [
    { quote: '{Saved over $300 on my last order!|Prices were even lower than Amazon.|I check this site before buying anything now.}', name: '{Tyler Grant|Maria Santos|Kevin O\'Brien}', title: '{Verified Buyer|Deal Hunter|Repeat Customer}' },
    { quote: '{Shipping was incredibly fast — got it next day.|Customer service resolved my issue in minutes.|Best deals I\'ve found online, period.}', name: '{Ashley Kim|Brandon Cole|Priya Mehta}', title: '{Happy Shopper|Bargain Pro|First-Time Buyer}' },
  ],
  phone: '(888) 555-0104',
  email: 'deals@flashdeal.com',
};

const localServicesTrustContent: PreviewContent = {
  companyName: '{Apex Plumbing|Summit Home Services|Reliable Repair Co}',
  headline: '{Your Trusted Local {Plumber|Contractor|Handyman} Since 2005|{Fast|Same-Day|24/7} {Plumbing|Home Repair|HVAC} Service You Can Count On|Licensed, Insured & Ready to Help — {Call|Book|Schedule} Today}',
  subheadline: '{Over 15,000 satisfied customers in the greater metro area.|Licensed, bonded, and insured. Free estimates on all jobs.|Family-owned and operated — your neighbors trust us, you can too.}',
  cta: '{Get a Free Estimate|Call Now — Open 24/7|Book Your Service →}',
  offerName: '{Complete Home Plumbing|Full-Service Repairs|Emergency Services}',
  offerDescription: '{From leaky faucets to full re-pipes — we handle it all with upfront pricing.|Residential and commercial repair services with same-day availability.|No job too big or too small. Senior and military discounts available.}',
  sellingPoints: [
    '{Licensed, bonded & insured|20+ years of experience|A+ BBB rating}',
    '{Same-day service available|24/7 emergency response|On-time guarantee}',
    '{Upfront pricing — no surprises|Free written estimates|Financing available}',
    '{100% satisfaction guarantee|5-year workmanship warranty|Background-checked technicians}',
  ],
  testimonials: [
    { quote: '{They fixed our burst pipe at 2 AM — absolute lifesavers.|Honest, fair pricing and incredible workmanship.|The only contractor I\'ll ever call again.}', name: '{Robert & Linda M.|Jennifer Hayes|Tom Richardson}', title: '{Homeowner|Property Manager|Repeat Customer}' },
    { quote: '{Showed up on time, finished under budget. Rare these days.|We use them for all 12 of our rental properties.|Professional from start to finish.}', name: '{Carlos Mendez|Diane Foster|Mike Sullivan}', title: '{First-Time Customer|Real Estate Investor|Business Owner}' },
  ],
  phone: '(555) 234-5678',
  email: 'service@apexplumbing.com',
};

const localServicesGreenContent: PreviewContent = {
  companyName: '{GreenScape Pro|EcoClean Solutions|NatureCare Services}',
  headline: '{{Beautiful|Stunning|Lush} Lawns, {Naturally|Sustainably|Organically}|Eco-Friendly {Landscaping|Cleaning|Lawn Care} for Your Home|Go Green Without Lifting a Finger}',
  subheadline: '{100% organic products. Beautiful results. Zero harsh chemicals.|Sustainable lawn care and landscaping that\'s safe for kids and pets.|Transform your outdoor space with environmentally responsible care.}',
  cta: '{Get Your Free Quote|Schedule a Visit|See Our Plans →}',
  offerName: '{Organic Lawn Program|EcoClean Package|Full-Service Green Care}',
  offerDescription: '{Season-long organic lawn care with custom soil analysis and natural treatments.|Chemical-free cleaning and landscaping services for health-conscious homes.|Comprehensive property care using 100% sustainable products and methods.}',
  sellingPoints: [
    '{100% organic & chemical-free|Safe for kids, pets & wildlife|EPA-certified green products}',
    '{Custom soil analysis included|Tailored seasonal programs|Science-backed organic methods}',
    '{Licensed & fully insured|Certified green professionals|Eco-certified company}',
    '{Satisfaction guaranteed|Free re-service if needed|Flexible scheduling}',
  ],
  testimonials: [
    { quote: '{Our lawn has never looked better — and it\'s totally chemical-free.|I love knowing my kids can play safely on the grass.|They transformed our yard into an absolute paradise.}', name: '{Amanda Green|Mark & Stacy Hall|Paul Richardson}', title: '{Eco-Conscious Homeowner|Family with 3 Kids|Retired Gardener}' },
    { quote: '{Professional, punctual, and truly passionate about sustainability.|Best landscaping service we\'ve ever used — and we\'ve tried many.|The organic approach actually works better than chemicals.}', name: '{Christine Park|Dave Morrison|Leah Thompson}', title: '{Environmental Advocate|HOA President|Long-Time Customer}' },
  ],
  phone: '(555) 345-6789',
  email: 'info@greenscapepro.com',
};

const professionalConsultingContent: PreviewContent = {
  companyName: '{Stratton Advisory|Catalyst Consulting|Pinnacle Group}',
  headline: '{Unlock Your {Business|Leadership|Growth} Potential|Strategic {Consulting|Advisory|Coaching} for Ambitious Leaders|Transform {Challenges|Obstacles|Complexity} Into {Growth|Opportunity|Results}}',
  subheadline: '{Trusted by Fortune 500 executives and high-growth startups alike.|20+ years of experience guiding businesses through transformation.|Clarity, strategy, and results — that\'s what we deliver.}',
  cta: '{Book a Free Consultation|Schedule Your Strategy Call|Let\'s Talk →}',
  offerName: '{Executive Strategy Session|Business Growth Blueprint|Leadership Advisory Package}',
  offerDescription: '{A 90-minute deep-dive session to identify your biggest growth levers and create an actionable roadmap.|Comprehensive business audit with prioritized recommendations and 90-day implementation plan.|Ongoing strategic advisory with monthly check-ins, KPI tracking, and executive coaching.}',
  sellingPoints: [
    '{20+ years of C-suite advisory|Trusted by 200+ executives|Harvard Business School alumni}',
    '{Customized strategies, not templates|Data-driven recommendations|Actionable 90-day roadmaps}',
    '{Average 3x revenue growth for clients|92% client retention rate|$2B+ in client revenue influenced}',
    '{Confidential & discrete|NDA-protected engagements|Exclusive one-on-one access}',
  ],
  testimonials: [
    { quote: '{The clarity I gained in one session was worth more than a year of trial and error.|Our revenue grew 340% following their strategic roadmap.|The best investment I\'ve made in my business — bar none.}', name: '{Catherine Sterling|Dr. James Whitfield|Raj Patel}', title: '{CEO, Meridian Group|Founder, Whitfield Labs|Managing Director, Apex Capital}' },
    { quote: '{They see the angles no one else does. Truly world-class advisors.|Transformed our go-to-market strategy and doubled our pipeline.|Thoughtful, rigorous, and always available when it matters.}', name: '{Victoria Chase|Andrew McBride|Diana Reeves}', title: '{COO, Harmon Industries|VP Strategy, TechNova|Board Member, Sterling Ventures}' },
  ],
  phone: '(212) 555-0106',
  email: 'contact@strattonadvisory.com',
};

const professionalLawContent: PreviewContent = {
  companyName: '{Sterling & Associates|Blackwell Law Group|Chambers & Reid LLP}',
  headline: '{{Experienced|Trusted|Award-Winning} Legal Counsel When It Matters Most|Protecting Your {Rights|Interests|Future} With Integrity|{Proven|Results-Driven|Strategic} Legal Representation}',
  subheadline: '{Over 30 years of successful litigation and client advocacy.|Our track record speaks for itself: 97% favorable case outcomes.|Personalized legal strategy tailored to your unique situation.}',
  cta: '{Schedule a Free Consultation|Call for Confidential Advice|Get Legal Help Now →}',
  offerName: '{Comprehensive Legal Services|Case Evaluation & Strategy|Full Legal Representation}',
  offerDescription: '{From initial consultation through resolution, we guide you with expertise and compassion.|Free case evaluation with an experienced attorney who will assess your options.|Aggressive, strategic representation backed by decades of courtroom experience.}',
  sellingPoints: [
    '{30+ years of legal experience|97% favorable outcomes|$500M+ recovered for clients}',
    '{Free initial consultation|No fee unless we win|Transparent billing}',
    '{Former federal prosecutor on staff|Board-certified specialists|Peer-rated "Superb" on Avvo}',
    '{Available 24/7 for emergencies|Same-day appointments available|Multilingual team}',
  ],
  testimonials: [
    { quote: '{They turned what felt hopeless into a complete victory.|Professional, thorough, and genuinely caring. I couldn\'t have asked for better.|Recovered far more than I expected. Truly exceptional attorneys.}', name: '{Margaret O\'Brien|David Rosenberg|Patricia Vega}', title: '{Personal Injury Client|Business Litigation Client|Estate Planning Client}' },
    { quote: '{Their attention to detail won us the case.|I felt supported every step of the way.|The most professional law firm I\'ve ever worked with.}', name: '{Richard Thornton|Samantha Wu|Frank DeLuca}', title: '{Corporate Client|Family Law Client|Criminal Defense Client}' },
  ],
  phone: '(212) 555-0107',
  email: 'intake@sterlinglaw.com',
};

const leadGenWebinarContent: PreviewContent = {
  companyName: '{GrowthHQ|LaunchPad Academy|ScaleUp Institute}',
  headline: '{Free Live Training: {Double|Triple|10x} Your {Revenue|Leads|Sales} in 90 Days|Join the {Masterclass|Workshop|Webinar} That\'s Changing {Businesses|Careers|Industries}|{Learn|Discover|Master} the {Framework|System|Strategy} Behind 7-Figure Growth}',
  subheadline: '{Live on March 15th at 2PM EST. Limited to 500 seats — reserve yours now.|Join 10,000+ professionals who have transformed their results.|Packed with actionable strategies you can implement immediately.}',
  cta: '{Reserve My Free Seat →|Register Now — It\'s Free|Save My Spot →}',
  offerName: '{Revenue Acceleration Masterclass|Growth Framework Workshop|Scale-Up Strategy Webinar}',
  offerDescription: '{A 90-minute live training covering the exact 5-step framework used by 200+ companies to 3x revenue.|Interactive workshop with live Q&A, downloadable templates, and a 30-day action plan.|Learn from real case studies — no fluff, just proven strategies that work.}',
  sellingPoints: [
    '{100% free — no credit card required|Instant access upon registration|Replay available for 48 hours}',
    '{Actionable templates & frameworks|Step-by-step implementation guide|Bonus: 30-day action plan}',
    '{Led by a $100M+ revenue strategist|Real case studies, not theory|Interactive live Q&A session}',
    '{Certificate of completion included|Exclusive community access|VIP follow-up resources}',
  ],
  testimonials: [
    { quote: '{Implemented one strategy from the webinar and landed 3 new clients that week.|This training was more valuable than the $5K course I took last year.|The frameworks are so clear — I started seeing results within days.}', name: '{Sarah Mitchell|Brian Foster|Alicia Ramirez}', title: '{Marketing Director|Agency Owner|Startup Founder}' },
    { quote: '{I\'ve attended dozens of webinars — this was the only one worth my time.|Our team ROI\'d the time investment 50x in the first month.|Genuinely transformative. I recommend it to every entrepreneur I know.}', name: '{Jason Lee|Michelle Torres|David Chang}', title: '{VP of Sales|Business Coach|E-commerce Founder}' },
  ],
  phone: '(888) 555-0108',
  email: 'training@growthhq.com',
};

const leadGenEbookContent: PreviewContent = {
  companyName: '{ContentPro|MarketingEdge|Growth Playbook}',
  headline: '{Free Guide: The {Ultimate|Complete|Definitive} {Playbook|Guide|Blueprint} for {2025|Modern|Digital} {Marketing|Growth|Success}|Download Your Free {Ebook|Guide|Report} — {Proven|Battle-Tested|Expert} Strategies Inside|Get the {Blueprint|Roadmap|Framework} That\'s Generated $50M+ in Revenue}',
  subheadline: '{47 pages of actionable strategies from industry leaders. No email sequence — just pure value.|Based on analysis of 1,000+ successful campaigns. Download instantly.|The same playbook used by teams at Spotify, Shopify, and HubSpot.}',
  cta: '{Download Free Guide →|Get Instant Access|Grab Your Copy →}',
  offerName: '{The 2025 Growth Playbook|Digital Marketing Blueprint|Revenue Engine Guide}',
  offerDescription: '{47 pages covering SEO, paid ads, content strategy, email marketing, and conversion optimization.|A complete framework for building a predictable, scalable marketing engine.|From strategy to execution — every tool, template, and tactic you need.}',
  sellingPoints: [
    '{47 pages of actionable insights|Based on 1,000+ campaign analyses|Updated for 2025 trends}',
    '{Includes 12 ready-to-use templates|Bonus: campaign planning spreadsheet|ROI calculator included}',
    '{Written by industry practitioners|No fluff — only proven tactics|Real case studies & benchmarks}',
    '{Instant PDF download|Mobile-friendly format|Free forever — no upsells}',
  ],
  testimonials: [
    { quote: '{This guide replaced 3 courses I was considering. Incredibly comprehensive.|Applied chapter 4\'s framework and increased our conversion rate by 35%.|I printed it out and it lives on my desk. That good.}', name: '{Hannah Bishop|Ryan Torres|Kim Nakamura}', title: '{Head of Marketing|Growth Lead|Content Strategist}' },
    { quote: '{The templates alone saved me 20+ hours of work.|Hands down the best free marketing resource I\'ve ever downloaded.|Our whole marketing team uses this as our playbook now.}', name: '{Alex Dunn|Priya Sharma|Marcus Cole}', title: '{Freelance Marketer|VP Marketing|Agency Director}' },
  ],
  phone: '(888) 555-0109',
  email: 'resources@contentpro.io',
};

const comingSoonMinimalContent: PreviewContent = {
  companyName: '{Horizon|Stealth Labs|Project Zero}',
  headline: '{Something {Big|Incredible|Revolutionary} Is Coming|We\'re Building the Future of {Work|Commerce|Communication}|{Get Ready|Stay Tuned|Be First} — Launching {Soon|This Spring|March 2025}}',
  subheadline: '{Join the waitlist and be the first to experience what\'s next.|We\'re putting the finishing touches on something special.|Early access members get exclusive lifetime benefits.}',
  cta: '{Join the Waitlist|Get Early Access|Notify Me →}',
  offerName: '{Early Access Program|Founding Member Benefits|Priority Launch Access}',
  offerDescription: '{Be among the first 1,000 to try it. Early members get lifetime premium access at launch pricing.|Join our exclusive beta program and help shape the product.|Sign up now for priority access, exclusive perks, and founding member pricing.}',
  sellingPoints: [
    '{Be the first to know|Priority access guaranteed|Exclusive launch perks}',
    '{Founding member pricing|Lifetime discount locked in|Early bird bonuses}',
    '{Shape the product with feedback|Direct access to founders|Private community access}',
    '{No spam — just launch updates|Unsubscribe anytime|Your data stays private}',
  ],
  testimonials: [
    { quote: '{The team behind this has an incredible track record.|If it\'s anything like their last product, count me in.|I signed up the second I heard about it.}', name: '{Tech Insider|Early Adopter|Industry Analyst}', title: '{Beta Tester|Waitlist Member|Technology Review}' },
    { quote: '{The concept alone is game-changing.|This is exactly what the market has been missing.|Can\'t wait to get my hands on it.}', name: '{Product Hunt|Innovation Weekly|Startup Digest}', title: '{Featured Product|Editor\'s Pick|Ones to Watch}' },
  ],
  phone: '(888) 555-0110',
  email: 'hello@horizonhq.com',
};

const comingSoonVibrantContent: PreviewContent = {
  companyName: '{Spark|Vibe|Neon}',
  headline: '{{Ready|Prepare|Get Set} to Have Your Mind Blown 🚀|The App That Changes {Everything|The Game|How You Work}|{Coming Soon|Almost Here|Dropping Soon}: Something {Amazing|Incredible|Epic}}',
  subheadline: '{We\'ve been working in secret for 2 years. The wait is almost over.|This isn\'t just another app — it\'s a whole new category.|Get on the list. Trust us, you\'ll want to be first.}',
  cta: '{I Want In! 🎉|Sign Me Up →|Count Me In! 🚀}',
  offerName: '{VIP Launch Access|Founding Circle|Early Bird Special}',
  offerDescription: '{Be a founding member and lock in free premium access for life.|VIP members get the app 2 weeks before everyone else, plus exclusive swag.|Sign up today and get a personal demo from the founding team.}',
  sellingPoints: [
    '{Free premium access for early members|Exclusive founding member badge|Priority onboarding}',
    '{Personal demo from the founders|Direct Slack access to the team|Help shape V1 features}',
    '{Limited to first 500 signups|Exclusive launch party invite|Free premium tier for life}',
    '{Zero risk — free to join|Instant confirmation email|Share & earn bonus perks}',
  ],
  testimonials: [
    { quote: '{This team doesn\'t do boring. Whatever they\'re building, I\'m in.|The teaser alone had me hooked. Take my email already!|If the energy of this landing page is any indication, this is going to be huge.}', name: '{Alex Noir|Casey Storm|Jordan Blaze}', title: '{Serial Early Adopter|Tech Enthusiast|Angel Investor}' },
    { quote: '{The founding team includes ex-Google, ex-Stripe talent. Enough said.|I signed up three friends before I even finished reading.|The vibe here is immaculate. Whatever "it" is — they have it.}', name: '{Morgan Tide|Riley Spark|Quinn Haze}', title: '{Product Hunter|Indie Hacker|Design Leader}' },
  ],
  phone: '(888) 555-0111',
  email: 'hey@sparkhq.app',
};

// ─── Template ID → Preview Content mapping ───

export const templatePreviewContent: Record<string, PreviewContent> = {
  'saas-modern': saasModernContent,
  'saas-dark': saasDarkContent,
  'ecommerce-clean': ecommerceCleanContent,
  'ecommerce-bold': ecommerceBoldContent,
  'local-trust': localServicesTrustContent,
  'local-eco': localServicesGreenContent,
  'pro-consulting': professionalConsultingContent,
  'pro-law': professionalLawContent,
  'leadgen-webinar': leadGenWebinarContent,
  'leadgen-ebook': leadGenEbookContent,
  'coming-soon-minimal': comingSoonMinimalContent,
  'coming-soon-vibrant': comingSoonVibrantContent,
};

/**
 * Get resolved (spintax-free) preview content for a template.
 * Uses template ID hash as seed for deterministic output.
 */
export function getPreviewContent(templateId: string): PreviewContent {
  const raw = templatePreviewContent[templateId];
  if (!raw) {
    // Fallback generic content
    return {
      companyName: 'Acme Inc.',
      headline: 'Transform Your Business Today',
      subheadline: 'Discover how we can help you achieve your goals.',
      cta: 'Get Started →',
      offerName: 'Our Premium Offer',
      offerDescription: 'Everything you need to succeed, all in one place.',
      sellingPoints: ['Professional quality', 'Fast delivery', 'Expert support', 'Satisfaction guaranteed'],
      testimonials: [
        { quote: 'Absolutely incredible service. Exceeded all expectations.', name: 'Jane Smith', title: 'Happy Customer' },
        { quote: 'The best investment we\'ve made this year.', name: 'John Doe', title: 'Business Owner' },
      ],
      phone: '(888) 555-0100',
      email: 'hello@example.com',
    };
  }
  // Generate a simple seed from the template ID for deterministic spintax resolution
  const seed = templateId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return resolvePreviewContent(raw, seed);
}