// horizon.ts - Complete rewrite with comprehensive validation and error handling

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { getCexAddresses, LabledAddress, isValidPiNetworkAddress } from '../utils/addresses';

// ===== CONSTANTS =====

const BASE_URL = process.env.NEXT_PUBLIC_HORIZON_BASE_URL || 'https://horizon.suban.org/horizon';
const BASE_URL_OWN =
  process.env.NEXT_PUBLIC_HORIZON_FALLBACK_URL || 'https://horizon.suban.org/horizon';

const REQUEST_TIMEOUT = 10000; // 10 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; 
const MAX_CONCURRENT_REQUESTS = Number(process.env.NEXT_PUBLIC_HORIZON_MAX_CONCURRENCY || 6);

// ===== TYPE DEFINITIONS =====

interface HorizonResponse<T> {
  _embedded?: {
    records: T[];
  };
  _links?: {
    next?: { href: string };
    prev?: { href: string };
    self?: { href: string };
  };
}

interface AccountData {
  id: string;
  balances: Array<{
    asset_type: string;
    balance: string;
    buying_liabilities?: string;
    selling_liabilities?: string;
  }>;
  sequence: string;
  last_modified_time: string;
  error?: string;
}

interface BalanceData {
  Address: string;
  Balance: number;
}

interface CexData extends BalanceData {
  Name: string;
  Logo: string;
  Url: string;
  SignUp: string;
  Rank: number;
}

// ===== AXIOS CONFIGURATION =====

let activeRequests = 0;
const requestQueue: Array<() => void> = [];

async function acquireRequestSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    return;
  }
  await new Promise<void>((resolve) => requestQueue.push(resolve));
  activeRequests++;
}

function releaseRequestSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
  const next = requestQueue.shift();
  if (next) next();
}

