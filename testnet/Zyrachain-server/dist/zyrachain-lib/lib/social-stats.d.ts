export declare function normalizeTwitterHandle(input: string | undefined | null): string | null;
export declare function normalizeTelegramUsername(input: string | undefined | null): string | null;
export interface TwitterPublicStats {
    username: string;
    name: string;
    id: string;
    profileImageUrl?: string;
    verified?: boolean;
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    listedCount?: number;
    fetchedAt: string;
}
export interface TelegramPublicStats {
    username: string;
    title?: string;
    type?: string;
    memberCount: number | null;
    description?: string;
    fetchedAt: string;
}
export declare function fetchTwitterPublicStats(handle: string): Promise<{
    ok: true;
    data: TwitterPublicStats;
} | {
    ok: false;
    error: string;
    code?: string;
}>;
export declare function fetchTelegramPublicStats(username: string): Promise<{
    ok: true;
    data: TelegramPublicStats;
} | {
    ok: false;
    error: string;
    code?: string;
}>;
//# sourceMappingURL=social-stats.d.ts.map