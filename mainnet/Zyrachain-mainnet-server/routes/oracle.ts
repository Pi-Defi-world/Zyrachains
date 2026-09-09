import express, { Response, Router } from 'express';
import mongoose from 'mongoose';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { authenticateOracleApiKey } from '../middleware/oracleApiKey';
import { createApiRouter } from '../oracle/routes/api';
import { createPiDataRouter } from '../oracle/routes/pi-data';
import { createHorizonProxyRouter } from '../oracle/routes/horizon-proxy';
import ApiKey from '../zyrachain-lib/lib/models/ApiKey';

const router: Router = express.Router();

/** Pi-authenticated key management: /api/oracle/keys ... */
const keyMgmt = express.Router();
keyMgmt.use(authenticateUser);

keyMgmt.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const keys = await ApiKey.find({ userId })
      .select('-keyHash')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, keys });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to list keys' });
  }
});

keyMgmt.get('/:keyId/usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { keyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(keyId)) {
      return res.status(400).json({ error: 'Invalid key id' });
    }
    const key = await ApiKey.findOne({ _id: keyId, userId }).select(
      'usage rateLimit status keyPrefix name createdAt expiresAt credits creditCostPerRequest'
    );
    if (!key) {
      return res.status(404).json({ error: 'Key not found' });
    }
    return res.json({ success: true, usage: key });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to load usage' });
  }
});

keyMgmt.delete('/:keyId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { keyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(keyId)) {
      return res.status(400).json({ error: 'Invalid key id' });
    }
    const updated = await ApiKey.findOneAndUpdate(
      { _id: keyId, userId },
      { status: 'revoked' },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Key not found' });
    }
    return res.json({ success: true, message: 'Key revoked' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to revoke key' });
  }
});

router.use('/keys', keyMgmt);

/** API-key authenticated oracle data */
const dataRouter = express.Router();
dataRouter.use(authenticateOracleApiKey);
dataRouter.use('/v1', createApiRouter());
dataRouter.use('/data', createPiDataRouter());
dataRouter.use('/horizon', createHorizonProxyRouter());

router.use(dataRouter);

export default router;
