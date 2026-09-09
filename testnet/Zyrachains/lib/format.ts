/**
 * Shared number / value formatting helpers used across the homepage data center.
 */

const EM_DASH = '\u2014';

/** Format a USD price with adaptive precision (more decimals for small prices). */
export function fmtUsd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

/** Compact USD for large figures: $1.53B, $14.42B, $980.0M. */
export function fmtMoneyCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

/** Compact plain number: 10.63B, 100.00B, 6.17B, 12.4K. */
export function fmtCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

/** Full integer with thousands separators: 26,920,046. */
export function fmtInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

/** Pi amount with up to 7 decimals: 1,234.5670000 π. */
export function fmtPi(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 7 })} \u03c0`;
}

/** Pi amount in compact form: 1.23M π. */
export function fmtPiCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return EM_DASH;
  return `${fmtCompact(n)} \u03c0`;
}

/** Short hash / address: GABC12…WXYZ. */
export function shortHash(h: string | null | undefined, lead = 6, tail = 4): string {
  if (!h) return EM_DASH;
  if (h.length <= lead + tail + 1) return h;
  return `${h.slice(0, lead)}\u2026${h.slice(-tail)}`;
}

/** Relative time: 12s ago, 5m ago, 2h ago, 3d ago. */
export function timeAgo(ts: string | number | Date | undefined | null): string {
  if (!ts) return EM_DASH;
  const t = ts instanceof Date ? ts.getTime() : new Date(ts).getTime();
  if (Number.isNaN(t)) return EM_DASH;
  const diff = (Date.now() - t) / 1000;
  if (diff < 5) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export interface ChangeFormat {
  text: string;
  isGain: boolean;
  isFlat: boolean;
  color: string;
}

/** Percentage change with sign, direction and color class. */
export function formatChange(change?: number | null): ChangeFormat | null {
  if (change == null || Number.isNaN(change)) return null;
  const isFlat = Math.abs(change) < 0.005;
  const isGain = change >= 0;
  const prefix = isGain ? '+' : '';
  return {
    text: `${prefix}${change.toFixed(2)}%`,
    isGain,
    isFlat,
    color: isFlat ? 'text-muted-foreground' : isGain ? 'text-success' : 'text-danger',
  };
}
