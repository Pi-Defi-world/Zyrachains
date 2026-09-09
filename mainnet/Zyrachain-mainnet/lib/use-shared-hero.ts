'use client';
import { useSyncExternalStore } from 'react';

type HeroSnapshot = Record<string, unknown> & {
  priceUsd?: number;
  market_cap_usd?: number;
  fdv_usd?: number;
  total_circulating_supply?: number;
  total_supply?: number;
  total_locked?: number;
  latest_block?: number;
  tps?: number;
  high24hUsd?: number;
  low24hUsd?: number;
  priceChange24h?: number;
  marketCapChange24h?: number;
  confidenceScore?: number;
  updatedAt?: string;
};

type Subscriber = () => void;
type Snapshot = { data: HeroSnapshot | null; live: boolean; updatedAt: string | null; error: boolean };

const POLL_MS = 5000;

function createHeroStore(seed: HeroSnapshot | null) {
  let _data: HeroSnapshot | null = seed;
  let _live = false;
  let _updatedAt: string | null = null;
  let _error = false;
  const subscribers = new Set<Subscriber>();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let subscriberCount = 0;
  // Refs cached outside render for stable identity
  let _cached: Snapshot = { data: _data, live: _live, updatedAt: _updatedAt, error: _error };

  function _emitLazy() {
    const next: Snapshot = { data: _data, live: _live, updatedAt: _updatedAt, error: _error };
    // Only notify if something actually changed (shallow check on data + live flags)
    if (
      next.data !== _cached.data ||
      next.live !== _cached.live ||
      next.updatedAt !== _cached.updatedAt ||
      next.error !== _cached.error
    ) {
      _cached = next;
      for (const cb of subscribers) cb();
    }
  }

  function emit() {
    _emitLazy();
  }

  function getSnapshot(): Snapshot {
    return _cached;
  }

  function getServerSnapshot(): Snapshot {
    return _cached;
  }

  function subscribe(cb: Subscriber) {
    subscribers.add(cb);
    subscriberCount++;
    if (subscriberCount === 1) start();
    return () => {
      subscribers.delete(cb);
      subscriberCount--;
      if (subscriberCount === 0) stop();
    };
  }

  async function poll() {
    try {
      const res = await fetch('/api/v2/home/hero?fresh=1', { cache: 'no-store' });
      const json = await res.json();
      if (json?.success && json.data) {
        _data = { ..._data, ...json.data };
        _updatedAt = json.updatedAt ?? new Date().toISOString();
        _live = true;
        _error = false;
      } else if (!_data) {
        _error = true;
      }
    } catch {
      if (!_data) _error = true;
    }
    emit();
  }

  function start() {
    if (_data) _cached = { data: _data, live: _live, updatedAt: _updatedAt, error: _error };
    poll();
    intervalId = setInterval(poll, POLL_MS);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return { subscribe, getSnapshot, getServerSnapshot };
}

/** Created once, lazily, with no initial seed. */
let _store: ReturnType<typeof createHeroStore> | null = null;

function getOrCreateStore(initial: HeroSnapshot | null): ReturnType<typeof createHeroStore> {
  if (!_store) {
    _store = createHeroStore(initial);
  }
  return _store;
}

/** Shared hook — every component gets the same hero data from one global poll. */
export function useSharedHero(initial: HeroSnapshot | null = null) {
  const store = getOrCreateStore(initial);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
