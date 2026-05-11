/**
 * Section Registry
 *
 * Maps section type strings (as used in TemplateSpec.sections[].type) to
 * their render functions.  Adding a new section type is a two-step process:
 *   1. Create the renderer file in /v1/sections/
 *   2. Register it here
 *
 * Architecture decision: the registry is a simple Record so the composer
 * can look up renderers in O(1) without import gymnastics.
 */

import { renderHeroSplit } from './HeroSplit';
import { renderHeroLeadForm } from './HeroLeadForm';
import { renderSocialProofLogos } from './SocialProofLogos';
import { renderServiceList } from './ServiceList';
import { renderImagePair } from './ImagePair';
import { renderTestimonialsCards } from './TestimonialsCards';
import { renderGuaranteeBanner } from './GuaranteeBanner';
import { renderFinalCTA } from './FinalCTA';
import { renderAnnouncementBar } from './AnnouncementBar';
import { renderStickyHeader } from './StickyHeader';
import { renderTrustStrip } from './TrustStrip';
import { renderDifferentiatorBlock } from './DifferentiatorBlock';
import { renderChecklistSection } from './ChecklistSection';
import { renderMidPageCTA } from './MidPageCTA';
import { renderPhotoGalleryStrip } from './PhotoGalleryStrip';
import { renderProcessSteps } from './ProcessSteps';
import { renderFAQAccordion } from './FAQAccordion';
import { renderServiceAreas } from './ServiceAreas';
import { renderGuaranteeBar } from './GuaranteeBar';
import { renderFooter } from './Footer';

/**
 * A section renderer accepts arbitrary props and returns an HTML string.
 * Props are typed within each section file; here we use the generic
 * signature so the registry can hold any renderer.
 */
export type SectionRenderer = (props: Record<string, unknown>) => string;

/**
 * sectionRegistry: type string → render function
 *
 * The composer calls sectionRegistry[entry.type](entry.props) for each
 * section in the spec.
 */
export const sectionRegistry: Record<string, SectionRenderer> = {
  HeroSplit: renderHeroSplit as unknown as SectionRenderer,
  HeroLeadForm: renderHeroLeadForm as unknown as SectionRenderer,
  SocialProofLogos: renderSocialProofLogos as unknown as SectionRenderer,
  ServiceList: renderServiceList as unknown as SectionRenderer,
  ImagePair: renderImagePair as unknown as SectionRenderer,
  TestimonialsCards: renderTestimonialsCards as unknown as SectionRenderer,
  GuaranteeBanner: renderGuaranteeBanner as unknown as SectionRenderer,
  FinalCTA: renderFinalCTA as unknown as SectionRenderer,
  AnnouncementBar: renderAnnouncementBar as unknown as SectionRenderer,
  StickyHeader: renderStickyHeader as unknown as SectionRenderer,
  TrustStrip: renderTrustStrip as unknown as SectionRenderer,
  DifferentiatorBlock: renderDifferentiatorBlock as unknown as SectionRenderer,
  ChecklistSection: renderChecklistSection as unknown as SectionRenderer,
  MidPageCTA: renderMidPageCTA as unknown as SectionRenderer,
  PhotoGalleryStrip: renderPhotoGalleryStrip as unknown as SectionRenderer,
  ProcessSteps: renderProcessSteps as unknown as SectionRenderer,
  FAQAccordion: renderFAQAccordion as unknown as SectionRenderer,
  ServiceAreas: renderServiceAreas as unknown as SectionRenderer,
  GuaranteeBar: renderGuaranteeBar as unknown as SectionRenderer,
  Footer: renderFooter as unknown as SectionRenderer,
};

