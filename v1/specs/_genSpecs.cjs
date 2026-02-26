/**
 * Generator — creates 12 template spec .ts files + index.ts registry.
 * Run: node v1/specs/_genSpecs.cjs
 */
const fs = require('fs');
const p = require('path');
const D = __dirname;
const svc = (t,d,i) => ({title:t,description:d,icon:i});
const tm = (q,n,t) => ({quote:q,name:n,title:t});
const ff = (n,t,ph,r) => ({name:n,type:t,placeholder:ph,required:r});
const FS=[ff('name','text','Name',true),ff('email','email','Email',true),ff('phone','tel','Phone',false),ff('message','textarea','Tell us more...',false)];
const FE=[ff('email','email','Your Email',true)];
const FU=[ff('name','text','Full Name',true),ff('email','email','Work Email',true),ff('company','text','Company',false)];
const FR=[ff('name','text','Full Name',true),ff('email','email','Email',true),ff('company','text','Company / Title',false)];
const ALL = [];
function add(id,sid,cat,goal,th,pc,mn,md,tg,h,sh,cl,spH,lg,svH,sv,tmH,tms,fH,fS,fC,fm){
  ALL.push({id,sid,cat,goal,th,pc,mn,md,tg,h,sh,cl,spH,lg,svH,sv,tmH,tms,fH,fS,fC,fm});
}

add('v1-saas-modern-light','saas-modern-light','saas','signup','theme-saas-modern-light','saas',
  'SaaS Modern Light','Clean modern SaaS page with blue tones.',['saas','modern','light','blue'],
  'Ship Better Software, Faster','The all-in-one platform teams love. Start free — no credit card required.','Start Free Trial',
  'Trusted by 2,000+ Teams',['google','stripe','shopify','slack'],'Everything You Need',
  [svc('Real-Time Analytics','Track every metric with live dashboards.','chart'),svc('Team Collaboration','Shared workspaces for seamless teamwork.','users'),svc('Integrations','Connect 200+ tools.','plug'),svc('Enterprise Security','SOC 2 compliant.','shield')],
  'What Teams Are Saying',
  [tm('Cut deploy time by 60%.','Sarah K.','VP Engineering'),tm('Best DX we have ever had.','Marcus L.','CTO'),tm('Just works out of the box.','Priya R.','Product Lead')],
  'Ready to Transform Your Workflow?','Sign up in 30 seconds. No credit card.','Get Started Free',FU);

add('v1-saas-dark-purple','saas-dark-purple','saas','signup','theme-saas-dark-purple','saas',
  'SaaS Dark Purple','Dark-mode SaaS page with purple accents for dev tools.',['saas','dark','purple','developer'],
  'Build at the Speed of Thought','A developer-first platform to ship confidently.','Start Building Free',
  'Powering the Best Dev Teams',['github','vercel','netlify','docker'],'Developer-First Features',
  [svc('CLI & SDK','First-class CLI tools and SDKs.','terminal'),svc('CI/CD Pipelines','Automated build and deploy.','refresh'),svc('Edge Deployment','200+ global edge nodes.','globe'),svc('Observability','Logs, traces, metrics unified.','search')],
  'Developers Love Us',
  [tm('DX is unmatched. Adopted overnight.','Jake T.','Staff Engineer'),tm('20-min deploys now take 20 sec.','Aisha M.','DevOps Lead'),tm('Edge perf justified the switch.','Chen W.','SRE')],
  'Start Shipping Today','Free: 100K requests/month. No credit card.','Create Account',[ff('email','email','Email',true),ff('name','text','Full Name',true)]);

