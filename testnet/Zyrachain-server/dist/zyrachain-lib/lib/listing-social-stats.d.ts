import { type TwitterPublicStats, type TelegramPublicStats } from './social-stats';
export interface InfluencerSocialStats {
    twitterUsername: string | null;
    twitter: TwitterPublicStats | null;
    twitterError?: string;
}
export interface CommunitySocialStats {
    telegramUsername: string | null;
    telegram: TelegramPublicStats | null;
    telegramError?: string;
    twitterUsername: string | null;
    twitter: TwitterPublicStats | null;
    twitterError?: string;
}
export declare function enrichInfluencerListings<T extends {
    twitter?: string;
}>(listings: T[]): Promise<Array<T & {
    socialStats: InfluencerSocialStats;
}>>;
export declare function enrichCommunityListings<T extends {
    telegram?: string;
    twitter?: string;
}>(listings: T[]): Promise<Array<T & {
    socialStats: CommunitySocialStats;
}>>;
export declare function sortInfluencersByTwitterFollowers<T extends {
    socialStats: InfluencerSocialStats;
}>(rows: T[]): T[];
export declare function sortCommunitiesByTelegramMembers<T extends {
    socialStats: CommunitySocialStats;
}>(rows: T[]): T[];
//# sourceMappingURL=listing-social-stats.d.ts.map