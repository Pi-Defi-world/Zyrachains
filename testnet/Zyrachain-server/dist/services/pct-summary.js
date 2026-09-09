"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshPctSummary = refreshPctSummary;
exports.getPctSummary = getPctSummary;
const mongoose_1 = __importDefault(require("mongoose"));
const PI_ADDR = /^G[A-Z2-7]{55}$/;
async function refreshPctSummary() {
    const coreCol = mongoose_1.default.connection.collection('core-team-addresses');
    const cexCol = mongoose_1.default.connection.collection('cex-addresses');
    const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
    const eventsCol = mongoose_1.default.connection.collection('pct-balance-events');
    const metaCol = mongoose_1.default.connection.collection('pct-monitor-meta');
    const summaryCol = mongoose_1.default.connection.collection('pct-summary');
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
    const coreWalletIds = coreIds.map((d) => d.identifier).filter(Boolean);
    const [sumAgg, net24, confirmedChanges] = await Promise.all([
        stateCol
            .aggregate([
            { $match: { identifier: { $in: coreWalletIds } } },
            { $group: { _id: null, total: { $sum: '$lastBalance' } } },
        ])
            .toArray(),
        eventsCol
            .aggregate([
            { $match: { detectedAt: { $gte: new Date(Date.now() - 86400000) }, wallet: { $in: coreWalletIds } } },
            { $group: { _id: null, total: { $sum: '$change' } } },
        ])
            .toArray(),
        stateCol.countDocuments({
            identifier: { $in: coreWalletIds },
            lastBalance: { $lt: 2000000 },
        }),
    ]);
    const summary = {
        _id: 'summary',
        walletsTracked,
        walletsTrackedCoreTeam: coreTracked,
        walletsTrackedCex: cexTracked,
        scannedWallets,
        startingBalance: typeof meta?.baselineSumPiCore === 'number' ? meta.baselineSumPiCore : null,
        startingBalanceAllTracked: typeof meta?.baselineSumPiTracked === 'number' ? meta.baselineSumPiTracked : null,
        currentBalance: typeof sumAgg[0]?.total === 'number' ? sumAgg[0].total : null,
        confirmedChanges,
        totalOut: typeof meta?.baselineSumPiCore === 'number' && typeof sumAgg[0]?.total === 'number'
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
async function getPctSummary() {
    const summaryCol = mongoose_1.default.connection.collection('pct-summary');
    return await summaryCol.findOne({ _id: 'summary' });
}
//# sourceMappingURL=pct-summary.js.map