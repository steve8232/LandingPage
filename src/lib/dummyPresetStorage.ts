import { isDummyPresetId, type DummyPresetId } from '@/lib/dummyPresets';

// v1-only generator: remember last selected dummy preset across refreshes.
// Keep key names versioned to avoid collisions with any legacy flows.
const LAST_PRESET_KEY = 'lpdesigner:v1:lastDummyPresetId';

export function loadLastDummyPresetId(): DummyPresetId | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LAST_PRESET_KEY);
  if (!raw) return null;
  return isDummyPresetId(raw) ? raw : null;
}

export function saveLastDummyPresetId(id: DummyPresetId): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_PRESET_KEY, id);
}

