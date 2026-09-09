import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

async function main(): Promise<void> {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config();

  // Import after dotenv because the Mongo module reads env at load time.
  const { default: connectToDatabase } = await import('../zyrachain-lib/lib/mongodb');
  const { runPctBalanceScan } = await import('../services/pct-balance-scanner');

  await connectToDatabase();
  const result = await runPctBalanceScan();
  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();

  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
