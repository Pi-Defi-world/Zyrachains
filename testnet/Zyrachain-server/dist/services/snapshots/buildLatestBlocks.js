"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLatestBlocks = buildLatestBlocks;
const snapshotStore_1 = require("./snapshotStore");
const horizonMainnet_1 = require("./horizonMainnet");
async function buildLatestBlocks(limit = 20) {
    const h = (0, horizonMainnet_1.getHorizonMainnet)();
    const { data } = await h.get('/ledgers', {
        params: { order: 'desc', limit },
    });
    const records = data._embedded?.records ?? [];
    const payload = {
        records,
        nextCursor: data._links?.next?.href ?? null,
        prevCursor: data._links?.prev?.href ?? null,
        horizonLinks: data._links,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('latest_blocks', payload);
    return payload;
}
//# sourceMappingURL=buildLatestBlocks.js.map