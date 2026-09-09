import cron from 'node-cron';
import {
  buildHomeHero,
  buildLatestBlocks,
  buildLatestTransactions,
  buildLatestOps,
  buildLatestTrades,
  buildHomePulse,
  buildTopWallets,
  buildCexFlows,
  buildAssetsPools,
  buildEcosystemLeaderboards,
} from '../services/snapshots';

function enabled(): boolean {
  return process.env.SNAPSHOT_CRON_ENABLED !== 'false';
}

export function startSnapshotScheduler(): void {
  if (!enabled()) {
    console.log('[snapshotScheduler] disabled (SNAPSHOT_CRON_ENABLED=false)');
    return;
  }

  const running = new Set<string>();
  const jitterMaxMs = Math.max(0, Number(process.env.SNAPSHOT_JITTER_MAX_MS || 1500));
  const randomJitter = () => (jitterMaxMs > 0 ? Math.floor(Math.random() * jitterMaxMs) : 0);

  const safe =
    (name: string, fn: () => Promise<unknown>) =>
    async () => {
      if (running.has(name)) {
        console.warn(`[snapshotScheduler] skip overlapping run for ${name}`);
        return;
      }
      running.add(name);
      try {
        const jitter = randomJitter();
        if (jitter > 0) {
          await new Promise((resolve) => setTimeout(resolve, jitter));
        }
        await fn();
      } catch (e) {
        console.error(`[snapshotScheduler] ${name}:`, e);
      } finally {
        running.delete(name);
      }
    };

  const heroMs = Number(process.env.SNAPSHOT_HERO_INTERVAL_MS || 60_000);
  const fastMs = Number(process.env.SNAPSHOT_FAST_INTERVAL_MS || 30_000);

  setInterval(() => void safe('hero', buildHomeHero)(), Math.max(10_000, heroMs));
  setInterval(() => void safe('latest-blocks', buildLatestBlocks)(), Math.max(10_000, fastMs));
  setInterval(
    () => void safe('latest-transactions', buildLatestTransactions)(),
    Math.max(10_000, fastMs + 3_000)
  );
  setInterval(() => void safe('latest-ops', buildLatestOps)(), Math.max(10_000, fastMs + 6_000));
  setInterval(
    () => void safe('latest-trades', buildLatestTrades)(),
    Math.max(10_000, fastMs + 9_000)
  );

  cron.schedule(process.env.CRON_PULSE || '*/5 * * * *', () => void safe('pulse', buildHomePulse)());
  cron.schedule(
    process.env.CRON_TOP_WALLETS || '*/5 * * * *',
    () => void safe('top-wallets', buildTopWallets)()
  );
  cron.schedule(
    process.env.CRON_CEX_FLOWS || '*/5 * * * *',
    () => void safe('cex-flows', buildCexFlows)()
  );
  cron.schedule(
    process.env.CRON_ASSETS_POOLS || '*/5 * * * *',
    () => void safe('assets-pools', buildAssetsPools)()
  );
  cron.schedule(
    process.env.CRON_ECOSYSTEM || '15 * * * *',
    () => void safe('ecosystem-leaderboards', buildEcosystemLeaderboards)()
  );

  console.log('[snapshotScheduler] started');

  setTimeout(
    () =>
      void safe('bootstrap', async () => {
        await buildHomeHero();
        await buildLatestBlocks();
        await buildLatestTransactions();
        await buildLatestOps();
        await buildLatestTrades();
      })(),
    5000
  );
}
