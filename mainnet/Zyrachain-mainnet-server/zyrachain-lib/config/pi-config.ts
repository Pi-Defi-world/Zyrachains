import dotenv from "dotenv";
import path from "path";

// Load environment variables based on PI_ENV
export const dotenvConfig = dotenv.config({
  path: path.resolve(__dirname, `../../.env.${process.env.PI_ENV || 'local'}`),
}).parsed;

if (!dotenvConfig) {
  console.warn(`Failed to load .env file for PI_ENV: ${process.env.PI_ENV || 'local'}`);
}

interface ServerPiConfig {
  PI_BACKEND_HORIZON_MAINNET_URL: string;
  PI_BACKEND_HORIZON_MAINNET_PASSPHRASE: string;
  PI_BACKEND_HORIZON_TESTNET_URL: string;
  PI_BACKEND_HORIZON_TESTNET_PASSPHRASE: string;
  PI_BACKEND_HORIZON_DEFAULT_TIMEBOUNDS: number;
  PI_BACKEND_HORIZON_TIMEOUT_MS: number;
  PI_BACKEND_PLATFORM_BASE_URL: string;
  PI_API_KEY?: string;
  PI_ENV: string;
}

const serverPiConfig: ServerPiConfig = {
  PI_BACKEND_HORIZON_MAINNET_URL: 
    dotenvConfig?.PI_BACKEND_HORIZON_MAINNET_URL || 
    process.env.PI_BACKEND_HORIZON_MAINNET_URL || 
    'https://api.minepi.com',
  
  PI_BACKEND_HORIZON_MAINNET_PASSPHRASE: 
    dotenvConfig?.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE || 
    process.env.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE || 
    'Pi Network',
    
  PI_BACKEND_HORIZON_TESTNET_URL: 
    dotenvConfig?.PI_BACKEND_HORIZON_TESTNET_URL || 
    process.env.PI_BACKEND_HORIZON_TESTNET_URL || 
    'https://api.testnet.minepi.com',
    
  PI_BACKEND_HORIZON_TESTNET_PASSPHRASE: 
    dotenvConfig?.PI_BACKEND_HORIZON_TESTNET_PASSPHRASE || 
    process.env.PI_BACKEND_HORIZON_TESTNET_PASSPHRASE || 
    'Pi Testnet',
    
  PI_BACKEND_HORIZON_DEFAULT_TIMEBOUNDS: 180,
  PI_BACKEND_HORIZON_TIMEOUT_MS: 20000,
  
  PI_BACKEND_PLATFORM_BASE_URL: 
    dotenvConfig?.PI_BACKEND_PLATFORM_BASE_URL || 
    process.env.PI_BACKEND_PLATFORM_BASE_URL || 
    'https://api.minepi.com',
    
  PI_API_KEY: 
    dotenvConfig?.PI_API_KEY || 
    process.env.PI_API_KEY,
    
  PI_ENV: process.env.PI_ENV || 'production'
};

// Validate required environment variables on server
const requiredServerVars = [
  'PI_BACKEND_HORIZON_MAINNET_URL',
  'PI_BACKEND_HORIZON_MAINNET_PASSPHRASE', 
  'PI_BACKEND_HORIZON_TESTNET_URL',
  'PI_BACKEND_HORIZON_TESTNET_PASSPHRASE',
  'PI_BACKEND_PLATFORM_BASE_URL'
];

for (const varName of requiredServerVars) {
  if (!serverPiConfig[varName as keyof ServerPiConfig]) {
    console.warn(`Warning: Missing environment variable: ${varName}`);
  }
}

export { serverPiConfig };
export default serverPiConfig; 