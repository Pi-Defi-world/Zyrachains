"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHomePulse = buildHomePulse;
const mongoose_1 = __importDefault(require("mongoose"));
const snapshotStore_1 = require("./snapshotStore");
const DAY_MS = 86400000;
async function buildHomePulse() {
    const since = new Date(Date.now() - DAY_MS);
    const eventsCol = mongoose_1.default.connection.collection('pct-balance-events');
    const coreCol = mongoose_1.default.connection.collection('core-team-addresses');
    const cexCol = mongoose_1.default.connection.collection('cex-addresses');
    const coreIds = new Set();
    const cexIds = new Set();
    const [coreDocs, cexDocs] = await Promise.all([
        coreCol.find({}).project({ identifier: 1 }).toArray(),
        cexCol.find({}).project({ identifier: 1 }).toArray(),
    ]);
    for (const d of coreDocs) {
        const id = typeof d.identifier === 'string' ? d.identifier.trim() : '';
        if (id)
            coreIds.add(id);
    }
    for (const d of cexDocs) {
        const id = typeof d.identifier === 'string' ? d.identifier.trim() : '';
        if (id)
            cexIds.add(id);
    }
    let netCore = 0;
    let netCex = 0;
    const recent = await eventsCol.find({ detectedAt: { $gte: since } }).toArray();
    for (const ev of recent) {
        const w = typeof ev.wallet === 'string' ? ev.wallet : '';
        const ch = typeof ev.change === 'number' ? ev.change : 0;
        if (coreIds.has(w))
            netCore += ch;
        if (cexIds.has(w))
            netCex += ch;
    }
    const largest = await eventsCol
        .find({ detectedAt: { $gte: since } })
        .sort({ detectedAt: -1 })
        .limit(50)
        .toArray();
    const largestMoves24h = largest.map((d) => ({
        wallet: String(d.wallet),
        change: typeof d.change === 'number' ? d.change : 0,
        detectedAt: d.detectedAt instanceof Date ? d.detectedAt.toISOString() : String(d.detectedAt ?? ''),
        oldBalance: typeof d.oldBalance === 'number' ? d.oldBalance : undefined,
        newBalance: typeof d.newBalance === 'number' ? d.newBalance : undefined,
    }));
    const payload = {
        netChange24hCoreTeam: netCore,
        netChange24hCex: netCex,
        largestMoves24h,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('home_pulse', payload);
    return payload;
}
//# sourceMappingURL=buildHomePulse.js.map