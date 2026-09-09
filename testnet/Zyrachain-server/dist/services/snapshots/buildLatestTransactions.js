"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLatestTransactions = buildLatestTransactions;
const snapshotStore_1 = require("./snapshotStore");
const horizonMainnet_1 = require("./horizonMainnet");
async function buildLatestTransactions(limit = 20) {
    const h = (0, horizonMainnet_1.getHorizonMainnet)();
    const { data } = await h.get('/transactions', {
        params: { order: 'desc', limit },
    });
    const records = data._embedded?.records ?? [];
    const payload = {
        records,
        horizonLinks: data._links,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('latest_transactions', payload);
    return payload;
}
//# sourceMappingURL=buildLatestTransactions.js.map