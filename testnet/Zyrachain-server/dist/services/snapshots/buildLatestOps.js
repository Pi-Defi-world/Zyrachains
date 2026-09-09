"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLatestOps = buildLatestOps;
const snapshotStore_1 = require("./snapshotStore");
const horizonMainnet_1 = require("./horizonMainnet");
async function buildLatestOps(limit = 20) {
    const h = (0, horizonMainnet_1.getHorizonMainnet)();
    const { data } = await h.get('/operations', {
        params: { order: 'desc', limit },
    });
    const records = data._embedded?.records ?? [];
    const payload = {
        records,
        horizonLinks: data._links,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('latest_ops', payload);
    return payload;
}
//# sourceMappingURL=buildLatestOps.js.map