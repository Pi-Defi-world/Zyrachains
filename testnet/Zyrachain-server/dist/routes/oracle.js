"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const oracleApiKey_1 = require("../middleware/oracleApiKey");
const api_1 = require("../oracle/routes/api");
const pi_data_1 = require("../oracle/routes/pi-data");
const horizon_proxy_1 = require("../oracle/routes/horizon-proxy");
const ApiKey_1 = __importDefault(require("../zyrachain-lib/lib/models/ApiKey"));
const router = express_1.default.Router();
const keyMgmt = express_1.default.Router();
keyMgmt.use(auth_1.authenticateUser);
keyMgmt.get('/', async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const keys = await ApiKey_1.default.find({ userId })
            .select('-keyHash')
            .sort({ createdAt: -1 })
            .lean();
        return res.json({ success: true, keys });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to list keys' });
    }
});
keyMgmt.get('/:keyId/usage', async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { keyId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(keyId)) {
            return res.status(400).json({ error: 'Invalid key id' });
        }
        const key = await ApiKey_1.default.findOne({ _id: keyId, userId }).select('usage rateLimit status keyPrefix name createdAt expiresAt credits creditCostPerRequest');
        if (!key) {
            return res.status(404).json({ error: 'Key not found' });
        }
        return res.json({ success: true, usage: key });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to load usage' });
    }
});
keyMgmt.delete('/:keyId', async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { keyId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(keyId)) {
            return res.status(400).json({ error: 'Invalid key id' });
        }
        const updated = await ApiKey_1.default.findOneAndUpdate({ _id: keyId, userId }, { status: 'revoked' }, { new: true });
        if (!updated) {
            return res.status(404).json({ error: 'Key not found' });
        }
        return res.json({ success: true, message: 'Key revoked' });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to revoke key' });
    }
});
router.use('/keys', keyMgmt);
const dataRouter = express_1.default.Router();
dataRouter.use(oracleApiKey_1.authenticateOracleApiKey);
dataRouter.use('/v1', (0, api_1.createApiRouter)());
dataRouter.use('/data', (0, pi_data_1.createPiDataRouter)());
dataRouter.use('/horizon', (0, horizon_proxy_1.createHorizonProxyRouter)());
router.use(dataRouter);
exports.default = router;
//# sourceMappingURL=oracle.js.map