"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const pct_summary_1 = require("../services/pct-summary");
function pctMetaCollection() {
    return mongoose_1.default.connection.collection('pct-monitor-meta');
}
const router = express_1.default.Router();
const PI_ADDR = /^G[A-Z2-7]{55}$/;
function shortWallet(id) {
    if (id.length < 17)
        return id;
    return `${id.slice(0, 8)}…${id.slice(-8)}`;
}
router.get('/summary', async (_req, res) => {
    try {
        let summary = await (0, pct_summary_1.getPctSummary)();
        if (!summary) {
            summary = await (0, pct_summary_1.refreshPctSummary)();
        }
        return res.json({
            success: true,
            data: {
                walletsTracked: summary.walletsTracked,
                walletsTrackedCoreTeam: summary.walletsTrackedCoreTeam ?? null,
                walletsTrackedCex: summary.walletsTrackedCex ?? null,
                scannedWallets: summary.scannedWallets,
                startingBalance: summary.startingBalance,
                startingBalanceAllTracked: summary.startingBalanceAllTracked ?? null,
                currentBalance: summary.currentBalance,
                confirmedChanges: summary.confirmedChanges,
                totalOut: summary.totalOut,
                netChange24h: summary.netChange24h,
                latestCheck: summary.latestCheck,
                scanLock: summary.scanLock,
            },
        });
    }
    catch (error) {
        console.error('pct-monitor summary:', error);
        return res.status(500).json({ success: false, message: 'Failed to load summary' });
    }
});
router.get('/movements', async (req, res) => {
    try {
        const movementsCol = mongoose_1.default.connection.collection('pct-wallet-movements');
        const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor.trim() : '';
        const filter = {};
        if (cursor && mongoose_2.Types.ObjectId.isValid(cursor)) {
            filter._id = { $lt: new mongoose_2.Types.ObjectId(cursor) };
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
    }
    catch (error) {
        console.error('pct-monitor movements:', error);
        return res.status(500).json({ success: false, message: 'Failed to load movements' });
    }
});
router.get('/changes', async (req, res) => {
    try {
        const eventsCol = mongoose_1.default.connection.collection('pct-balance-events');
        const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor.trim() : '';
        const hoursRaw = req.query.hours;
        const hours = hoursRaw !== undefined && hoursRaw !== ''
            ? Math.min(24 * 90, Math.max(1, Number(hoursRaw)))
            : null;
        const filter = {};
        if (hours !== null && Number.isFinite(hours)) {
            filter.detectedAt = { $gte: new Date(Date.now() - hours * 3600000) };
        }
        if (cursor && mongoose_2.Types.ObjectId.isValid(cursor)) {
            filter._id = { $lt: new mongoose_2.Types.ObjectId(cursor) };
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
    }
    catch (error) {
        console.error('pct-monitor changes:', error);
        return res.status(500).json({ success: false, message: 'Failed to load changes' });
    }
});
router.get('/wallets', async (req, res) => {
    try {
        const coreCol = mongoose_1.default.connection.collection('core-team-addresses');
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
        const ids = slice.map((d) => d.identifier).filter(Boolean);
        const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
        const states = await stateCol.find({ identifier: { $in: ids } }).toArray();
        const balanceById = new Map();
        for (const s of states) {
            balanceById.set(String(s.identifier), {
                lastBalance: s.lastBalance,
                lastCheckedAt: s.lastCheckedAt,
            });
        }
        const wallets = slice.map((d) => {
            const id = String(d.identifier);
            const name = (d.Name ?? d.name ?? '');
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
    }
    catch (error) {
        console.error('pct-monitor wallets:', error);
        return res.status(500).json({ success: false, message: 'Failed to load wallets' });
    }
});
router.get('/balance-history/:address', async (req, res) => {
    try {
        const { address } = req.params;
        if (!PI_ADDR.test(address)) {
            return res.status(400).json({ success: false, message: 'Invalid Pi address' });
        }
        const eventsCol = mongoose_1.default.connection.collection('pct-balance-events');
        const docs = await eventsCol
            .find({ wallet: address })
            .sort({ detectedAt: 1 })
            .limit(500)
            .toArray();
        const points = [];
        for (const doc of docs) {
            if (typeof doc.newBalance !== 'number')
                continue;
            points.push({
                time: Math.floor(new Date(doc.detectedAt).getTime() / 1000),
                balance: doc.newBalance,
            });
        }
        if (points.length === 0) {
            const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
            const state = await stateCol.findOne({ identifier: address });
            if (state?.lastBalance != null) {
                points.push({
                    time: Math.floor((state.lastCheckedAt ? new Date(state.lastCheckedAt) : new Date()).getTime() / 1000),
                    balance: state.lastBalance,
                });
            }
        }
        return res.json({ success: true, data: points });
    }
    catch (error) {
        console.error('pct-monitor balance-history:', error);
        return res.status(500).json({ success: false, message: 'Failed to load balance history' });
    }
});
router.get('/aggregate-balance-history', async (req, res) => {
    try {
        const range = req.query.range || '7d';
        const hours = { '1d': 24, '7d': 168, '30d': 720 };
        const span = hours[range] || 168;
        const since = new Date(Date.now() - span * 3600000);
        const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
        const stateAgg = await stateCol.aggregate([
            { $match: { lastBalance: { $type: 'number' } } },
            { $group: { _id: null, total: { $sum: '$lastBalance' } } },
        ]).toArray();
        const currentTotal = stateAgg.length > 0 ? stateAgg[0].total : 0;
        const eventsCol = mongoose_1.default.connection.collection('pct-balance-events');
        const docs = await eventsCol
            .find({ detectedAt: { $gte: since }, change: { $exists: true, $type: 'number' } }, { projection: { change: 1, detectedAt: 1 }, limit: 2000 })
            .sort({ detectedAt: -1 })
            .toArray();
        const bucketMs = span <= 168 ? 3600000 : 86400000;
        const buckets = new Map();
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
    }
    catch (error) {
        console.error('pct-monitor aggregate-balance-history:', error);
        return res.status(500).json({ success: false, message: 'Failed to load aggregate history' });
    }
});
exports.default = router;
//# sourceMappingURL=pct-monitor.js.map