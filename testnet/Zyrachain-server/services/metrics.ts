type CounterKey =
  | 'pctScan.runs'
  | 'pctScan.walletsProcessed'
  | 'pctScan.walletsFailed'
  | 'pctScan.horizon429'
  | 'pctScan.durationMs'
  | 'v2Home.cacheHit'
  | 'v2Home.cacheMiss'
  | 'v2Home.builtOnRequest'
  | 'v2Home.durationMs';

const counters = new Map<CounterKey, number>();

export function inc(key: CounterKey, by = 1): void {
  counters.set(key, (counters.get(key) ?? 0) + by);
}

export function setGauge(key: CounterKey, value: number): void {
  counters.set(key, value);
}

export function time<T>(key: CounterKey, fn: () => Promise<T>): Promise<T> {
  const started = Date.now();
  return fn().finally(() => {
    inc(key, Date.now() - started);
  });
}

export function getMetricsSnapshot(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of counters.entries()) out[k] = v;
  return out;
}