add('v1-ecommerce-clean-warm','ecommerce-clean-warm','product','checkout','theme-ecommerce-clean-warm','ecommerce',
  'E-commerce Clean Warm','Warm, inviting page for lifestyle brands.',['ecommerce','clean','warm','lifestyle'],
  'Curated Collections, Crafted for You','Handpicked products for warmth and style.','Shop the Collection',
  'Featured In',['vogue','elle','gq','cosmopolitan'],'Why Shop With Us',
  [svc('Free Shipping','On orders over $50.','truck'),svc('Easy Returns','30-day hassle-free.','refresh'),svc('Sustainable Materials','Ethically sourced.','leaf'),svc('Gift Wrapping','Available at checkout.','gift')],
  'Loved by Our Customers',
  [tm('Quality exceeded expectations.','Emma L.','Verified Buyer'),tm('Fast shipping, beautiful packaging.','David R.','Repeat Customer'),tm('My new favorite store.','Sophie M.','VIP Member')],
  'Your New Favorites Await','Join for early access and exclusive offers.','Join & Save 15%',FE);

add('v1-ecommerce-bold-red','ecommerce-bold-red','product','checkout','theme-ecommerce-bold-red','ecommerce',
  'E-commerce Bold Red','Bold red CTAs for aggressive e-commerce.',['ecommerce','bold','red','fashion'],
  'Bold Style, Unbeatable Value','Limited drops. Premium quality. Get it before it is gone.','Shop Now',
  'As Seen In',['forbes','wired','techcrunch','bloomberg'],'The Difference',
  [svc('Flash Sales','Weekly drops — up to 70% off.','tag'),svc('Premium Quality','Built to last.','star'),svc('Express Delivery','Next-day on all orders.','truck'),svc('VIP Access','Early access for members.','key')],
  'Customer Reviews',
  [tm('Best shopping experience ever.','Alex P.','Verified'),tm('Quality for this price is insane.','Jordan B.','Reviewer'),tm('Third order already.','Nina S.','VIP')],
  'Do Not Miss Out','New drop Friday. Be the first to know.','Get Early Access',FE);

add('v1-local-services-trust','local-services-trust','leadgen','call','theme-local-services-trust','local',
  'Local Services Trust','High-trust lead gen for local service businesses.',['local-services','trust','contractor','plumber'],
  'Your Trusted Local Experts — Fast, Reliable Service','Licensed, insured, and ready to help. Call now for a free estimate.','Get a Free Estimate',
  'Trusted by Homeowners',['bbb','google-reviews','homeadvisor','angies-list'],'What We Offer',
  [svc('Emergency Repairs','24/7 same-day service.','wrench'),svc('Full Installations','Licensed pros for installs.','tool'),svc('Maintenance Plans','Preventive care saves money.','shield'),svc('Free Inspections','Honest assessments, upfront pricing.','search')],
  'What Our Customers Say',
  [tm('Fixed our burst pipe at 2 AM — lifesavers.','Robert M.','Homeowner'),tm('Honest, fair pricing.','Jennifer H.','Property Manager'),tm('Only contractor I will call again.','Tom R.','Customer')],
  'Ready to Get Started?','Fill out the form and we will be in touch within the hour.','Request a Callback',FS);

add('v1-eco-friendly-services','eco-friendly-services','leadgen','form','theme-eco-friendly','eco',
  'Eco-Friendly Services','Green-themed page for landscaping, eco cleaning, sustainable services.',['eco','green','landscaping','cleaning'],
  'Sustainable Solutions for a Greener Tomorrow','Eco-conscious services that care for your home and the planet.','Get a Green Quote',
  'Certified & Eco-Friendly',['epa','green-seal','b-corp','leed'],'Our Green Services',
  [svc('Organic Lawn Care','Chemical-free treatments for lush lawns.','leaf'),svc('Eco Cleaning','Plant-based products, zero harsh chemicals.','sparkle'),svc('Sustainable Landscaping','Native plants, water-smart design.','tree'),svc('Green Waste Removal','Responsible recycling and composting.','recycle')],
  'Happy Eco-Conscious Clients',
  [tm('Our yard has never looked better — naturally.','Karen W.','Homeowner'),tm('Love that they use only green products.','Mike D.','Business Owner'),tm('Responsible, reliable, and affordable.','Lisa T.','Property Manager')],
  'Go Green Today','Request a free consultation and join the green movement.','Book a Free Consultation',FS);
// MORE_BELOW

