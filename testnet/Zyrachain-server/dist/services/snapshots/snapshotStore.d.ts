export declare function getSnapshotPayload<T>(id: string): Promise<{
    payload: T;
    updatedAt: Date;
} | null>;
export declare function upsertSnapshot(id: string, payload: unknown): Promise<void>;
//# sourceMappingURL=snapshotStore.d.ts.map