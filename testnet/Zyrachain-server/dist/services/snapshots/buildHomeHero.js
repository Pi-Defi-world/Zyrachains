"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHomeHero = buildHomeHero;
const snapshotStore_1 = require("./snapshotStore");
const horizonMainnet_1 = require("./horizonMainnet");
const setupAggregator_1 = require("../../oracle/setupAggregator");
const DEFAULT_SUPPLY = {
    total_circulating_supply: 10600000000,
    total_locked: 6170000000,
    total_supply: 100000000000,
};
async function buildHomeHero() {
    const h = (0, horizonMainnet_1.getHorizonMainnet)();
    const ticker = await (0, setupAggregator_1.getMexc24hrTicker)().catch(() => null);
    const priceUsd = ticker?.priceUsd || 0;
    let latest_block = 0;
    let horizon_ingest_latest_ledger;
    let tps = 0;
    try {
        const root = await h.get('/');
        horizon_ingest_latest_ledger =
            typeof root.data.ingest_latest_ledger === 'number'
                ? root.data.ingest_latest_ledger
                : undefined;
        latest_block =
            typeof root.data.core_latest_ledger === 'number'
                ? root.data.core_latest_ledger
                : horizon_ingest_latest_ledger ?? 0;
    }
    catch {
        try {
            const ledgers = await h.get('/ledgers', { params: { order: 'desc', limit: 1 } });
            latest_block = ledgers.data?._embedded?.records?.[0]?.sequence ?? 0;
        }
        catch {
            latest_block = 0;
        }
    }
    try {
        const ledgers100 = await h.get('/ledgers', { params: { order: 'desc', limit: 100 } });
        const rows = ledgers100.data?._embedded?.records ?? [];
        let sum = 0;
        for (const r of rows) {
            sum += typeof r.successful_transaction_count === 'number' ? r.successful_transaction_count : 0;
        }
        tps = rows.length > 0 ? sum / (rows.length * 5) : 0;
    }
    catch {
        tps = 0;
    }
    const total_circulating_supply = DEFAULT_SUPPLY.total_circulating_supply;
    const total_supply = DEFAULT_SUPPLY.total_supply;
    const total_locked = DEFAULT_SUPPLY.total_locked;
    const market_cap_usd = priceUsd * total_circulating_supply;
    const fdv_usd = priceUsd * total_supply;
    const payload = {
        priceUsd,
        confidenceScore: 0.95,
        high24hUsd: ticker?.high24hUsd ?? priceUsd,
        low24hUsd: ticker?.low24hUsd ?? priceUsd,
        open24hUsd: ticker?.open24hUsd ?? priceUsd,
        priceChange24h: ticker?.priceChange24h ?? 0,
        total_circulating_supply,
        total_locked,
        total_supply,
        market_cap_usd,
        fdv_usd,
        latest_block,
        tps,
        horizon_ingest_latest_ledger,
        source_prices: undefined,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('home_hero', payload);
    return payload;
}
//# sourceMappingURL=buildHomeHero.js.map