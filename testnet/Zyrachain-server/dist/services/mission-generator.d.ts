declare const MISSION_POOL: {
    key: string;
    target: number;
    reward: number;
    description: string;
}[];
export declare function generateDailyMissionsForUser(userUID: string): Promise<any>;
export declare function updateMissionProgress(userUID: string, missionKey: string, increment?: number): Promise<void>;
export declare function getMissionPool(): Promise<typeof MISSION_POOL>;
export declare function runMissionGenerator(): Promise<void>;
export {};
//# sourceMappingURL=mission-generator.d.ts.map