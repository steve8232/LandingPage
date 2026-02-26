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
import { renderSocialProofLogos } from './SocialProofLogos';
import { renderServiceList } from './ServiceList';
import { renderImagePair } from './ImagePair';
import { renderTestimonialsCards } from './TestimonialsCards';
import { renderFinalCTA } from './FinalCTA';

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
  HeroSplit: renderHeroSplit as SectionRenderer,
  SocialProofLogos: renderSocialProofLogos as SectionRenderer,
  ServiceList: renderServiceList as SectionRenderer,
  ImagePair: renderImagePair as SectionRenderer,
  TestimonialsCards: renderTestimonialsCards as SectionRenderer,
  FinalCTA: renderFinalCTA as SectionRenderer,
};

