import { Request, Response, NextFunction } from 'express';
import ApiKey, { IApiKey } from '../zyrachain-lib/lib/models/ApiKey';
import { hashOracleApiKey } from '../zyrachain-lib/lib/apiKeyCrypto';

export interface OracleAuthenticatedRequest extends Request {
  oracleKeyDoc?: IApiKey;
}

/** In-memory rate limit: request timestamps per API key id */
const requestLog = new Map<string, number[]>();

function pruneAndCheckRateLimit(
  keyId: string,
  requestsPerMinute: number,
  requestsPerDay: number
): boolean {
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

export async function authenticateOracleApiKey(
  req: OracleAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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

    const keyHash = hashOracleApiKey(raw);
    const doc = await ApiKey.findOne({ keyHash, status: 'active' });

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

    const ok = pruneAndCheckRateLimit(
      String(doc._id),
      doc.rateLimit.requestsPerMinute,
      doc.rateLimit.requestsPerDay
    );
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
  } catch (e) {
    console.error('Oracle API key auth error:', e);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
