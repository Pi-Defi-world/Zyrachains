import mongoose from 'mongoose';

const COLLECTION = 'snapshots';

export async function getSnapshotPayload<T>(id: string): Promise<{
  payload: T;
  updatedAt: Date;
} | null> {
  // String _id keys for snapshot docs
  const doc = await mongoose.connection.collection(COLLECTION).findOne({ _id: id } as never);
  if (!doc || doc.payload === undefined || doc.payload === null) return null;
  return {
    payload: doc.payload as T,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
  };
}

export async function upsertSnapshot(id: string, payload: unknown): Promise<void> {
  await mongoose.connection.collection(COLLECTION).updateOne(
    { _id: id } as never,
    { $set: { payload, updatedAt: new Date() } },
    { upsert: true }
  );
}
