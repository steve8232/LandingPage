import type { V1ContentOverrides } from '../../v1/composer/composeV1Template';

export type V1EditorSessionV1 = {
  version: 1;
  id: string;
  templateId: string;
  overrides?: V1ContentOverrides;
  savedAt: number;
};

const ACTIVE_SESSION_ID_KEY = 'lpdesigner:v1:activeSessionId';
const SESSION_KEY_PREFIX = 'lpdesigner:v1:session:';
const PANEL_WIDTH_PX_KEY = 'lpdesigner:v1:panelWidthPx';

export function makeClientResultId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof (c as any).randomUUID === 'function') return (c as any).randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`;
}

export function saveActiveV1EditorSession(session: V1EditorSessionV1): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(sessionKey(session.id), JSON.stringify(session));
  window.localStorage.setItem(ACTIVE_SESSION_ID_KEY, session.id);
}

export function loadActiveV1EditorSession(): V1EditorSessionV1 | null {
  if (typeof window === 'undefined') return null;
  const id = window.localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  if (!id) return null;
  const raw = window.localStorage.getItem(sessionKey(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<V1EditorSessionV1>;
    if (parsed.version !== 1) return null;
    if (typeof parsed.id !== 'string' || typeof parsed.templateId !== 'string') return null;
    if (typeof parsed.savedAt !== 'number') return null;
    return parsed as V1EditorSessionV1;
  } catch {
    return null;
  }
}

export function clearActiveV1EditorSession(): void {
  if (typeof window === 'undefined') return;
  const id = window.localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  if (id) window.localStorage.removeItem(sessionKey(id));
  window.localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
}

export function loadV1PanelWidthPx(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PANEL_WIDTH_PX_KEY);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 240 || n > 1600) return null;
  return n;
}

export function saveV1PanelWidthPx(widthPx: number): void {
  if (typeof window === 'undefined') return;
  if (!Number.isFinite(widthPx)) return;
  window.localStorage.setItem(PANEL_WIDTH_PX_KEY, String(Math.round(widthPx)));
}

