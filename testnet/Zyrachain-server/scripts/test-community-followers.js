/**
 * Test script: verify community follower pipeline end-to-end.
 *
 * Usage:  node scripts/test-community-followers.js
 *         node scripts/test-community-followers.js PiCoreTeam
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') });
require('dotenv').config();

const mongoose = require('mongoose');
const axios = require('axios');

const HANDLE = process.argv[2] || 'PiCoreTeam';
const SERVER_BASE = process.env.TEST_SERVER_URL || 'http://localhost:4000';

async function main() {
  console.log('========================================');
  console.log('  Community Follower Pipeline Test');
  console.log('========================================\n');

  // 1. Connect to MongoDB
  console.log('[1/6] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 15000,
  });
  console.log('  ✅ Connected\n');

  // 2. Test X API direct fetch
  console.log(`[2/6] Fetching live X stats for @${HANDLE}...`);
  const token = process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;
  if (!token) {
    console.log('  ⚠️  No TWITTER_BEARER_TOKEN set in .env — skipping live X API check');
  } else {
    try {
      const { data: xData, status: xStatus } = await axios.get(
        `https://api.twitter.com/2/users/by/username/${encodeURIComponent(HANDLE)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { 'user.fields': 'public_metrics,profile_image_url,verified' },
          validateStatus: () => true,
        }
      );
      if (xStatus === 200 && xData?.data) {
        const u = xData.data;
        const m = u.public_metrics || {};
        console.log(`  ✅ X API OK (${xStatus})`);
        console.log(`     Name:      ${u.name}`);
        console.log(`     Username:  @${u.username}`);
        console.log(`     Followers: ${m.followers_count?.toLocaleString() || 'N/A'}`);
        console.log(`     Following: ${m.following_count?.toLocaleString() || 'N/A'}`);
        console.log(`     Tweets:    ${m.tweet_count?.toLocaleString() || 'N/A'}`);
      } else {
        console.log(`  ⚠️  X API returned ${xStatus}: ${JSON.stringify(xData?.errors || xData?.title)}`);
        console.log('  ⚠️  Skipping live X check, testing DB + API pipeline with test data');
      }
    } catch (e) {
      console.log(`  ⚠️  X API error: ${e.message}`);
      console.log('  ⚠️  Skipping live X check, testing DB + API pipeline with test data');
    }
  }
  console.log('');

  // 3. Write a test snapshot to MongoDB
  console.log('[3/6] Writing test snapshot to CommunityFollowerSnapshot...');
  const col = mongoose.connection.collection('communityfollowersnapshots');
  const testSnap = {
    handle: HANDLE.toLowerCase(),
    name: 'Test Snapshot',
    followersCount: 1000,
    followingCount: 50,
    tweetCount: 500,
    fetchedAt: new Date(),
  };
  try {
    await col.insertOne(testSnap);
    console.log(`  ✅ Snapshot written (handle=${testSnap.handle}, followers=${testSnap.followersCount})`);
  } catch (e) {
    console.log(`  ❌ Write failed: ${e.message}`);
  }
  // Also write one from 2 hours ago for growth calculation
  const oldSnap = {
    handle: HANDLE.toLowerCase(),
    name: 'Test Snapshot',
    followersCount: 900,
    followingCount: 50,
    tweetCount: 490,
    fetchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  };
  try {
    await col.insertOne(oldSnap);
    console.log(`  ✅ Historical snapshot written (2h ago, followers=${oldSnap.followersCount})`);
  } catch (e) {
    console.log(`  ❌ Historical write failed: ${e.message}`);
  }
  console.log('');

  // 4. Query snapshots from DB
  console.log(`[4/6] Reading snapshots from DB for @${HANDLE}...`);
  const snaps = await col.find({ handle: HANDLE.toLowerCase() }).sort({ fetchedAt: -1 }).limit(5).toArray();
  console.log(`  ✅ Found ${snaps.length} snapshot(s):`);
  snaps.forEach((s, i) => {
    console.log(`     [${i}] followers=${s.followersCount.toLocaleString()} at ${s.fetchedAt.toISOString()}`);
  });
  console.log('');

  // 5. Test API endpoints (requires server running)
  console.log('[5/6] Testing API endpoints (server at ' + SERVER_BASE + ')...');

  async function callApi(path) {
    try {
      const { data, status } = await axios.get(`${SERVER_BASE}${path}`, {
        validateStatus: () => true,
        timeout: 10000,
      });
      return { status, data };
    } catch (e) {
      return { status: 0, data: { error: e.message } };
    }
  }

  // Test /history
  const histRes = await callApi(`/api/community-followers/history?handle=${HANDLE}&range=7d`);
  console.log(`  /history:  HTTP ${histRes.status} | points=${histRes.data?.total || 0}`);
  if (histRes.data?.data?.length > 0) {
    const first = histRes.data.data[0];
    const last = histRes.data.data[histRes.data.data.length - 1];
    console.log(`            first=${first.followers}@${first.time?.slice(0, 19)} last=${last.followers}@${last.time?.slice(0, 19)}`);
  }

  // Test /stats
  const statsRes = await callApi(`/api/community-followers/stats?handle=${HANDLE}`);
  console.log(`  /stats:    HTTP ${statsRes.status} |`);
  if (statsRes.data?.current) {
    console.log(`            followers=${statsRes.data.current.followers}`);
    console.log(`            growth: 1d=${statsRes.data.growth?.change1dAbs}(${statsRes.data.growth?.change1dPct}%) 7d=${statsRes.data.growth?.change7dAbs}(${statsRes.data.growth?.change7dPct}%)`);
    console.log(`            ATH=${statsRes.data.allTimeHigh} snapshots=${statsRes.data.snapshotCount}`);
  }

  // Test /overview
  const ovRes = await callApi('/api/community-followers/overview');
  console.log(`  /overview: HTTP ${ovRes.status} | total=${ovRes.data?.total || 0} totalFollowers=${(ovRes.data?.totalFollowers || 0).toLocaleString()}`);
  if (ovRes.data?.communities?.length > 0) {
    console.log(`            communities with handles:`);
    ovRes.data.communities.slice(0, 5).forEach((c) => {
      console.log(`              @${c.handle} → ${(c.followers || 0).toLocaleString()} followers (24h: ${c.change24hAbs ?? '—'})`);
    });
  }
  console.log('');

  // 6. Check tracked handles discovery from ALL collections
  console.log('[6/6] Checking handle discovery from ALL collections...');

  function normHandle(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let s = raw.trim();
    s = s.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, '');
    s = s.replace(/^@/, '');
    s = s.split('/')[0]?.split('?')[0] ?? '';
    s = s.replace(/\/$/, '');
    if (!/^[a-z0-9_]{1,15}$/i.test(s)) return null;
    return s.toLowerCase();
  }

  // Community listings
  const communityCol = mongoose.connection.collection('communitylistings');
  const communityWithTw = await communityCol.find({ twitter: { $exists: true, $ne: '' }, status: 'approved' }).project({ name: 1, twitter: 1 }).toArray();
  console.log(`  communitylistings with twitter: ${communityWithTw.length}`);
  communityWithTw.forEach((d) => console.log(`    → ${d.name}: ${d.twitter}`));

  // Ecosystem communities
  const ecosystemCol = mongoose.connection.collection('communities');
  const ecoDocs = await ecosystemCol.find({}).project({ name: 1, Twitter: 1, twitter: 1, X: 1, x: 1, Website: 1, website: 1, Link: 1, link: 1 }).toArray();
  console.log(`  ecosystem communities (checking for Twitter/X fields): ${ecoDocs.length}`);
  const ecoTwitterFields = [];
  for (const d of ecoDocs) {
    const fields = {};
    for (const k of ['Twitter', 'twitter', 'X', 'x']) { if (d[k]) fields[k] = d[k]; }
    for (const k of ['Website', 'website', 'Link', 'link']) { if (d[k] && /twitter|x\.com/i.test(d[k])) fields[k] = d[k]; }
    let h = normHandle(d.Twitter || d.twitter || d.X || d.x);
    if (!h) {
      for (const k of ['Website', 'website', 'Link', 'link']) {
        const v = d[k];
        if (typeof v === 'string' && /(twitter\.com|x\.com)\b/i.test(v)) {
          h = normHandle(v);
          if (h) break;
        }
      }
    }
    if (h) {
      ecoTwitterFields.push({ name: d.name, handle: h, fields: JSON.stringify(fields) });
    }
  }
  console.log(`    with Twitter handles: ${ecoTwitterFields.length}`);
  ecoTwitterFields.forEach((f) => console.log(`    → ${f.name}: @${f.handle} (${f.fields})`));

  // Influencer listings
  const influencerCol = mongoose.connection.collection('influencerlistings');
  const influencerWithTw = await influencerCol.find({ twitter: { $exists: true, $ne: '' }, status: 'approved' }).project({ name: 1, twitter: 1 }).toArray();
  console.log(`  influencerlistings with twitter: ${influencerWithTw.length}`);
  influencerWithTw.forEach((d) => console.log(`    → ${d.name}: ${d.twitter}`));

  // Ecosystem influencers
  const ecoInfluencerCol = mongoose.connection.collection('influencers');
  const ecoInflDocs = await ecoInfluencerCol.find({}).project({ name: 1, Twitter: 1, twitter: 1, X: 1, x: 1, Website: 1, website: 1, Link: 1, link: 1 }).toArray();
  console.log(`  ecosystem influencers (checking for Twitter/X fields): ${ecoInflDocs.length}`);
  const ecoInflTwitterFields = [];
  for (const d of ecoInflDocs) {
    const fields = {};
    for (const k of ['Twitter', 'twitter', 'X', 'x']) { if (d[k]) fields[k] = d[k]; }
    for (const k of ['Website', 'website', 'Link', 'link']) { if (d[k] && /twitter|x\.com/i.test(d[k])) fields[k] = d[k]; }
    let h = normHandle(d.Twitter || d.twitter || d.X || d.x);
    if (!h) {
      for (const k of ['Website', 'website', 'Link', 'link']) {
        const v = d[k];
        if (typeof v === 'string' && /(twitter\.com|x\.com)\b/i.test(v)) {
          h = normHandle(v);
          if (h) break;
        }
      }
    }
    if (h) {
      ecoInflTwitterFields.push({ name: d.name, handle: h, fields: JSON.stringify(fields) });
    }
  }
  console.log(`    with Twitter handles: ${ecoInflTwitterFields.length}`);
  ecoInflTwitterFields.forEach((f) => console.log(`    → ${f.name}: @${f.handle} (${f.fields})`));

  console.log('\n========================================');
  console.log('  Test complete!');
  console.log('========================================');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error('Fatal:', e);
  mongoose.disconnect().then(() => process.exit(1));
});
