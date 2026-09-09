"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const token_ledger_1 = require("../services/token-ledger");
const router = express_1.default.Router();
router.get('/balance', auth_1.authenticateUser, async (req, res) => {
    try {
        const userUID = req.user.user_uid;
        const account = await (0, token_ledger_1.getTokenAccount)(userUID);
        return res.json({
            success: true,
            data: {
                balance: account.balance,
                earned_balance: account.earned_balance,
                purchased_balance: account.purchased_balance,
                ad_balance: account.ad_balance,
                total_spent: account.total_spent,
                total_earned: account.total_earned,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/transactions', auth_1.authenticateUser, async (req, res) => {
    try {
        const userUID = req.user.user_uid;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const { transactions, total } = await (0, token_ledger_1.getTransactionHistory)(userUID, page, limit);
        return res.json({
            success: true,
            data: transactions,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/purchase/complete', auth_1.authenticateUser, async (req, res) => {
    try {
        const { paymentId, txid, piAmount } = req.body;
        if (!paymentId || !txid || !piAmount) {
            return res.status(400).json({ success: false, error: 'paymentId, txid, and piAmount are required' });
        }
        const { purchaseZP } = require('../services/token-ledger');
        const { account, zpAmount } = await purchaseZP(req.user.user_uid, piAmount, paymentId, txid);
        return res.json({
            success: true,
            message: `Purchased ${zpAmount} ZP for ${piAmount} Pi`,
            data: {
                zp_credited: zpAmount,
                new_balance: account.balance,
                payment_id: paymentId,
                txid,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/balance/simple', auth_1.authenticateUser, async (req, res) => {
    try {
        const balance = await (0, token_ledger_1.getBalance)(req.user.user_uid);
        return res.json({ success: true, balance });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=social-tokens.js.map