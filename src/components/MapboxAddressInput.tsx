'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import {
  getMapboxToken,
  getSuggestions,
  newSessionToken,
  retrieveFeature,
  type MapboxFeature,
  type MapboxSuggestion,
} from '@/lib/mapbox/searchBox';

/**
 * Autocomplete address input backed by Mapbox Search Box API.
 *
 *   /suggest on keystroke (debounced) → list of US street addresses
 *   /retrieve on select → full feature with structured city/region/coords
 *
 * Falls back to a plain text input when NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is
 * unset, so the surface still works in environments without the token.
 *
 * Calls `onSelect(feature)` once the user picks a suggestion; calls
 * `onChange(value)` on every keystroke so the parent stays in sync.
 */

const DEBOUNCE_MS = 200;

export interface MapboxAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (feature: MapboxFeature) => void;
  placeholder?: string;
  /** Adds `id` to the inner <input> so a parent <label htmlFor> can bind. */
  inputId?: string;
  disabled?: boolean;
}

export default function MapboxAddressInput(props: MapboxAddressInputProps) {
  const { value, onChange, onSelect, placeholder, inputId, disabled } = props;
  const fallbackId = useId();
  const id = inputId ?? fallbackId;
  const hasToken = useRef<boolean>(getMapboxToken() !== null);
  const sessionRef = useRef<string>(newSessionToken());

  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [resolving, setResolving] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const out = await getSuggestions(q, sessionRef.current, { signal: ctrl.signal });
      if (!ctrl.signal.aborted) {
        setSuggestions(out);
        setHighlight(out.length > 0 ? 0 : -1);
      }
    } catch {
      // Network/auth errors are silent — the input still works as plain text.
      if (!ctrl.signal.aborted) setSuggestions([]);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasToken.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < 3) { setSuggestions([]); setLoading(false); return; }
    debounceRef.current = setTimeout(() => { void fetchSuggestions(q); }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, fetchSuggestions]);

  async function handlePick(s: MapboxSuggestion) {
    setOpen(false);
    setResolving(true);
    try {
      const feature = await retrieveFeature(s.mapboxId, sessionRef.current);
      if (feature) {
        onChange(feature.streetAddress || s.name);
        onSelect(feature);
      } else {
        onChange(s.name);
      }
    } catch {
      onChange(s.name);
    } finally {
      setResolving(false);
      // Rotate the session token: /retrieve closes the prior billing session.
      sessionRef.current = newSessionToken();
      setSuggestions([]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(suggestions.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') {
      if (highlight >= 0 && highlight < suggestions.length) {
        e.preventDefault(); void handlePick(suggestions[highlight]);
      }
    } else if (e.key === 'Escape') { setOpen(false); }
  }

  const showDropdown = hasToken.current && open && (loading || suggestions.length > 0);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? 'Start typing an address…'}
          disabled={disabled || resolving}
          autoComplete="off"
          className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
        />
        {(loading || resolving) && (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>
      {showDropdown && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
          {suggestions.map((s, idx) => (
            <li key={s.mapboxId}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); void handlePick(s); }}
                onMouseEnter={() => setHighlight(idx)}
                className={`w-full text-left px-3 py-2 text-sm ${idx === highlight ? 'bg-orange-50' : 'bg-white'} hover:bg-orange-50`}
              >
                <div className="font-medium text-gray-900 truncate">{s.name}</div>
                <div className="text-xs text-gray-500 truncate">{s.placeFormatted}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
