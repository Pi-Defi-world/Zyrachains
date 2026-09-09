"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSnapshotPayload = getSnapshotPayload;
exports.upsertSnapshot = upsertSnapshot;
const mongoose_1 = __importDefault(require("mongoose"));
const COLLECTION = 'snapshots';
async function getSnapshotPayload(id) {
    const doc = await mongoose_1.default.connection.collection(COLLECTION).findOne({ _id: id });
    if (!doc || doc.payload === undefined || doc.payload === null)
        return null;
    return {
        payload: doc.payload,
        updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : new Date(doc.updatedAt),
    };
}
async function upsertSnapshot(id, payload) {
    await mongoose_1.default.connection.collection(COLLECTION).updateOne({ _id: id }, { $set: { payload, updatedAt: new Date() } }, { upsert: true });
}
//# sourceMappingURL=snapshotStore.js.map