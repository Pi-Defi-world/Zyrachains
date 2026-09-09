export declare const DEFAULT_SETTINGS: Record<string, any>;
export declare function getSetting<T>(key: string, fallback: T): Promise<T>;
export declare function setSetting(key: string, value: any, updatedBy: string): Promise<void>;
export declare function getAllSettings(): Promise<Record<string, any>>;
export declare function getConversionRate(): Promise<number>;
export declare function getPlatformFeeRate(): Promise<number>;
export declare function getReferralReward(): Promise<number>;
export declare function getStreakMilestones(): Promise<Array<{
    days: number;
    zp: number;
}>>;
export declare function getNextStreakMilestone(streakDays: number): Promise<{
    days: number;
    zp: number;
    daysAway: number;
} | null>;
//# sourceMappingURL=platform-settings.d.ts.map