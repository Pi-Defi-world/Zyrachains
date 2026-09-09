"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHorizonProxyRouter = createHorizonProxyRouter;
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
const HORIZON_API = 'https://api.mainnet.minepi.com';
const horizonClient = axios_1.default.create({
    baseURL: HORIZON_API,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
function createHorizonProxyRouter() {
    const router = (0, express_1.Router)();
    router.all('/*', async (req, res) => {
        try {
            const path = req.path;
            const method = req.method.toLowerCase();
            logger_1.logger.debug(`Proxying Horizon request: ${method.toUpperCase()} ${path}`);
            const response = await horizonClient.request({
                method,
                url: path,
                params: req.query,
                data: req.body,
            });
            res.json(response.data);
        }
        catch (error) {
            const status = error.response?.status || 500;
            const message = error.response?.data || error.message;
            logger_1.logger.error('Horizon proxy error', {
                path: req.path,
                status,
                message,
            });
            res.status(status).json({
                error: 'Horizon API error',
                message,
            });
        }
    });
    return router;
}
//# sourceMappingURL=horizon-proxy.js.map