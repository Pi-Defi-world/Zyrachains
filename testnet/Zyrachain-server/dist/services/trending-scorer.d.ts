export declare function computeTrendingScore(post: any): number;
export declare function runTrendingScorer(): Promise<void>;
export declare function getTrendingFeed(page?: number, limit?: number): Promise<{
    posts: any[];
    total: number;
}>;
export declare function getFollowingFeed(userUID: string, followedUIDs: string[], page?: number, limit?: number): Promise<{
    posts: any[];
    total: number;
}>;
export declare function getNewFeed(page?: number, limit?: number): Promise<{
    posts: any[];
    total: number;
}>;
//# sourceMappingURL=trending-scorer.d.ts.map