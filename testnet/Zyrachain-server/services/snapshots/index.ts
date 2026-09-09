export { buildHomeHero } from './buildHomeHero';
export { buildLatestBlocks } from './buildLatestBlocks';
export { buildLatestOps } from './buildLatestOps';
export { buildLatestTransactions } from './buildLatestTransactions';
export { buildLatestTrades } from './buildLatestTrades';
export { buildHomePulse } from './buildHomePulse';
export { buildTopWallets } from './buildTopWallets';
export { buildCexFlows } from './buildCexFlows';
export { buildAssetsPools } from './buildAssetsPools';
export { buildEcosystemLeaderboards } from './buildEcosystemLeaderboards';

import { buildHomeHero } from './buildHomeHero';
import { buildLatestBlocks } from './buildLatestBlocks';
import { buildLatestOps } from './buildLatestOps';
import { buildLatestTransactions } from './buildLatestTransactions';
import { buildLatestTrades } from './buildLatestTrades';
import { buildHomePulse } from './buildHomePulse';
import { buildTopWallets } from './buildTopWallets';
import { buildCexFlows } from './buildCexFlows';
import { buildAssetsPools } from './buildAssetsPools';
import { buildEcosystemLeaderboards } from './buildEcosystemLeaderboards';

/** Run all snapshot builders (manual / admin). */
export async function runAllSnapshotBuilders(): Promise<void> {
  await buildHomeHero();
  await Promise.all([
    buildLatestBlocks(),
    buildLatestTransactions(),
    buildLatestOps(),
    buildLatestTrades(),
    buildHomePulse(),
    buildTopWallets(),
    buildCexFlows(),
    buildAssetsPools(),
    buildEcosystemLeaderboards(),
  ]);
}
