export interface PctMetaDoc {
    _id: string;
    baselineSumPi: number | null;
    lastFullScanAt: Date | null;
    scanLock: boolean;
    scanStartedAt: Date | null;
}
export declare function getPctMeta(): Promise<PctMetaDoc | null>;
export declare function tryAcquireScanLock(): Promise<boolean>;
export declare function releaseScanLock(): Promise<void>;
export declare function runPctBalanceScan(): Promise<{
    ok: boolean;
    skipped?: boolean;
    walletsProcessed: number;
    walletsFailed: number;
    eventsCreated: number;
    movementsCreated: number;
    durationMs: number;
    error?: string;
}>;
//# sourceMappingURL=pct-balance-scanner.d.ts.map