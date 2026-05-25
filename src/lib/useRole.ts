'use client';

import { useEffect, useState } from 'react';

export type SparkPageRole = 'admin' | 'user';

/**
 * Client-side companion to `src/lib/auth/role.ts`. Fetches /api/me/role and
 * exposes the resolved role + loading flag so Client Components can gate UI
 * without re-running server logic.
 *
 *   - `role === null`           — anonymous (or fetch failed).
 *   - `role === 'admin'|'user'` — signed-in, profile resolved.
 */
export function useRole(): { role: SparkPageRole | null; loading: boolean } {
  const [role, setRole] = useState<SparkPageRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/me/role', { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (cancelled) return;
        const r = (data && (data.role === 'admin' || data.role === 'user'))
          ? (data.role as SparkPageRole)
          : null;
        setRole(r);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRole(null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { role, loading };
}
