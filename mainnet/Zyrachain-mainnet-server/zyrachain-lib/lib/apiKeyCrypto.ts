import crypto from 'crypto';

export function hashOracleApiKey(plain: string): string {
  const pepper =
    process.env.API_KEY_PEPPER || 'Zyrachain-oracle-default-pepper-change-in-production';
  return crypto.createHash('sha256').update(plain + pepper).digest('hex');
}

export function generateOracleApiKey(): string {
  return `zyra_${crypto.randomBytes(24).toString('hex')}`;
}
