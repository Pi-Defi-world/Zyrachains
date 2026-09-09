"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRouter = createApiRouter;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const ORACLE_URL = process.env.ORACLE_BASE_URL || 'https://oracle.suban.org';
function createApiRouter() {
    const router = (0, express_1.Router)();
    const startTime = Date.now();
    router.get('/price', async (_req, res) => {
        try {
            const response = await fetch(`${ORACLE_URL}/api/v1/price`);
            if (!response.ok)
                throw new Error(`Oracle returned ${response.status}`);
            const data = await response.json();
            res.json(data);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Error proxying price from oracle', { error: msg });
            res.status(502).json({
                error: 'Failed to fetch price from upstream oracle',
                message: msg,
            });
        }
    });
    router.get('/sources', async (_req, res) => {
        try {
            const response = await fetch(`${ORACLE_URL}/api/v1/sources`);
            if (!response.ok)
                throw new Error(`Oracle returned ${response.status}`);
            const data = await response.json();
            res.json(data);
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Error proxying sources from oracle', { error: msg });
            res.status(502).json({
                error: 'Failed to fetch sources from upstream oracle',
                message: msg,
            });
        }
    });
    router.get('/health', (_req, res) => {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        res.json({
            status: 'healthy',
            uptime,
            timestamp: new Date(),
        });
    });
    return router;
}
//# sourceMappingURL=api.js.map