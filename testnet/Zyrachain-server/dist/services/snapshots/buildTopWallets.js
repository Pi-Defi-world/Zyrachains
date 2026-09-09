"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTopWallets = buildTopWallets;
const mongoose_1 = __importDefault(require("mongoose"));
const snapshotStore_1 = require("./snapshotStore");
const PI_ADDR = /^G[A-Z2-7]{55}$/;
async function buildTopWallets(limit = 100) {
    const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
    const rows = await stateCol
        .find({ identifier: { $regex: PI_ADDR } })
        .sort({ lastBalance: -1 })
        .limit(limit)
        .project({ identifier: 1, lastBalance: 1, lastCheckedAt: 1 })
        .toArray();
    const coreCol = mongoose_1.default.connection.collection('core-team-addresses');
    const cexCol = mongoose_1.default.connection.collection('cex-addresses');
    const genCol = mongoose_1.default.connection.collection('generated-addresses');
    const nameById = new Map();
    const [coreDocs, cexDocs, genDocs] = await Promise.all([
        coreCol.find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
        cexCol.find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
        genCol.find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
    ]);
    const coreSet = new Set();
    const cexSet = new Set();
    const genSet = new Set();
    const ingest = (docs, label, targetSet) => {
        for (const d of docs) {
            const id = typeof d.identifier === 'string' ? d.identifier.trim() : '';
            if (!id)
                continue;
            targetSet.add(id);
            const name = (typeof d.Name === 'string' && d.Name) ||
                (typeof d.name === 'string' && d.name) ||
                label;
            nameById.set(id, name);
        }
    };
    ingest(coreDocs, 'Core Team', coreSet);
    ingest(cexDocs, 'CEX', cexSet);
    ingest(genDocs, 'Generated', genSet);
    const wallets = rows.map((r) => {
        const id = String(r.identifier);
        let category = 'Generated';
        if (cexSet.has(id))
            category = 'CEX';
        else if (coreSet.has(id))
            category = 'Core Team';
        else if (genSet.has(id))
            category = 'Generated';
        return {
            identifier: id,
            name: nameById.get(id) || `Wallet ${id.slice(0, 8)}…`,
            category,
            balance: typeof r.lastBalance === 'number' ? r.lastBalance : null,
            lastCheckedAt: r.lastCheckedAt instanceof Date ? r.lastCheckedAt.toISOString() : r.lastCheckedAt
                ? String(r.lastCheckedAt)
                : null,
        };
    });
    const payload = {
        wallets,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('top_wallets', payload);
    return payload;
}
//# sourceMappingURL=buildTopWallets.js.map