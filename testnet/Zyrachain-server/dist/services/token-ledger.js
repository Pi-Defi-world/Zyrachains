"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundZP = roundZP;
exports.platformFee = platformFee;
exports.creatorShare = creatorShare;
exports.getOrCreateTokenAccount = getOrCreateTokenAccount;
exports.getBalance = getBalance;
exports.getTokenAccount = getTokenAccount;
exports.creditZP = creditZP;
exports.debitZP = debitZP;
exports.transferZP = transferZP;
exports.getTransactionHistory = getTransactionHistory;
exports.purchaseZP = purchaseZP;
const SocialToken_1 = __importDefault(require("../zyrachain-lib/lib/models/SocialToken"));
const TokenTransaction_1 = __importDefault(require("../zyrachain-lib/lib/models/TokenTransaction"));
const RewardLog_1 = __importDefault(require("../zyrachain-lib/lib/models/RewardLog"));
const platform_settings_1 = require("./platform-settings");
const ZP_DECIMALS = 4;
function roundZP(amount) {
    return Math.round(amount * Math.pow(10, ZP_DECIMALS)) / Math.pow(10, ZP_DECIMALS);
}
async function platformFee(amount) {
    const rate = await (0, platform_settings_1.getPlatformFeeRate)();
    return roundZP(amount * rate);
}
async function creatorShare(amount) {
    const rate = await (0, platform_settings_1.getPlatformFeeRate)();
    return roundZP(amount * (1 - rate));
}
async function getOrCreateTokenAccount(userUID) {
    let account = await SocialToken_1.default.findOne({ user_uid: userUID });
    if (!account) {
        account = new SocialToken_1.default({ user_uid: userUID });
        await account.save();
    }
    return account;
}
async function getBalance(userUID) {
    const account = await SocialToken_1.default.findOne({ user_uid: userUID });
    return account ? account.balance : 0;
}
async function getTokenAccount(userUID) {
    const account = await SocialToken_1.default.findOne({ user_uid: userUID });
    if (!account)
        return await getOrCreateTokenAccount(userUID);
    return account;
}
async function creditZP(userUID, amount, txType, subType, refId = null, refModel = '', metadata = {}) {
    const amt = roundZP(amount);
    if (amt <= 0)
        throw new Error('Credit amount must be positive');
    const account = await getOrCreateTokenAccount(userUID);
    switch (subType) {
        case 'ad':
            account.ad_balance += amt;
            break;
        case 'earned':
            account.earned_balance += amt;
            break;
        case 'purchased':
            account.purchased_balance += amt;
            break;
        default:
            break;
    }
    account.balance += amt;
    account.total_earned += amt;
    await account.save();
    const tx = new TokenTransaction_1.default({
        from_user_uid: null,
        to_user_uid: userUID,
        amount: amt,
        tx_type: txType,
        reference_id: refId,
        reference_model: refModel,
        metadata: { sub_type: subType, ...metadata },
    });
    await tx.save();
    if (txType === 'ad_reward' || txType === 'mission_reward' || txType === 'moderation_reward' || txType === 'referral_reward') {
        const rewardLog = new RewardLog_1.default({
            user_uid: userUID,
            amount: amt,
            source: txType === 'ad_reward' ? 'ad' : txType === 'mission_reward' ? 'mission' : txType === 'moderation_reward' ? 'moderation' : 'referral',
            reference_id: refId,
            reference_model: refModel,
            description: metadata.description || '',
        });
        await rewardLog.save();
    }
    return { account, tx };
}
async function debitZP(userUID, amount, txType, refId = null, refModel = '', metadata = {}) {
    const amt = roundZP(amount);
    if (amt <= 0)
        throw new Error('Debit amount must be positive');
    const account = await SocialToken_1.default.findOne({ user_uid: userUID });
    if (!account || account.balance < amt) {
        throw new Error('Insufficient ZP balance');
    }
    account.balance -= amt;
    account.total_spent += amt;
    await account.save();
    const tx = new TokenTransaction_1.default({
        from_user_uid: userUID,
        to_user_uid: null,
        amount: amt,
        tx_type: txType,
        reference_id: refId,
        reference_model: refModel,
        metadata,
    });
    await tx.save();
    return { account, tx };
}
async function transferZP(fromUID, toUID, amount, txType, refId = null, refModel = '', metadata = {}) {
    const amt = roundZP(amount);
    if (amt <= 0)
        throw new Error('Transfer amount must be positive');
    const fromAccount = await SocialToken_1.default.findOne({ user_uid: fromUID });
    if (!fromAccount || fromAccount.balance < amt) {
        throw new Error('Insufficient ZP balance');
    }
    const toAccount = await getOrCreateTokenAccount(toUID);
    fromAccount.balance -= amt;
    fromAccount.total_spent += amt;
    await fromAccount.save();
    toAccount.earned_balance += amt;
    toAccount.balance += amt;
    toAccount.total_earned += amt;
    await toAccount.save();
    const tx = new TokenTransaction_1.default({
        from_user_uid: fromUID,
        to_user_uid: toUID,
        amount: amt,
        tx_type: txType,
        reference_id: refId,
        reference_model: refModel,
        metadata,
    });
    await tx.save();
    return { fromAccount, toAccount, tx };
}
async function getTransactionHistory(userUID, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = {
        $or: [{ from_user_uid: userUID }, { to_user_uid: userUID }],
    };
    const [transactions, total] = await Promise.all([
        TokenTransaction_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        TokenTransaction_1.default.countDocuments(query),
    ]);
    return { transactions, total };
}
async function purchaseZP(userUID, piAmount, paymentId, txid) {
    const ZP_PER_PI = await (0, platform_settings_1.getConversionRate)();
    const zpAmount = roundZP(piAmount * ZP_PER_PI);
    const { account } = await creditZP(userUID, zpAmount, 'purchase', 'purchased', null, '', {
        pi_amount: piAmount,
        payment_id: paymentId,
        txid,
        rate: `${ZP_PER_PI} ZP per Pi`,
    });
    return { account, zpAmount };
}
//# sourceMappingURL=token-ledger.js.map