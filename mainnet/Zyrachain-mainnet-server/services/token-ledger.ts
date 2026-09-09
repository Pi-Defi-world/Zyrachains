import SocialToken from '../zyrachain-lib/lib/models/SocialToken';
import TokenTransaction from '../zyrachain-lib/lib/models/TokenTransaction';
import RewardLog from '../zyrachain-lib/lib/models/RewardLog';
import mongoose from 'mongoose';
import { getPlatformFeeRate, getConversionRate } from './platform-settings';

const ZP_DECIMALS = 4;

export function roundZP(amount: number): number {
  return Math.round(amount * Math.pow(10, ZP_DECIMALS)) / Math.pow(10, ZP_DECIMALS);
}

export async function platformFee(amount: number): Promise<number> {
  const rate = await getPlatformFeeRate();
  return roundZP(amount * rate);
}

export async function creatorShare(amount: number): Promise<number> {
  const rate = await getPlatformFeeRate();
  return roundZP(amount * (1 - rate));
}

export async function getOrCreateTokenAccount(userUID: string): Promise<any> {
  let account = await SocialToken.findOne({ user_uid: userUID });
  if (!account) {
    account = new SocialToken({ user_uid: userUID });
    await account.save();
  }
  return account;
}

export async function getBalance(userUID: string): Promise<number> {
  const account = await SocialToken.findOne({ user_uid: userUID });
  return account ? account.balance : 0;
}

export async function getTokenAccount(userUID: string): Promise<any> {
  const account = await SocialToken.findOne({ user_uid: userUID });
  if (!account) return await getOrCreateTokenAccount(userUID);
  return account;
}

export async function creditZP(
  userUID: string,
  amount: number,
  txType: string,
  subType: string,
  refId: mongoose.Types.ObjectId | null = null,
  refModel: string = '',
  metadata: Record<string, any> = {}
): Promise<{ account: any; tx: any }> {
  const amt = roundZP(amount);
  if (amt <= 0) throw new Error('Credit amount must be positive');

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

  const tx = new TokenTransaction({
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
    const rewardLog = new RewardLog({
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

export async function debitZP(
  userUID: string,
  amount: number,
  txType: string,
  refId: mongoose.Types.ObjectId | null = null,
  refModel: string = '',
  metadata: Record<string, any> = {}
): Promise<{ account: any; tx: any }> {
  const amt = roundZP(amount);
  if (amt <= 0) throw new Error('Debit amount must be positive');

  const account = await SocialToken.findOne({ user_uid: userUID });
  if (!account || account.balance < amt) {
    throw new Error('Insufficient ZP balance');
  }

  account.balance -= amt;
  account.total_spent += amt;
  await account.save();

  const tx = new TokenTransaction({
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

export async function transferZP(
  fromUID: string,
  toUID: string,
  amount: number,
  txType: string,
  refId: mongoose.Types.ObjectId | null = null,
  refModel: string = '',
  metadata: Record<string, any> = {}
): Promise<{ fromAccount: any; toAccount: any; tx: any }> {
  const amt = roundZP(amount);
  if (amt <= 0) throw new Error('Transfer amount must be positive');

  const fromAccount = await SocialToken.findOne({ user_uid: fromUID });
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

  const tx = new TokenTransaction({
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

export async function getTransactionHistory(
  userUID: string,
  page: number = 1,
  limit: number = 20
): Promise<{ transactions: any[]; total: number }> {
  const skip = (page - 1) * limit;
  const query = {
    $or: [{ from_user_uid: userUID }, { to_user_uid: userUID }],
  };
  const [transactions, total] = await Promise.all([
    TokenTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    TokenTransaction.countDocuments(query),
  ]);
  return { transactions, total };
}

export async function purchaseZP(
  userUID: string,
  piAmount: number,
  paymentId: string,
  txid: string
): Promise<{ account: any; zpAmount: number }> {
  const ZP_PER_PI = await getConversionRate();
  const zpAmount = roundZP(piAmount * ZP_PER_PI);

  const { account } = await creditZP(userUID, zpAmount, 'purchase', 'purchased', null, '', {
    pi_amount: piAmount,
    payment_id: paymentId,
    txid,
    rate: `${ZP_PER_PI} ZP per Pi`,
  });

  return { account, zpAmount };
}
