import mongoose from 'mongoose';

/**
 * Best-effort indexes for snapshot builders and monitor routes.
 */
export async function ensureHotIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;

  const tasks: Promise<unknown>[] = [
    db.collection('pct-balance-events').createIndex({ detectedAt: -1, _id: -1 }),
    db.collection('pct-balance-events').createIndex({ wallet: 1, detectedAt: -1 }),
    db.collection('pct-balance-events').createIndex({ transactionHash: 1, wallet: 1 }, { unique: true }),
    db.collection('pct-wallet-state').createIndex({ lastBalance: -1 }),
    db.collection('pct-wallet-state').createIndex({ identifier: 1 }),
    db.collection('pct-wallet-movements').createIndex({ paymentId: 1 }),
    db.collection('pct-wallet-movements').createIndex({ transactionHash: 1, wallet: 1 }, { unique: true }),
    db.collection('pct-wallet-movements').createIndex({ detectedAt: -1, _id: -1 }),
    db.collection('pct-stream-state').createIndex({ leaseExpiresAt: 1 }),
    db.collection('core-team-addresses').createIndex({ identifier: 1 }),
    db.collection('cex-addresses').createIndex({ identifier: 1 }),
    db.collection('generated-addresses').createIndex({ identifier: 1 }),
    db.collection('snapshots').createIndex({ updatedAt: -1 }),
    db.collection('pct-summary').createIndex({ updatedAt: -1 }),
  ];

  await Promise.allSettled(tasks);
}
