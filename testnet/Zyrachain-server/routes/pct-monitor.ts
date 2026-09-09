import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
import type { Collection } from 'mongodb';
import type { PctMetaDoc } from '../services/pct-balance-scanner';
import { getPctSummary, refreshPctSummary } from '../services/pct-summary';

function pctMetaCollection(): Collection<PctMetaDoc> {
  return mongoose.connection.collection('pct-monitor-meta') as Collection<PctMetaDoc>;
}

const router: Router = express.Router();

const PI_ADDR = /^G[A-Z2-7]{55}$/;

function shortWallet(id: string): string {
  if (id.length < 17) return id;
  return `${id.slice(0, 8)}…${id.slice(-8)}`;
}

/** Aggregate dashboard metrics */
router.get('/summary', async (_req: Request, res: Response) => {
  try {
    let summary = await getPctSummary();
    if (!summary) {
      summary = await refreshPctSummary();
    }

    return res.json({
      success: true,
      data: {
        walletsTracked: summary.walletsTracked,
        walletsTrackedCoreTeam: (summary as any).walletsTrackedCoreTeam ?? null,
        walletsTrackedCex: (summary as any).walletsTrackedCex ?? null,
        scannedWallets: summary.scannedWallets,
        startingBalance: summary.startingBalance,
        startingBalanceAllTracked: (summary as any).startingBalanceAllTracked ?? null,
        currentBalance: summary.currentBalance,
        confirmedChanges: summary.confirmedChanges,
        totalOut: summary.totalOut,
        netChange24h: summary.netChange24h,
        latestCheck: summary.latestCheck,
        scanLock: summary.scanLock,
      },
    });
  } catch (error) {
    console.error('pct-monitor summary:', error);
    return res.status(500).json({ success: false, message: 'Failed to load summary' });
  }
});

/**
 * Classified external OUT movements.
 * OUT = PCT wallet sent native Pi to a non-PCT wallet. PCT-to-PCT sends are ignored.
 */
