"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateOracleApiKey = authenticateOracleApiKey;
const ApiKey_1 = __importDefault(require("../zyrachain-lib/lib/models/ApiKey"));
const apiKeyCrypto_1 = require("../zyrachain-lib/lib/apiKeyCrypto");
const requestLog = new Map();
function pruneAndCheckRateLimit(keyId, requestsPerMinute, requestsPerDay) {
    const now = Date.now();
    let stamps = requestLog.get(keyId) || [];
    stamps = stamps.filter((t) => now - t < 24 * 60 * 60 * 1000);
    const inLastMinute = stamps.filter((t) => now - t < 60 * 1000);
    if (inLastMinute.length >= requestsPerMinute) {
        requestLog.set(keyId, stamps);
        return false;
    }
    if (stamps.length >= requestsPerDay) {
        requestLog.set(keyId, stamps);
        return false;
    }
    stamps.push(now);
    requestLog.set(keyId, stamps);
    return true;
}
async function authenticateOracleApiKey(req, res, next) {
    try {
        const headerVal = req.headers['x-api-key'];
        const rawHeader = Array.isArray(headerVal) ? headerVal[0] : headerVal;
        const rawQuery = typeof req.query.apiKey === 'string' ? req.query.apiKey : undefined;
        const raw = (rawHeader || rawQuery || '').trim();
        if (!raw || !raw.startsWith('zyra_')) {
            res.status(401).json({
                error: 'Invalid or missing API key',
                hint: 'Send X-API-Key header or apiKey query parameter',
            });
            return;
        }
        const keyHash = (0, apiKeyCrypto_1.hashOracleApiKey)(raw);
        const doc = await ApiKey_1.default.findOne({ keyHash, status: 'active' });
        if (!doc) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }
        if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) {
            doc.status = 'expired';
            await doc.save();
            res.status(403).json({ error: 'API key expired' });
            return;
        }
        const ok = pruneAndCheckRateLimit(String(doc._id), doc.rateLimit.requestsPerMinute, doc.rateLimit.requestsPerDay);
        if (!ok) {
            res.status(429).json({ error: 'Rate limit exceeded' });
            return;
        }
        const cost = doc.creditCostPerRequest || 0.01;
        if (doc.credits < cost) {
            res.status(429).json({
                error: 'Insufficient credits',
                hint: 'Top up your API key credits via the dashboard',
                remaining: doc.credits,
                costPerRequest: cost,
            });
            return;
        }
        doc.credits -= cost;
        doc.usage.totalRequests += 1;
        doc.usage.lastUsedAt = new Date();
        await doc.save().catch(() => undefined);
        req.oracleKeyDoc = doc;
        next();
    }
    catch (e) {
        console.error('Oracle API key auth error:', e);
        res.status(500).json({ error: 'Authentication failed' });
    }
}
//# sourceMappingURL=oracleApiKey.js.map