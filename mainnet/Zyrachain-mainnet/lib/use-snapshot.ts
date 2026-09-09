'use client';

import { useEffect, useRef, useState } from 'react';

export interface SnapshotState<T> {
  data: T | null;
  updatedAt: string | null;
  live: boolean;
  error: boolean;
  loading: boolean;
}

/**
 * Polls a /api/v2/home/{segment} snapshot on an interval.
 * Keeps previous data on transient failures and exposes a `live` flag once a
 * successful poll has completed (used to render the LIVE indicator).
 */
export function useSnapshotPoll<T = unknown>(
  segment: string,
  intervalMs = 7000,
  initial: T | null = null,
  initialUpdatedAt: string | null = null,
  fresh = true,
): SnapshotState<T> {
  const [state, setState] = useState<SnapshotState<T>>({
    data: initial,
    updatedAt: initialUpdatedAt,
    live: false,
    error: false,
    loading: initial == null,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let id: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const url = `/api/v2/home/${encodeURIComponent(segment)}${fresh ? '?fresh=1' : ''}`;
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        if (!mounted.current) return;
        if (json && json.success && json.data !== undefined) {
          setState({
            data: json.data as T,
            updatedAt: json.updatedAt ?? new Date().toISOString(),
            live: true,
            error: false,
            loading: false,
          });
        } else {
          setState((s) => ({ ...s, error: s.data == null, loading: false }));
        }
      } catch {
        if (!mounted.current) return;
        setState((s) => ({ ...s, error: s.data == null, loading: false }));
      }
    }

    poll();
    id = setInterval(poll, intervalMs);

    return () => {
      mounted.current = false;
      if (id) clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, intervalMs, fresh]);

  return state;
}