router.get('/movements', async (req: Request, res: Response) => {
  try {
    const movementsCol = mongoose.connection.collection('pct-wallet-movements');
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor.trim() : '';
    const filter: Record<string, unknown> = {};

    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await movementsCol
      .find(filter)
      .sort({ detectedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    const rows = docs.map((d) => ({
      id: String(d._id),
      paymentId: d.paymentId,
      wallet: String(d.wallet),
      walletShort: shortWallet(String(d.wallet)),
      destination: String(d.destination),
      destinationShort: shortWallet(String(d.destination)),
      amount: d.amount,
      detectedAt: d.detectedAt,
      ledger: d.ledger ?? null,
      transactionHash: d.transactionHash ?? null,
    }));

    const nextCursor = docs.length === limit ? String(docs[docs.length - 1]._id) : null;
    return res.json({ success: true, data: rows, nextCursor });
  } catch (error) {
    console.error('pct-monitor movements:', error);
    return res.status(500).json({ success: false, message: 'Failed to load movements' });
  }
});

/**
 * Balance change events (newest first).
 * Query: limit (default 50, max 200), cursor (ObjectId hex), hours (optional filter last N hours)
 */
router.get('/changes', async (req: Request, res: Response) => {
  try {
    const eventsCol = mongoose.connection.collection('pct-balance-events');
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor.trim() : '';
    const hoursRaw = req.query.hours;
    const hours =
      hoursRaw !== undefined && hoursRaw !== ''
        ? Math.min(24 * 90, Math.max(1, Number(hoursRaw)))
        : null;

    const filter: Record<string, unknown> = {};
    if (hours !== null && Number.isFinite(hours)) {
      filter.detectedAt = { $gte: new Date(Date.now() - hours * 3600000) };
    }
    if (cursor && Types.ObjectId.isValid(cursor)) {
      filter._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await eventsCol
      .find(filter)
      .sort({ detectedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    const rows = docs.map((d) => ({
      id: String(d._id),
      wallet: String(d.wallet),
      walletShort: shortWallet(String(d.wallet)),
      oldBalance: d.oldBalance,
      newBalance: d.newBalance,
      change: d.change,
      detectedAt: d.detectedAt,
      ledger: d.ledger ?? null,
    }));

    const nextCursor = docs.length === limit ? String(docs[docs.length - 1]._id) : null;

    return res.json({ success: true, data: rows, nextCursor });
  } catch (error) {
    console.error('pct-monitor changes:', error);
    return res.status(500).json({ success: false, message: 'Failed to load changes' });
  }
});

/**
 * Paginated wallet directory (from core-team-addresses + optional pct-wallet-state).
 */
router.get('/wallets', async (req: Request, res: Response) => {
  try {
    const coreCol = mongoose.connection.collection('core-team-addresses');
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 100));
    const skip = (page - 1) * pageSize;

    const filter = { identifier: { $regex: PI_ADDR } };

    const total = await coreCol.countDocuments(filter);

    const slice = await coreCol
      .find(filter)
      .sort({ identifier: 1 })
      .skip(skip)
      .limit(pageSize)
      .project({ identifier: 1, Name: 1, name: 1 })
      .toArray();

    const ids = slice.map((d) => d.identifier).filter(Boolean) as string[];

    const stateCol = mongoose.connection.collection('pct-wallet-state');
    const states = await stateCol.find({ identifier: { $in: ids } }).toArray();
    const balanceById = new Map<string, { lastBalance?: number; lastCheckedAt?: Date }>();
    for (const s of states) {
      balanceById.set(String(s.identifier), {
        lastBalance: s.lastBalance,
        lastCheckedAt: s.lastCheckedAt,
      });
    }

    const wallets = slice.map((d) => {
      const id = String(d.identifier);
      const name = (d.Name ?? d.name ?? '') as string;
      const st = balanceById.get(id);
      return {
        identifier: id,
        walletShort: shortWallet(id),
        Name: name || `PCT Wallet`,
        explorerUrl: `https://blockexplorer.minepi.com/mainnet/accounts/${id}`,
        lastBalance: st?.lastBalance ?? null,
        lastCheckedAt: st?.lastCheckedAt ?? null,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return res.json({
      success: true,
      data: {
        wallets,
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('pct-monitor wallets:', error);
    return res.status(500).json({ success: false, message: 'Failed to load wallets' });
  }
});

/**
 * Balance history for a specific wallet address (time-series for charts)
 * Returns aggregated hourly snapshots of balance over time
 */
router.get('/balance-history/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    if (!PI_ADDR.test(address)) {
      return res.status(400).json({ success: false, message: 'Invalid Pi address' });
    }

    const eventsCol = mongoose.connection.collection('pct-balance-events');
    const docs = await eventsCol
      .find({ wallet: address })
      .sort({ detectedAt: 1 })
      .limit(500)
      .toArray();

    // Build balance-over-time series from events
    const points: { time: number; balance: number }[] = [];
    for (const doc of docs) {
      if (typeof doc.newBalance !== 'number') continue;
      points.push({
        time: Math.floor(new Date(doc.detectedAt).getTime() / 1000),
        balance: doc.newBalance,
      });
    }

    // If no events, try getting current balance from state
    if (points.length === 0) {
      const stateCol = mongoose.connection.collection('pct-wallet-state');
      const state = await stateCol.findOne({ identifier: address });
      if (state?.lastBalance != null) {
        points.push({
          time: Math.floor((state.lastCheckedAt ? new Date(state.lastCheckedAt) : new Date()).getTime() / 1000),
          balance: state.lastBalance,
        });
      }
    }

    return res.json({ success: true, data: points });
  } catch (error) {
    console.error('pct-monitor balance-history:', error);
    return res.status(500).json({ success: false, message: 'Failed to load balance history' });
  }
});

/**
 * Aggregate balance history (total balance of all tracked wallets over time)
 */
router.get('/aggregate-balance-history', async (req: Request, res: Response) => {
  try {
    const range = (req.query.range as string) || '7d';
    const hours: Record<string, number> = { '1d': 24, '7d': 168, '30d': 720 };
    const span = hours[range] || 168;
    const since = new Date(Date.now() - span * 3600000);

    // Get current total from wallet state collection
    const stateCol = mongoose.connection.collection('pct-wallet-state');
    const stateAgg = await stateCol.aggregate([
      { $match: { lastBalance: { $type: 'number' } } },
      { $group: { _id: null, total: { $sum: '$lastBalance' } } },
    ]).toArray();
    const currentTotal = stateAgg.length > 0 ? stateAgg[0].total : 0;

    const eventsCol = mongoose.connection.collection('pct-balance-events');
    const docs = await eventsCol
      .find(
        { detectedAt: { $gte: since }, change: { $exists: true, $type: 'number' } },
        { projection: { change: 1, detectedAt: 1 }, limit: 2000 }
      )
      .sort({ detectedAt: -1 })
      .toArray();

    const bucketMs = span <= 168 ? 3600000 : 86400000;
    const buckets = new Map<number, { balance: number; lastSeen: Date }>();
    let runningBalance = currentTotal;

    for (const doc of docs) {
      runningBalance -= doc.change;
      const key = Math.floor(doc.detectedAt.getTime() / bucketMs) * bucketMs / 1000;
      const existing = buckets.get(key);
      if (!existing || doc.detectedAt > existing.lastSeen) {
        buckets.set(key, { balance: runningBalance, lastSeen: doc.detectedAt });
      }
    }

    if (buckets.size === 0) {
      buckets.set(Math.floor(Date.now() / 1000), { balance: currentTotal, lastSeen: new Date() });
    }

    const points = Array.from(buckets.entries())
      .map(([time, b]) => ({ time, balance: parseFloat(b.balance.toFixed(2)) }))
      .sort((a, b) => a.time - b.time);

    return res.json({ success: true, data: points });
  } catch (error) {
    console.error('pct-monitor aggregate-balance-history:', error);
    return res.status(500).json({ success: false, message: 'Failed to load aggregate history' });
  }
});

export default router;