const createApiInstance = (baseURL: string, fallbackBaseURL?: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor for logging
  instance.interceptors.request.use(
    async (config) => {
      await acquireRequestSlot();
      (config as any).__releaseSlot = true;
      // Avoid noisy request logging on hot paths.
      horizonMetrics.requests++;
      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if ((response.config as any).__releaseSlot) {
        releaseRequestSlot();
        delete (response.config as any).__releaseSlot;
      }
      const status = response.status;
      if (status >= 200 && status < 300) horizonMetrics.responses2xx++;
      else if (status === 429) horizonMetrics.responses429++;
      else if (status >= 400 && status < 500) horizonMetrics.responses4xx++;
      else if (status >= 500) horizonMetrics.responses5xx++;
      return response;
    },
    async (error: AxiosError) => {
      if ((error.config as any)?.__releaseSlot) {
        releaseRequestSlot();
        delete (error.config as any).__releaseSlot;
      }
      const canRetryOnFallback =
        !!fallbackBaseURL &&
        !!error.config &&
        !(error.config as any).__fallbackTried &&
        (typeof error.response?.status !== 'number' ||
          error.response.status === 429 ||
          error.response.status >= 500);
      if (canRetryOnFallback && error.config) {
        try {
          const cfg = {
            ...error.config,
            baseURL: fallbackBaseURL,
            url: error.config.url,
          } as any;
          cfg.__fallbackTried = true;
          const response = await instance.request(cfg);
          return response;
        } catch {
          // Let the original error handling flow continue.
        }
      }
      const url = error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown';
      const status = error.response?.status || 'no-response';
      if (typeof error.response?.status === 'number') {
        const s = error.response.status;
        if (s === 429) horizonMetrics.responses429++;
        else if (s >= 400 && s < 500) horizonMetrics.responses4xx++;
        else if (s >= 500) horizonMetrics.responses5xx++;
      }
      
      if (error.response?.status === 400 || error.response?.status === 404) {
        // Don't log 400/404 as errors since they're expected for non-existent accounts
      } else {
        console.error(`❌ API Error ${status}: ${url}`, error.message);
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

type HorizonMetrics = {
  requests: number;
  responses2xx: number;
  responses4xx: number;
  responses5xx: number;
  responses429: number;
};

const horizonMetrics: HorizonMetrics = {
  requests: 0,
  responses2xx: 0,
  responses4xx: 0,
  responses5xx: 0,
  responses429: 0,
};

export function getHorizonMetrics(): HorizonMetrics {
  return { ...horizonMetrics };
}

const sharedApi = createApiInstance(BASE_URL, BASE_URL_OWN);
const api = sharedApi;
const api_own = sharedApi;

// ===== UTILITY FUNCTIONS =====

/**
 * Sleep function for retry delays
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 */
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      console.warn(`⚠️  Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`, lastError.message);
      await sleep(delay);
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError!;
};

/**
 * Create default account data structure
 */
const createDefaultAccount = (accountId: string, error?: string): AccountData => ({
  id: accountId,
  balances: [{ asset_type: 'native', balance: '0.0000000' }],
  sequence: '0',
  last_modified_time: new Date().toISOString(),
  ...(error && { error })
});

/**
 * Create default horizon response structure
 */
const createDefaultHorizonResponse = <T>(records: T[] = []): HorizonResponse<T> => ({
  _embedded: { records },
  _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
});

/**
 * Validate and clean URL parameters
 */
const cleanUrl = (url: string, baseUrl: string): string => {
  try {
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    }
    return url;
  } catch (error) {
    console.warn('⚠️  Invalid URL provided, using default:', error);
    return '';
  }
};

// ===== MAIN HORIZON API CLIENT =====

export const horizon = {
  /**
   * Get account details by ID with comprehensive validation
   */
  getAccountDetails: async (accountId: string): Promise<AccountData> => {
    // Input validation
    if (!accountId || typeof accountId !== 'string') {
      console.warn('🚫 Invalid account ID type:', typeof accountId, accountId);
      return createDefaultAccount('invalid', 'Invalid account ID: must be a non-empty string');
    }

    const cleanAccountId = accountId.trim();
    
    if (cleanAccountId === '') {
      console.warn('🚫 Empty account ID provided');
      return createDefaultAccount('', 'Invalid account ID: cannot be empty');
    }

    if (!isValidPiNetworkAddress(cleanAccountId)) {
      console.warn('🚫 Invalid Pi Network address format:', cleanAccountId);
      return createDefaultAccount(cleanAccountId, `Invalid Pi Network address format`);
    }

    try {
      const response = await retryWithBackoff(async () => {
        return await api_own.get(`/accounts/${encodeURIComponent(cleanAccountId)}`);
      });

      console.log(`✅ Successfully fetched account details for ${cleanAccountId.substring(0, 8)}...${cleanAccountId.substring(cleanAccountId.length - 8)}`);
      return response.data;

    } catch (error: any) {
      // Handle different types of errors appropriately
      if (error?.response?.status === 400 || error?.response?.status === 404) {
        // Account doesn't exist - return default account without logging as error
        return createDefaultAccount(cleanAccountId);
      }

      // Log unexpected errors
      console.error(`❌ Unexpected error fetching account ${cleanAccountId}:`, error.message);
      return createDefaultAccount(cleanAccountId, `Error: ${error.message}`);
    }
  },

  /**
   * Get account transactions with validation
   */
  getAccountTransactions: async (accountId: string, limit: number = 10): Promise<HorizonResponse<any>> => {
    if (!isValidPiNetworkAddress(accountId)) {
      console.warn('🚫 Invalid account ID for transactions:', accountId);
      return createDefaultHorizonResponse();
    }

    try {
      const response = await retryWithBackoff(async () => {
        return await api.get(`/accounts/${encodeURIComponent(accountId)}/transactions`, {
          params: { limit, order: 'desc' }
        });
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching account transactions:', error);
      return createDefaultHorizonResponse();
    }
  },

   // 🔍 Get latest transactions
   getLatestTransactions: async (link="",limit=20) => {
    try {
      let path=`/transactions?limit=${limit}&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching latest transactions:', error);
      // Return empty data structure that matches expected format
      return {
        _embedded: { records: [] },
        _links: { next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get ledger by sequence number
  getLedgerBySequence: async (sequence: number) => {
    try {
      const response = await api.get(`/ledgers/${sequence}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ledger:', error);
      // Return default ledger structure
      return {
        id: '',
        sequence: sequence,
        transaction_count: 0,
        successful_transaction_count: 0,
        operation_count: 0,
        closed_at: new Date().toISOString(),
        total_coins: '0',
        fee_pool: '0'
      };
    }
  },
  getTransactionByHash: async (hash: string) => {
    try {
      const response = await api.get(`/transactions/${hash}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      // Return default transaction structure
      return {
        hash: hash,
        successful: false,
        created_at: new Date().toISOString(),
        source_account: '',
        fee_charged: '0',
        operation_count: 0
      };
    }
  },
  getOperationByTxHash: async (hash: string) => {
    try {
      const response = await api.get(`/transactions/${hash}/operations?limit=200&order=asc`);
      return response.data;
    } catch (error) {
      console.error('Error fetching operations:', error);
      // Return empty operations data
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },
  getEffectByTxHash: async (hash: string) => {
    try {
      const response = await api.get(`/transactions/${hash}/effects?limit=200&order=asc`);
      return response.data;
    } catch (error) {
      console.error('Error fetching effects:', error);
      // Return empty effects data
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get list of ledgers
  getLedgers: async (link="") => {
    try {
      let path='/ledgers?order=desc&limit=20';
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      // Return empty ledgers data
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get network fee stats
  getFeeStats: async () => {
    try {
      const response = await api_own.get('/fee_stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching fee stats:', error);
      // Return default fee stats
      return {
        last_ledger: '0',
        last_ledger_base_fee: '0',
        ledger_capacity_usage: '0',
        fee_charged: { min: '0', max: '0', mode: '0', p10: '0', p20: '0', p30: '0', p40: '0', p50: '0', p60: '0', p70: '0', p80: '0', p90: '0', p95: '0', p99: '0' },
        max_fee: { min: '0', max: '0', mode: '0', p10: '0', p20: '0', p30: '0', p40: '0', p50: '0', p60: '0', p70: '0', p80: '0', p90: '0', p95: '0', p99: '0' }
      };
    }
  },

  // 🔍 Get all available assets
  getAssets: async (limit = 10) => {
    try {
      const response = await api_own.get('/assets', {
        params: {
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching assets:', error);
      // Return empty assets data
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get liquidity pools
  getLiquidityPools: async (link = "", limit = 20) => {
    try {
      let path = `/liquidity_pools?limit=${limit}&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching liquidity pools:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get offers (order book entries)
  getOffers: async (link = "", limit = 20) => {
    try {
      let path = `/offers?limit=${limit}&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching offers:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get order book for specific assets
  getOrderBook: async (sellingAsset: string, buyingAsset: string, limit = 20) => {
    try {
      const response = await api_own.get('/order_book', {
        params: {
          selling_asset_type: 'native',
          buying_asset_type: 'credit_alphanum4',
          buying_asset_code: buyingAsset,
          limit,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching order book:', error);
      return {
        bids: [],
        asks: [],
        base: { asset_type: 'native' },
        counter: { asset_type: 'credit_alphanum4', asset_code: buyingAsset }
      };
    }
  },

  // 🔍 Get payments (filtered transactions)
  getPayments: async (link = "", limit = 20, includeFailed = false) => {
    try {
      let path = `/payments?limit=${limit}&order=desc&include_failed=${includeFailed}`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get strict receive paths
  getStrictReceivePaths: async (sourceAssets: string[], destinationAsset: string, destinationAmount: string) => {
    try {
      const response = await api_own.get('/paths/strict-receive', {
        params: {
          source_assets: sourceAssets.join(','),
          destination_asset_type: 'native',
          destination_amount: destinationAmount,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching strict receive paths:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' } }
      };
    }
  },

  // 🔍 Get strict send paths
  getStrictSendPaths: async (sourceAsset: string, sourceAmount: string, destinationAssets: string[]) => {
    try {
      const response = await api_own.get('/paths/strict-send', {
        params: {
          source_asset_type: 'native',
          source_amount: sourceAmount,
          destination_assets: destinationAssets.join(','),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching strict send paths:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' } }
      };
    }
  },

  // 🔍 Get trades
  getTrades: async (link = "", limit = 20) => {
    try {
      let path = `/trades?limit=${limit}&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching trades:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get trade aggregations
  getTradeAggregations: async (baseAsset: string, counterAsset: string, resolution: number, startTime: string, endTime: string) => {
    try {
      const response = await api_own.get('/trade_aggregations', {
        params: {
          base_asset_type: 'native',
          counter_asset_type: 'credit_alphanum4',
          counter_asset_code: counterAsset,
          resolution,
          start_time: startTime,
          end_time: endTime,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trade aggregations:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' } }
      };
    }
  },

  // 🔍 Get network statistics
  getNetworkStats: async () => {
    try {
      const response = await api_own.get('');
      return response.data;
    } catch (error) {
      console.error('Error fetching network stats:', error);
      return {
        horizon_version: 'unknown',
        core_version: 'unknown',
        ingest_latest_ledger: 0,
        history_latest_ledger: 0,
        core_latest_ledger: 0,
        network_passphrase: 'Pi Network',
        current_protocol_version: 19,
        supported_protocol_version: 19,
        core_supported_protocol_version: 19
      };
    }
  },

  // 🔍 Get accounts with filters
  getAccounts: async (link = "", limit = 20, signer?: string, sponsor?: string, asset?: string) => {
    try {
      let path = `/accounts?limit=${limit}&order=desc`;
      if (signer) path += `&signer=${signer}`;
      if (sponsor) path += `&sponsor=${sponsor}`;
      if (asset) path += `&asset=${asset}`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get effects with filters
  getGlobalEffects: async (link = "", limit = 20) => {
    try {
      let path = `/effects?limit=${limit}&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching effects:', error);
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },

  // 🔍 Get operation by ID
  getOperationById: async (operationId: string) => {
    try {
      const response = await api_own.get(`/operations/${operationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching operation:', error);
      return {
        id: operationId,
        type: 'unknown',
        created_at: new Date().toISOString(),
        transaction_hash: '',
        source_account: '',
        successful: false
      };
    }
  },

  // 🔍 Get offer by ID
  getOfferById: async (offerId: string) => {
    try {
      const response = await api_own.get(`/offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching offer:', error);
      return {
        id: offerId,
        seller: '',
        selling: { asset_type: 'native' },
        buying: { asset_type: 'native' },
        amount: '0',
        price: '0',
        price_r: { n: 0, d: 1 }
      };
    }
  },

  getCexData: async () => {
    try {
      const cexAddresses = getCexAddresses();
      // Gọi tất cả các API call cùng lúc
      const balancePromises = cexAddresses.map(async (address) => {
        try {
          const response = await api_own.get(`/accounts/${address}`);
          const balance = response.data.balances.find(
            (b: any) => b.asset_type === "native"
          );
          const cexData = LabledAddress[address];
          return {
            Address: address,
            Name: cexData?.Name || 'Unknown CEX',
            Logo: cexData?.Logo || '',
            Url: cexData?.Website || '',
            SignUp: cexData?.Buy || '',
            Rank: 0,
            Balance: parseFloat(balance?.balance || "0"),
          };
        } catch (error) {
          console.error(`Error fetching balance for CEX ${address}:`, error);
          // Return CEX with zero balance on error
          const cexData = LabledAddress[address];
          return {
            Address: address,
            Name: cexData?.Name || 'Unknown CEX',
            Logo: cexData?.Logo || '',
            Url: cexData?.Website || '',
            SignUp: cexData?.Buy || '',
            Rank: 0,
            Balance: 0,
          };
        }
      });
      const updatedCexs = await Promise.all(balancePromises);
      return updatedCexs;
    } catch (error) {
      console.error('Error fetching cex balances:', error);
      // Return original CEXs with zero balances
      const cexAddresses = getCexAddresses();
      return cexAddresses.map(address => {
        const cexData = LabledAddress[address];
        return {
          Address: address,
          Name: cexData?.Name || 'Unknown CEX',
          Logo: cexData?.Logo || '',
          Url: cexData?.Website || '',
          SignUp: cexData?.Buy || '',
          Rank: 0,
          Balance: 0,
        };
      });
    }
  },
  //get balance of list address
  getBalances: async (addresses: string[]) => {
    try {
      // Filter out invalid addresses and limit batch size
      const validAddresses = addresses.filter(addr => 
        addr && typeof addr === 'string' && addr.length === 56 && addr.startsWith('G')
      ).slice(0, 50); // Limit to 50 addresses per batch
      
      if (validAddresses.length === 0) {
        return [];
      }

      const balancePromises = validAddresses.map(async (address) => {
        try {
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const response = await api_own.get(`/accounts/${address}`);
          const balance = response.data.balances?.find(
            (b: any) => b.asset_type === "native"
          );
          return {
            Address: address,
            Balance: parseFloat(balance?.balance || "0"),
          };
        } catch (error: any) {
          // Handle 400/404 errors gracefully (account doesn't exist)
          if (error.response?.status === 400 || error.response?.status === 404) {
            console.log(`Account ${address} not found, returning 0 balance`);
          } else {
            console.error(`Error fetching balance for address ${address}:`, error.message);
          }
          // Return address with zero balance on error
          return {
            Address: address,
            Balance: 0,
          };
        }
      });
      
      const balances = await Promise.all(balancePromises);
      return balances;
    } catch (error) {
      console.error('Error fetching balances:', error);
      // Return addresses with zero balances
      return addresses.map(address => ({ Address: address, Balance: 0 }));
    }
  },
  
  getLatestBlock: async () => {
    try {
      const response = await api_own.get('');
      return response.data.core_latest_ledger;
    } catch (error) {
      console.error('Error fetching network stats:', error);
      return 0; // Return a default value instead of throwing
    }
  },
  getTps: async () => {
    try {
      const latestBlockData=await api_own.get('/ledgers?order=desc&limit=100');
      let tps=0;
      for (let i = 0; i < latestBlockData.data._embedded.records.length; i++) {
        const element = latestBlockData.data._embedded.records[i];
        tps+=element.successful_transaction_count;
      }
      return tps/500;
    } catch (error) {
      console.error('Error fetching network stats:', error);
      return 0; // Return default value
    }
  },
  getTransactions: async(sequence:string,link="")=>{
    try{
      let path=`/ledgers/${sequence}/transactions?limit=20&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api.get(path);
      return response.data;
    }catch(error){
      console.error('Error fetching transactions:', error);
      // Return empty data structure
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },
  getOperations: async(sequence:string,link="")=>{
    try{
      let path=`/ledgers/${sequence}/operations?limit=20&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api.get(path);
      return response.data;
    }catch(error){
      console.error('Error fetching operations:', error);
      // Return empty data structure
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },
  getEffects: async(sequence:string,link="")=>{
    try{
      let path=`/ledgers/${sequence}/effects?limit=20&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api.get(path);
      return response.data;
    }catch(error){
      console.error('Error fetching effects:', error);
      // Return empty data structure
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },
  getLatestOperations: async (link="",limit = 20) => {
    try {
      let path=`/operations?limit=${limit}&order=desc`;
      if (link) {
        path = link.substring(30);
      }
      const response = await api_own.get(path);
      return response.data;
    } catch (error) {
      console.error('Error fetching latest operations:', error);
      // Return empty data structure that matches expected format
      return {
        _embedded: { records: [] },
        _links: { next: { href: '' }, prev: { href: '' } }
      };
    }
  },
  getClaimableBalances: async (accountId: string) => {
    try {
      const response = await api_own.get(`/claimable_balances?claimant=${accountId}&limit=100`);
      return response.data;
    } catch (error) {
      console.error('Error fetching claimable balances:', error);
      // Return empty claimable balances data
      return {
        _embedded: { records: [] },
        _links: { self: { href: '' }, next: { href: '' }, prev: { href: '' } }
      };
    }
  },
  getClaimEffect: async (link: string) => {
    try {
      link = link.replace("http://","https://");
      try {
        const parsed = new URL(link);
        link = parsed.pathname + parsed.search;
      } catch {
        link = link.substring(30);
      }
      const response = await api_own.get(link);
      const data =response.data._embedded.records.find((record: any) => record.type === 'claimable_balance_claimed')
      if (data) {
        return parseFloat(data.amount);
      }
      return 0;
    } catch (error) {
      console.error('Error fetching claimable balances:', error);
      return 0; // Return 0 as default value
    }
  }
};
