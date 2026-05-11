/**
 * v1 Spec Registry
 *
 * Central index of all v1 template specs.  The composer and adapter use this
 * to look up specs by templateId.
 *
 * To add a new spec:
 *   1. Create a file in /v1/specs/ that default-exports a TemplateSpec
 *   2. Import and register it here
 */

import { TemplateSpec } from './schema';

// Home services
import v1Plumber from './v1-plumber';
import v1Hvac from './v1-hvac';
import v1Electrical from './v1-electrical';
import v1Roofing from './v1-roofing';
import v1Painters from './v1-painters';
import v1Fencing from './v1-fencing';
import v1PressureWashing from './v1-pressure-washing';
import v1WindowCleaning from './v1-window-cleaning';
import v1JunkRemoval from './v1-junk-removal';
import v1HouseCleaning from './v1-house-cleaning';
import v1CarpetCleaning from './v1-carpet-cleaning';

// Outdoor / yard
import v1LawnLandscaping from './v1-lawn-landscaping';
import v1TreeService from './v1-tree-service';
import v1PoolService from './v1-pool-service';

// Wellness
import v1MedSpa from './v1-med-spa';
import v1PersonalTrainer from './v1-personal-trainer';
import v1DogGrooming from './v1-dog-grooming';

// Auto
import v1AutoDetail from './v1-auto-detail';

/** All registered v1 specs, keyed by templateId. */
export const v1Specs: Record<string, TemplateSpec> = {
  [v1Plumber.templateId]: v1Plumber,
  [v1Hvac.templateId]: v1Hvac,
  [v1Electrical.templateId]: v1Electrical,
  [v1Roofing.templateId]: v1Roofing,
  [v1Painters.templateId]: v1Painters,
  [v1Fencing.templateId]: v1Fencing,
  [v1PressureWashing.templateId]: v1PressureWashing,
  [v1WindowCleaning.templateId]: v1WindowCleaning,
  [v1JunkRemoval.templateId]: v1JunkRemoval,
  [v1HouseCleaning.templateId]: v1HouseCleaning,
  [v1CarpetCleaning.templateId]: v1CarpetCleaning,
  [v1LawnLandscaping.templateId]: v1LawnLandscaping,
  [v1TreeService.templateId]: v1TreeService,
  [v1PoolService.templateId]: v1PoolService,
  [v1MedSpa.templateId]: v1MedSpa,
  [v1PersonalTrainer.templateId]: v1PersonalTrainer,
  [v1DogGrooming.templateId]: v1DogGrooming,
  [v1AutoDetail.templateId]: v1AutoDetail,
};

/** Check if a templateId belongs to the v1 system. */
export function isV1Template(templateId: string): boolean {
  return templateId in v1Specs;
}

/** Get a v1 spec by templateId, or undefined if not found. */
export function getV1Spec(templateId: string): TemplateSpec | undefined {
  return v1Specs[templateId];
}

/** Get all registered v1 templateIds. */
export function getAllV1TemplateIds(): string[] {
  return Object.keys(v1Specs);
}

