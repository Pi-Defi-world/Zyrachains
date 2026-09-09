"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAssetsPools = buildAssetsPools;
const snapshotStore_1 = require("./snapshotStore");
const horizonMainnet_1 = require("./horizonMainnet");
async function buildAssetsPools(assetsLimit = 100, poolsLimit = 20) {
    const h = (0, horizonMainnet_1.getHorizonMainnet)();
    const [assetsRes, poolsRes] = await Promise.all([
        h.get('/assets', { params: { limit: assetsLimit, order: 'desc' } }),
        h.get('/liquidity_pools', { params: { limit: poolsLimit, order: 'desc' } }),
    ]);
    const payload = {
        assets: assetsRes.data,
        pools: poolsRes.data,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('assets_pools', payload);
    return payload;
}
//# sourceMappingURL=buildAssetsPools.js.map