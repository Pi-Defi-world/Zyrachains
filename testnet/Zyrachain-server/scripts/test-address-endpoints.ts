/*
  Script: test-address-endpoints.ts
  Purpose: Exercise the server ecosystem endpoints for wallet address data
           and validate that records contain a valid Pi (Stellar) address.

  Usage:
    pnpm ts-node scripts/test-address-endpoints.ts
    or build first then run with node if ts-node is unavailable.

  Environment:
    - SERVER_URL (optional). Defaults to http://localhost:4000
*/

/* eslint-disable no-console */

const SERVER_URL = process.env.SERVER_URL || 'https://piclubhouse-server.onrender.com';
const ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

type AnyRecord = Record<string, any>;

function findPiAddressDeep(record: AnyRecord): string | null {
  // Common direct fields
  const candidates = [
    record?.address,
    record?.identifier,
    record?.account,
    record?.account_id,
    record?.wallet_address,
    record?.addr,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && ADDRESS_REGEX.test(c)) return c;
  }

  // Deep search across nested objects/arrays
  const stack: any[] = [record];
  const seen = new Set<any>();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
    seen.add(cur);
    for (const value of Object.values(cur)) {
      if (typeof value === 'string' && ADDRESS_REGEX.test(value)) return value;
      if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === 'string' && ADDRESS_REGEX.test(v)) return v;
          if (v && typeof v === 'object') stack.push(v);
        }
      } else if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }
  return null;
}

async function fetchJson(url: string): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  const body: any = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function testEndpoint(type: string) {
  const url = `${SERVER_URL}/api/ecosystem?type=${encodeURIComponent(type)}`;
  console.log(`\n▶ Testing: ${url}`);

  const { ok, status, body } = await fetchJson(url);
  console.log(`HTTP ${status} ok=${ok}`);

  if (!ok) {
    console.log('Response:', body);
    return { total: 0, valid: 0, invalid: 0, sampleInvalid: [] as AnyRecord[] };
  }

  // Accept multiple shapes: { data: [...] }, { items: [...] }, { data: { items: [...] } }, or raw array
  const arrays = [body?.data, body?.items, body?.data?.items, Array.isArray(body) ? body : null]
    .filter((v) => Array.isArray(v)) as AnyRecord[][];
  const items: AnyRecord[] = arrays[0] || [];
  const total = items.length;
  let valid = 0;
  let invalid = 0;
  const sampleInvalid: AnyRecord[] = [];

  for (const rec of items) {
    const addr = findPiAddressDeep(rec);
    if (addr) {
      valid++;
    } else {
      invalid++;
      if (sampleInvalid.length < 5) sampleInvalid.push(rec);
    }
  }

  console.log(`Found: ${total}, Valid addresses: ${valid}, Invalid/missing: ${invalid}`);
  if (sampleInvalid.length) {
    console.log('Sample invalid records (max 5):');
    for (const s of sampleInvalid) {
      console.log(JSON.stringify(s, null, 2));
    }
  }

  return { total, valid, invalid, sampleInvalid };
}

async function main() {
  console.log(`Server: ${SERVER_URL}`);
  const endpoints = ['core-team-addresses', 'cex-addresses', 'generated-addresses'];
  const results: Record<string, any> = {};
  for (const t of endpoints) {
    // eslint-disable-next-line no-await-in-loop
    results[t] = await testEndpoint(t);
  }

  // Summary
  console.log('\n=== Summary ===');
  for (const [key, { total, valid, invalid }] of Object.entries(results)) {
    console.log(`${key}: total=${total}, valid=${valid}, invalid=${invalid}`);
  }
}

main().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});

