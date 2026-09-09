/**
 * Minimal smoke test for snapshot-backed endpoints.
 * Run: pnpm -C Zyrachain-server ts-node scripts/smoke-v2-home.ts
 */
import axios from 'axios';

async function main() {
  const base = (process.env.SERVER_URL || 'http://localhost:4000').replace(/\/$/, '');
  const endpoints = [
    '/api/v2/home/hero',
    '/api/v2/home/latest-blocks',
    '/api/v2/home/latest-transactions',
    '/api/v2/home/latest-ops',
    '/api/v2/home/pulse',
    '/api/v2/home/top-wallets',
    '/api/v2/home/cex-flows',
    '/api/v2/home/assets-pools',
    '/api/v2/home/ecosystem-leaderboards',
  ];

  for (const ep of endpoints) {
    const url = `${base}${ep}`;
    const r = await axios.get(url, { timeout: 15000 });
    if (!r.data?.success) {
      throw new Error(`${ep} returned success=false`);
    }
    console.log(`[ok] ${ep}`);
  }
}

main().catch((e) => {
  console.error('[smoke-v2-home] failed:', e?.message || e);
  process.exit(1);
});

