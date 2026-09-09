export declare function getOrCreateGameStats(userUID: string): Promise<any>;
export declare function addXP(userUID: string, xpAmount: number, detail?: string): Promise<{
    xp: number;
    level: number;
    leveledUp: boolean;
    newLevel: number | null;
}>;
export declare function claimMission(userUID: string, missionKey: string): Promise<{
    claimed: boolean;
    reward: number;
    missions: any[];
}>;
export declare function getWeeklyLeaderboard(page?: number, limit?: number): Promise<{
    entries: any[];
    total: number;
}>;
//# sourceMappingURL=gamification-service.d.ts.map