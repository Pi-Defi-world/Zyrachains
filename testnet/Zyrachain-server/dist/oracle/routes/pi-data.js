"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPiDataRouter = createPiDataRouter;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const snapshotStore_1 = require("../../services/snapshots/snapshotStore");
const ORACLE_URL = process.env.ORACLE_BASE_URL || 'https://oracle.suban.org';
const FALLBACK_SUPPLY = {
    total_circulating_supply: 10600000000,
    total_locked: 6170000000,
    total_supply: 100000000000,
};
function createPiDataRouter() {
    const router = (0, express_1.Router)();
    router.get('/pi-price', async (_req, res) => {
        try {
            const response = await fetch(`${ORACLE_URL}/data/pi-price`);
            if (!response.ok)
                throw new Error(`Oracle returned ${response.status}`);
            const data = await response.json();
            res.json(data);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Error proxying Pi price from oracle', { error: errorMessage });
            res.status(502).json({
                error: 'Failed to fetch Pi price from upstream oracle',
                message: errorMessage,
            });
        }
    });
    router.get('/mainnet-supply', async (_req, res) => {
        try {
            const row = await (0, snapshotStore_1.getSnapshotPayload)('home_hero');
            if (row?.payload) {
                const p = row.payload;
                return res.json({
                    total_circulating_supply: p.total_circulating_supply,
                    total_locked: p.total_locked,
                    total_supply: p.total_supply,
                    updatedAt: row.updatedAt.toISOString(),
                });
            }
        }
        catch (e) {
            logger_1.logger.warn('mainnet-supply snapshot miss', { error: String(e) });
        }
        return res.json(FALLBACK_SUPPLY);
    });
    router.get('/check-scam-wallet/:address', async (req, res) => {
        const { address } = req.params;
        const knownScamAddresses = new Set([]);
        const is_scam = knownScamAddresses.has(address);
        res.json({
            address,
            is_scam,
            reason: is_scam ? 'Flagged as scam address' : null,
        });
    });
    router.get('/top-accounts', async (_req, res) => {
        res.json({
            accounts: [],
            total: 0,
            message: 'Top accounts data not yet available',
        });
    });
    router.get('/accounts/distribution', async (_req, res) => {
        res.json({
            distribution: [],
            total_accounts: 0,
            message: 'Account distribution data not yet available',
        });
    });
    return router;
}
//# sourceMappingURL=pi-data.js.map