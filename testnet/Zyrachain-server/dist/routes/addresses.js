"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
const PI_ADDR = /^G[A-Z2-7]{55}$/;
async function loadCategoryNames() {
    const names = new Map();
    const coreSet = new Set();
    const cexSet = new Set();
    const genSet = new Set();
    const [coreDocs, cexDocs, genDocs] = await Promise.all([
        mongoose_1.default.connection.collection('core-team-addresses').find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
        mongoose_1.default.connection.collection('cex-addresses').find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
        mongoose_1.default.connection.collection('generated-addresses').find({}).project({ identifier: 1, Name: 1, name: 1 }).toArray(),
    ]);
    const ingest = (docs, label, targetSet) => {
        for (const d of docs) {
            const id = typeof d.identifier === 'string' ? d.identifier.trim() : '';
            if (!id)
                continue;
            targetSet.add(id);
            const name = (typeof d.Name === 'string' && d.Name) ||
                (typeof d.name === 'string' && d.name) ||
                label;
            names.set(id, name);
        }
    };
    ingest(coreDocs, 'Core Team', coreSet);
    ingest(cexDocs, 'CEX', cexSet);
    ingest(genDocs, 'Generated', genSet);
    return { names, coreSet, cexSet, genSet };
}
function categoryOf(id, sets) {
    if (sets.cexSet.has(id))
        return 'CEX';
    if (sets.coreSet.has(id))
        return 'Core Team';
    if (sets.genSet.has(id))
        return 'Generated';
    return 'Other';
}
router.get('/top-accounts', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
        const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
        const [total, docs] = await Promise.all([
            stateCol.countDocuments({ identifier: { $regex: PI_ADDR } }),
            stateCol
                .find({ identifier: { $regex: PI_ADDR } })
                .sort({ lastBalance: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .project({ identifier: 1, lastBalance: 1 })
                .toArray(),
        ]);
        const data = docs
            .filter((d) => typeof d.lastBalance === 'number')
            .map((d) => ({
            address: String(d.identifier),
            balance: d.lastBalance,
        }));
        return res.json({
            success: true,
            data,
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
    }
    catch (error) {
        console.error('[addresses] top-accounts error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch top accounts' });
    }
});
router.get('/distribution', async (_req, res) => {
    try {
        const { names, coreSet, cexSet, genSet } = await loadCategoryNames();
        const sets = { coreSet, cexSet, genSet };
        const stateCol = mongoose_1.default.connection.collection('pct-wallet-state');
        const docs = await stateCol
            .find({ identifier: { $regex: PI_ADDR } })
            .project({ identifier: 1, lastBalance: 1 })
            .toArray();
        const byCategory = new Map();
        for (const d of docs) {
            if (typeof d.lastBalance !== 'number')
                continue;
            const cat = categoryOf(String(d.identifier), sets);
            byCategory.set(cat, (byCategory.get(cat) || 0) + d.lastBalance);
        }
        const data = Array.from(byCategory.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        return res.json({ success: true, data, total: data.reduce((s, d) => s + d.value, 0) });
    }
    catch (error) {
        console.error('[addresses] distribution error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch address distribution' });
    }
});
exports.default = router;
//# sourceMappingURL=addresses.js.map