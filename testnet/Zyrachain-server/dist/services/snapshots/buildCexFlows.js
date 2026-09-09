"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCexFlows = buildCexFlows;
const mongoose_1 = __importDefault(require("mongoose"));
const snapshotStore_1 = require("./snapshotStore");
const DAY_MS = 86400000;
async function buildCexFlows() {
    const since = new Date(Date.now() - DAY_MS);
    const cexCol = mongoose_1.default.connection.collection('cex-addresses');
    const eventsCol = mongoose_1.default.connection.collection('pct-balance-events');
    const cexDocs = await cexCol.find({}).toArray();
    const cexRows = [];
    const namesById = new Map();
    for (const doc of cexDocs) {
        const raw = doc;
        const identifier = typeof raw.identifier === 'string'
            ? raw.identifier.trim()
            : typeof raw.Identifier === 'string'
                ? String(raw.Identifier).trim()
                : '';
        if (!identifier)
            continue;
        const name = (typeof raw.Name === 'string' && raw.Name) ||
            (typeof raw.name === 'string' && raw.name) ||
            'CEX';
        cexRows.push({ identifier, name });
        namesById.set(identifier, name);
    }
    const ids = cexRows.map((r) => r.identifier);
    const aggRows = ids.length
        ? await eventsCol
            .aggregate([
            { $match: { detectedAt: { $gte: since }, wallet: { $in: ids } } },
            {
                $group: {
                    _id: '$wallet',
                    net24h: { $sum: '$change' },
                    in24h: { $sum: { $cond: [{ $gt: ['$change', 0] }, '$change', 0] } },
                    out24h: {
                        $sum: {
                            $cond: [{ $lt: ['$change', 0] }, { $multiply: ['$change', -1] }, 0],
                        },
                    },
                },
            },
        ])
            .toArray()
        : [];
    const aggById = new Map(aggRows.map((r) => [
        String(r._id),
        {
            net24h: typeof r.net24h === 'number' ? r.net24h : 0,
            in24h: typeof r.in24h === 'number' ? r.in24h : 0,
            out24h: typeof r.out24h === 'number' ? r.out24h : 0,
        },
    ]));
    const flows = cexRows.map(({ identifier }) => {
        const row = aggById.get(identifier);
        return {
            identifier,
            name: namesById.get(identifier) || 'CEX',
            net24h: row?.net24h ?? 0,
            in24h: row?.in24h ?? 0,
            out24h: row?.out24h ?? 0,
        };
    });
    flows.sort((a, b) => Math.abs(b.net24h) - Math.abs(a.net24h));
    const payload = {
        flows,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('cex_flows', payload);
    return payload;
}
//# sourceMappingURL=buildCexFlows.js.map