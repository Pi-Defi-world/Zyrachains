import mongoose from 'mongoose';

const PI_ADDR = /^G[A-Z2-7]{55}$/;

export type PctSummaryDoc = {
  _id: 'summary';
  walletsTracked: number;
  walletsTrackedCoreTeam: number;
  walletsTrackedCex: number;
  scannedWallets: number;
  startingBalance: number | null;
  startingBalanceAllTracked: number | null;
  currentBalance: number | null;
  confirmedChanges: number;
  totalOut: number;
  netChange24h: number;
  latestCheck: Date | null;
  scanLock: boolean;
  updatedAt: Date;
};

export async function refreshPctSummary(): Promise<PctSummaryDoc> {
  const coreCol = mongoose.connection.collection('core-team-addresses');
  const cexCol = mongoose.connection.collection('cex-addresses');
  const stateCol = mongoose.connection.collection('pct-wallet-state');
  const eventsCol = mongoose.connection.collection('pct-balance-events');
  const metaCol = mongoose.connection.collection<{
    _id: string;
    baselineSumPiCore?: number | null;
    baselineSumPiTracked?: number | null;
    lastFullScanAt?: Date | null;
    scanLock?: boolean;
  }>('pct-monitor-meta');
  const summaryCol = mongoose.connection.collection<PctSummaryDoc>('pct-summary');

  const [coreTracked, cexTracked] = await Promise.all([
    coreCol.countDocuments({ identifier: { $regex: PI_ADDR } }),
    cexCol.countDocuments({ identifier: { $regex: PI_ADDR } }),
  ]);
  const walletsTracked = coreTracked;
  const scannedWallets = await stateCol.countDocuments({});
  const meta = await metaCol.findOne({ _id: 'meta' });

  const coreIds = await coreCol
    .find({ identifier: { $regex: PI_ADDR } })
    .project({ identifier: 1 })
    .toArray();
  const coreWalletIds = coreIds.map((d) => d.identifier).filter(Boolean) as string[];

  const [sumAgg, net24, confirmedChanges] = await Promise.all([
    stateCol
      .aggregate([
        { $match: { identifier: { $in: coreWalletIds } } },
        { $group: { _id: null, total: { $sum: '$lastBalance' } } },
      ])
      .toArray(),
    eventsCol
      .aggregate([
        { $match: { detectedAt: { $gte: new Date(Date.now() - 86_400_000) }, wallet: { $in: coreWalletIds } } },
        { $group: { _id: null, total: { $sum: '$change' } } },
      ])
      .toArray(),
    stateCol.countDocuments({
      identifier: { $in: coreWalletIds },
      lastBalance: { $lt: 2_000_000 },
    }),
  ]);

  const summary: PctSummaryDoc = {
    _id: 'summary',
    walletsTracked,
    walletsTrackedCoreTeam: coreTracked,
    walletsTrackedCex: cexTracked,
    scannedWallets,
    startingBalance: typeof meta?.baselineSumPiCore === 'number' ? meta.baselineSumPiCore : null,
    startingBalanceAllTracked:
      typeof meta?.baselineSumPiTracked === 'number' ? meta.baselineSumPiTracked : null,
    currentBalance: typeof sumAgg[0]?.total === 'number' ? sumAgg[0].total : null,
    confirmedChanges,
    totalOut:
      typeof meta?.baselineSumPiCore === 'number' && typeof sumAgg[0]?.total === 'number'
        ? sumAgg[0].total - meta.baselineSumPiCore
        : 0,
    netChange24h: typeof net24[0]?.total === 'number' ? net24[0].total : 0,
    latestCheck: meta?.lastFullScanAt ?? null,
    scanLock: !!meta?.scanLock,
    updatedAt: new Date(),
  };

  await summaryCol.updateOne({ _id: 'summary' }, { $set: summary }, { upsert: true });
  return summary;
}

export async function getPctSummary(): Promise<PctSummaryDoc | null> {
  const summaryCol = mongoose.connection.collection<PctSummaryDoc>('pct-summary');
  return await summaryCol.findOne({ _id: 'summary' });
}

