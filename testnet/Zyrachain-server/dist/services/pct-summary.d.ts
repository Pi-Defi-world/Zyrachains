export type PctSummaryDoc = {
    _id: 'summary';
    walletsTracked: number;
    walletsTrackedCoreTeam: number;
    walletsTrackedCex: number;
    scannedWallets: number;
    startingBalance: number | null;
    startingBalanceAllTracked: number | null;
    currentBalance: number | null;
    confirmedChanges: number;
    totalOut: number;
    netChange24h: number;
    latestCheck: Date | null;
    scanLock: boolean;
    updatedAt: Date;
};
export declare function refreshPctSummary(): Promise<PctSummaryDoc>;
export declare function getPctSummary(): Promise<PctSummaryDoc | null>;
//# sourceMappingURL=pct-summary.d.ts.map