import UserMission from '../zyrachain-lib/lib/models/UserMission';

const MISSION_POOL = [
  { key: 'create_post', target: 1, reward: 5, description: 'Create one post' },
  { key: 'like_posts', target: 5, reward: 3, description: 'Like 5 posts' },
  { key: 'comment', target: 3, reward: 4, description: 'Add 3 comments' },
  { key: 'tip_creator', target: 1, reward: 2, description: 'Tip a creator' },
  { key: 'follow_users', target: 3, reward: 2, description: 'Follow 3 users' },
  { key: 'reshare_post', target: 2, reward: 3, description: 'Reshare 2 posts' },
  { key: 'boost_post', target: 1, reward: 5, description: 'Boost a post' },
  { key: 'watch_ad', target: 2, reward: 1, description: 'Watch 2 ads' },
  { key: 'earn_tip', target: 1, reward: 3, description: 'Receive a tip' },
  { key: 'gain_follower', target: 2, reward: 3, description: 'Gain 2 followers' },
];

function getTodayDate(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function shuffleAndPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function generateDailyMissionsForUser(userUID: string): Promise<any> {
  const today = getTodayDate();
  const existing = await UserMission.findOne({ user_uid: userUID, mission_date: today });
  if (existing) return existing;

  const picked = shuffleAndPick(MISSION_POOL, 3);
  const missions = picked.map((m) => ({
    mission_key: m.key,
    progress: 0,
    target: m.target,
    completed: false,
    claimed: false,
    reward: m.reward,
  }));

  const userMission = new UserMission({
    user_uid: userUID,
    mission_date: today,
    missions,
  });
  await userMission.save();
  return userMission;
}

export async function updateMissionProgress(
  userUID: string,
  missionKey: string,
  increment: number = 1
): Promise<void> {
  const today = getTodayDate();
  const userMission = await UserMission.findOne({ user_uid: userUID, mission_date: today });
  if (!userMission) return;

  let updated = false;
  for (const mission of userMission.missions) {
    if (mission.mission_key === missionKey && !mission.completed && !mission.claimed) {
      mission.progress = Math.min(mission.progress + increment, mission.target);
      if (mission.progress >= mission.target) {
        mission.completed = true;
      }
      updated = true;
    }
  }

  if (updated) {
    await userMission.save();
  }
}

export async function getMissionPool(): Promise<typeof MISSION_POOL> {
  return MISSION_POOL;
}

export async function runMissionGenerator(): Promise<void> {
  console.log('[mission-generator] Daily missions generated on-demand per user');
}
