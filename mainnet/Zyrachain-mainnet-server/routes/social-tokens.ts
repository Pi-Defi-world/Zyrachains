import express, { Request, Response, Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { getTokenAccount, getTransactionHistory, getBalance } from '../services/token-ledger';

const router: Router = express.Router();

router.get('/balance', authenticateUser, async (req: any, res: Response) => {
  try {
    const userUID = req.user.user_uid;
    const account = await getTokenAccount(userUID);

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
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/transactions', authenticateUser, async (req: any, res: Response) => {
  try {
    const userUID = req.user.user_uid;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { transactions, total } = await getTransactionHistory(userUID, page, limit);

    return res.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/purchase/complete', authenticateUser, async (req: any, res: Response) => {
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
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/balance/simple', authenticateUser, async (req: any, res: Response) => {
  try {
    const balance = await getBalance(req.user.user_uid);
    return res.json({ success: true, balance });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
