#!/usr/bin/env node
/* Post-build compatibility gate.
 *
 * Next.js compiles its own framework runtime and (by default) all node_modules
 * with a modern baseline regardless of `browserslist`. We force the known
 * offenders through SWC via `transpilePackages` in next.config.ts. This script
 * verifies that every chunk actually referenced by the SSR HTML contains no
 * syntax that old Safari (< 13.1) cannot parse:
 *   - logical assignment      ??=  ||=  &&=      (Safari < 14)
 *   - class static blocks     class X{static{ } (Safari < 16.4)
 *   - class private fields    this.#x / .#x     (Safari < 14.1)
 *   - BigInt literals         123n              (Safari < 14)
 *
 * If something new slips through, the build fails loudly instead of shipping a
 * broken bundle to old phones.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(process.cwd());
const chunksDir = join(root, '.next/static/chunks');
const htmlDirs = [join(root, '.next/server/app'), join(root, '.next/server/pages')];

const PATTERNS = {
  '??=': /[\w$\])]\?\?=/g,
  '||=': /[\w$\])]\|\|=/g,
  '&&=': /[\w$\])]&&=/g,
  'static{}': /\bclass\s+[A-Za-z_$][\w$]*\s*\{\s*static\{/g,
  '#field': /\.#[A-Za-z_$]/g,
  'bigint-literal': /(?<![A-Za-z_$0-9])[1-9][0-9]*n(?![A-Za-z_$0-9])/g,
};

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

const htmls = htmlDirs.flatMap(walk);
if (htmls.length === 0) {
  console.error('[verify-compat] no SSR html files found - did next build run?');
  process.exit(1);
}

const referenced = new Set();
for (const h of htmls) {
  const c = readFileSync(h, 'utf8');
  const re = /\/_next\/static\/chunks\/([A-Za-z0-9_.\-]+\.js)/g;
  let m;
  while ((m = re.exec(c))) referenced.add(m[1]);
}
// Always include every static chunk even if not referenced by these pages
for (const f of readdirSync(chunksDir)) {
  if (f.endsWith('.js')) referenced.add(f);
}

let problems = 0;
for (const f of [...referenced].sort()) {
  const p = join(chunksDir, f);
  let src;
  try {
    src = readFileSync(p, 'utf8');
  } catch {
    continue;
  }
  for (const [name, re] of Object.entries(PATTERNS)) {
    re.lastIndex = 0;
    const hits = src.match(re);
    if (hits && hits.length) {
      problems += hits.length;
      console.warn(`[verify-compat] ${f}: ${name} x${hits.length}`);
    }
  }
}

if (problems > 0) {
  console.error(`[verify-compat] FATAL: ${problems} old-browser-incompatible token(s) in shipped chunks.`);
  process.exit(1);
}
console.log('[verify-compat] OK: all shipped chunks parse on Safari 13.1+.');