export declare function telegramHandleFromCommunityDoc(doc: Record<string, unknown>): string | null;
export declare function twitterHandleFromInfluencerDoc(doc: Record<string, unknown>): string | null;
export declare function enrichEcosystemCommunityDocuments(docs: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
export declare function enrichEcosystemInfluencerDocuments(docs: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
export declare function sortEcosystemCommunitiesByMembers(docs: Record<string, unknown>[]): Record<string, unknown>[];
export declare function sortEcosystemInfluencersByFollowers(docs: Record<string, unknown>[]): Record<string, unknown>[];
//# sourceMappingURL=ecosystem-social-enrich.d.ts.map