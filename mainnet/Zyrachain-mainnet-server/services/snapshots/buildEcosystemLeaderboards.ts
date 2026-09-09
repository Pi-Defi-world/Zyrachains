import mongoose from 'mongoose';
import {
  enrichEcosystemCommunityDocuments,
  enrichEcosystemInfluencerDocuments,
  sortEcosystemCommunitiesByMembers,
  sortEcosystemInfluencersByFollowers,
} from '../../zyrachain-lib/lib/ecosystem-social-enrich';
import { upsertSnapshot } from './snapshotStore';
import type { EcosystemLeaderboardsPayload } from './types';

export async function buildEcosystemLeaderboards(): Promise<EcosystemLeaderboardsPayload> {
  let communities: Record<string, unknown>[] = (await mongoose.connection
    .collection('communities')
    .find({})
    .toArray()) as Record<string, unknown>[];

  let influencers: Record<string, unknown>[] = (await mongoose.connection
    .collection('influencers')
    .find({})
    .toArray()) as Record<string, unknown>[];

  const withSocial = process.env.SNAPSHOT_SOCIAL_STATS !== '0';

  if (withSocial) {
    try {
      communities = sortEcosystemCommunitiesByMembers(
        await enrichEcosystemCommunityDocuments(communities)
      );
    } catch (e) {
      console.warn('[buildEcosystemLeaderboards] communities enrich failed:', e);
    }
    try {
      influencers = sortEcosystemInfluencersByFollowers(
        await enrichEcosystemInfluencerDocuments(influencers)
      );
    } catch (e) {
      console.warn('[buildEcosystemLeaderboards] influencers enrich failed:', e);
    }
  }

  const payload: EcosystemLeaderboardsPayload = {
    communities,
    influencers,
    socialStats: withSocial,
    updatedAt: new Date().toISOString(),
  };
  await upsertSnapshot('ecosystem_leaderboards', payload);
  return payload;
}
