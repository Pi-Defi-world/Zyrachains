export interface LatestTradesPayload {
    records: unknown[];
    horizonLinks?: Record<string, unknown>;
    updatedAt: string;
}
export declare function buildLatestTrades(limit?: number): Promise<LatestTradesPayload>;
//# sourceMappingURL=buildLatestTrades.d.ts.map