// Client-safe configuration for Pi Network
interface ClientConfig {
  PI_BACKEND_HORIZON_MAINNET_URL: string;
  PI_BACKEND_HORIZON_MAINNET_PASSPHRASE: string;
  PI_BACKEND_HORIZON_TESTNET_URL: string;
  PI_BACKEND_HORIZON_TESTNET_PASSPHRASE: string;
  PI_BACKEND_HORIZON_DEFAULT_TIMEBOUNDS: number;
  PI_BACKEND_HORIZON_TIMEOUT_MS: number;
  PI_BACKEND_PLATFORM_BASE_URL: string;
}

// Client-safe configuration using Next.js public environment variables
// For client-side usage, these should be prefixed with NEXT_PUBLIC_
const config: ClientConfig = {
  PI_BACKEND_HORIZON_MAINNET_URL: 
    (typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_PI_BACKEND_HORIZON_MAINNET_URL 
      : process.env.PI_BACKEND_HORIZON_MAINNET_URL) || 
    'https://api.minepi.com',
  
  PI_BACKEND_HORIZON_MAINNET_PASSPHRASE: 
    (typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_PI_BACKEND_HORIZON_MAINNET_PASSPHRASE 
      : process.env.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE) || 
    'Pi Network',
    
  PI_BACKEND_HORIZON_TESTNET_URL: 
    (typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_PI_BACKEND_HORIZON_TESTNET_URL 
      : process.env.PI_BACKEND_HORIZON_TESTNET_URL) || 
    'https://testnet.suban.org',
    
  PI_BACKEND_HORIZON_TESTNET_PASSPHRASE: 
    (typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_PI_BACKEND_HORIZON_TESTNET_PASSPHRASE 
      : process.env.PI_BACKEND_HORIZON_TESTNET_PASSPHRASE) || 
    'Pi Testnet',
    
  PI_BACKEND_HORIZON_DEFAULT_TIMEBOUNDS: 180,
  PI_BACKEND_HORIZON_TIMEOUT_MS: 20000,
  
  PI_BACKEND_PLATFORM_BASE_URL: 
    (typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_PI_BACKEND_PLATFORM_BASE_URL 
      : process.env.PI_BACKEND_PLATFORM_BASE_URL) || 
    'https://api.minepi.com'
};

export { config }; 