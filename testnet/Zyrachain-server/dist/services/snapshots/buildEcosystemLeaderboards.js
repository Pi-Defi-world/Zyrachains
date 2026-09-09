"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEcosystemLeaderboards = buildEcosystemLeaderboards;
const mongoose_1 = __importDefault(require("mongoose"));
const ecosystem_social_enrich_1 = require("../../zyrachain-lib/lib/ecosystem-social-enrich");
const snapshotStore_1 = require("./snapshotStore");
async function buildEcosystemLeaderboards() {
    let communities = (await mongoose_1.default.connection
        .collection('communities')
        .find({})
        .toArray());
    let influencers = (await mongoose_1.default.connection
        .collection('influencers')
        .find({})
        .toArray());
    const withSocial = process.env.SNAPSHOT_SOCIAL_STATS !== '0';
    if (withSocial) {
        try {
            communities = (0, ecosystem_social_enrich_1.sortEcosystemCommunitiesByMembers)(await (0, ecosystem_social_enrich_1.enrichEcosystemCommunityDocuments)(communities));
        }
        catch (e) {
            console.warn('[buildEcosystemLeaderboards] communities enrich failed:', e);
        }
        try {
            influencers = (0, ecosystem_social_enrich_1.sortEcosystemInfluencersByFollowers)(await (0, ecosystem_social_enrich_1.enrichEcosystemInfluencerDocuments)(influencers));
        }
        catch (e) {
            console.warn('[buildEcosystemLeaderboards] influencers enrich failed:', e);
        }
    }
    const payload = {
        communities,
        influencers,
        socialStats: withSocial,
        updatedAt: new Date().toISOString(),
    };
    await (0, snapshotStore_1.upsertSnapshot)('ecosystem_leaderboards', payload);
    return payload;
}
//# sourceMappingURL=buildEcosystemLeaderboards.js.map