// addresses.ts - Complete rewrite with comprehensive validation and error handling

// ===== TYPE DEFINITIONS =====

export interface AddressData {
  Name: string;
  Logo?: string;
  Category: string;
  Description?: string;
  Website?: string;
  Buy?: string;
  Role?: string;
}

export interface CommunityData {
  Name: string;
  Description?: string;
  Category: string;
  Members?: number;
  Activity?: string;
  Logo?: string;
  Website?: string;
  Region?: string;
}

export interface InfluencerData {
  Name: string;
  Description?: string;
  Platform: string;
  Followers?: number;
  Engagement?: string;
  Logo?: string;
  Website?: string;
  Region?: string;
  Category?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
  total?: number;
}

// ===== CONSTANTS =====

// Pi Network address validation pattern (56 characters starting with G)
const PI_ADDRESS_PATTERN = /^G[A-Z2-7]{55}$/;

// Fallback Core Team addresses (known valid addresses)
export const coreTeamAddress = [
  "GBQQRIQKS7XLMWTTRM2EPMTRLPUGQJDLEKCGNDIFGTBZG4GL5CHHJI25",
  "GABT7EMPGNCQSZM22DIYC4FNKHUVJTXITUF6Y5HNIWPU4GA7BHT4GC5G",
  "GALKEOXXIJKX76OMG5XNAIZA4F4Q5VRQBYW4LDU57SWORA7X47NSW4NM",
  "GAODAYUBCUWKJIMGV6NWZ2BBM6ONSDEQY34ILE6OHJ2BRKUKFD2V55VT",
  "GC5RNDCRO6DDM7NZDEMW3RIN5K6AHN6GMWSZ5SAH2TRJLVGQMB2I3BNJ",
  "GB7HLN74IIY6PENSHHBBJJXWV6IZQDELTBZNXXORDGTL75O4KC5CUXEV",
  "GBMZ7TIQWX56FI2URWSJEAIUWIRZ24AA3DWMJ42SC62CZ4FVQLU4VZD2",
  "GDPDSLFVGEPX6FJKGZXSTJCPTSKKAI4KBHBAQCCKQDXISW3S5SJ6MGMS",
];

// ===== STATE MANAGEMENT =====

export const LabledAddress: { [key: string]: AddressData } = {};
let addressesInitialized = false;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

// ===== VALIDATION HELPERS =====

/**
 * Validates Pi Network address format
 */
export const isValidPiNetworkAddress = (address: unknown): address is string => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  const trimmed = address.trim();
  return PI_ADDRESS_PATTERN.test(trimmed);
};

/**
 * Extracts address from various possible field names
 */
const extractAddress = (item: any): string | null => {
  const possibleFields = ['address', 'identifier', 'addr', 'wallet_address', 'account_id'];
  
  for (const field of possibleFields) {
    const value = item?.[field];
    if (isValidPiNetworkAddress(value)) {
      return value.trim();
    }
  }
  
  return null;
};

/**
 * Safely extracts field value from item with fallback
 */
const extractField = (item: any, fieldNames: string[], defaultValue: any = undefined): any => {
  for (const field of fieldNames) {
    const value = item?.[field];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return defaultValue;
};

/**
 * Validates and normalizes address data
 */
const normalizeAddressData = (item: any, category: string, index: number): { address: string; data: AddressData } | null => {
  const address = extractAddress(item);
  if (!address) {
    return null;
  }

  const name = extractField(item, ['name', 'Name', 'display_name'], `${category} ${index + 1}`);
  
  return {
    address,
    data: {
      Name: name,
      Logo: extractField(item, ['logo', 'Logo', 'image']),
      Category: extractField(item, ['category', 'Category'], category),
      Description: extractField(item, ['description', 'Description', 'desc']),
      Website: extractField(item, ['website', 'Website', 'url', 'homepage']),
      Buy: extractField(item, ['buy', 'Buy', 'purchase_url']),
      Role: extractField(item, ['role', 'Role', 'position'])
    }
  };
};

// ===== API HELPERS =====

/**
 * Fetches data from API endpoint with error handling
 */
const fetchFromEndpoint = async <T>(
  endpoint: string,
  category: string
): Promise<{ data: T[]; error?: string }> => {
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      console.error(`❌ Failed to fetch ${category} addresses:`, errorMessage);
      return { data: [], error: errorMessage };
    }

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      const errorMessage = result.message || 'API returned success: false';
      console.warn(`⚠️  ${category} API returned error:`, errorMessage);
      return { data: [], error: errorMessage };
    }

    if (!Array.isArray(result.data)) {
      const errorMessage = 'API returned non-array data';
      console.warn(`⚠️  ${category} API returned invalid format:`, result);
      return { data: [], error: errorMessage };
    }

    console.log(`✅ Successfully fetched ${result.data.length} ${category} entries`);
    return { data: result.data };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Network error fetching ${category} addresses:`, errorMessage);
    return { data: [], error: errorMessage };
  }
};

// ===== MAIN INITIALIZATION FUNCTION =====

/**
 * Initialize labeled addresses from API endpoints with comprehensive error handling
 */
export const initializeLabeledAddresses = async (): Promise<void> => {
  if (addressesInitialized) {
    return;
  }

  initializationAttempts++;
  console.log(`🔄 Initializing labeled addresses (attempt ${initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS})...`);

  try {
    let totalValid = 0;
    let totalInvalid = 0;
    const categoryStats: { [key: string]: { valid: number; invalid: number; error?: string } } = {};

    // Process CEX addresses
    const cexResult = await fetchFromEndpoint<any>('/api/addresses/cex', 'CEX');
    categoryStats.CEX = { valid: 0, invalid: 0, error: cexResult.error };
    
    if (cexResult.data.length > 0) {
      cexResult.data.forEach((item, index) => {
        const normalized = normalizeAddressData(item, 'CEX', index);
        if (normalized) {
          LabledAddress[normalized.address] = normalized.data;
          categoryStats.CEX.valid++;
          totalValid++;
        } else {
          categoryStats.CEX.invalid++;
          totalInvalid++;
          console.warn(`🚫 Invalid CEX entry ${index + 1}:`, {
            name: extractField(item, ['name', 'Name'], 'Unknown'),
            address: extractField(item, ['address', 'identifier'], 'missing')
          });
        }
      });
    }

    // Process Core Team addresses
    const coreTeamResult = await fetchFromEndpoint<any>('/api/addresses/core-team', 'Core Team');
    categoryStats['Core Team'] = { valid: 0, invalid: 0, error: coreTeamResult.error };
    
    if (coreTeamResult.data.length > 0) {
      coreTeamResult.data.forEach((item, index) => {
        const normalized = normalizeAddressData(item, 'Core Team', index);
        if (normalized) {
          LabledAddress[normalized.address] = normalized.data;
          categoryStats['Core Team'].valid++;
          totalValid++;
        } else {
          categoryStats['Core Team'].invalid++;
          totalInvalid++;
          console.warn(`🚫 Invalid Core Team entry ${index + 1}:`, {
            name: extractField(item, ['name', 'Name'], 'Unknown'),
            address: extractField(item, ['address', 'identifier'], 'missing')
          });
        }
      });
    }

    // Process Generated addresses
    const generatedResult = await fetchFromEndpoint<any>('/api/addresses/generated', 'Generated');
    categoryStats.Generated = { valid: 0, invalid: 0, error: generatedResult.error };
    
    if (generatedResult.data.length > 0) {
      generatedResult.data.forEach((item, index) => {
        const normalized = normalizeAddressData(item, 'Generated', index);
        if (normalized) {
          LabledAddress[normalized.address] = {
            ...normalized.data,
            Logo: normalized.data.Logo || '/assets/pipi.jpg' // Default logo for generated addresses
          };
          categoryStats.Generated.valid++;
          totalValid++;
        } else {
          categoryStats.Generated.invalid++;
          totalInvalid++;
          console.warn(`🚫 Invalid Generated entry ${index + 1}:`, {
            name: extractField(item, ['name', 'Name'], 'Unknown'),
            address: extractField(item, ['address', 'identifier'], 'missing')
          });
        }
      });
    }

    // Mark as initialized
    addressesInitialized = true;

    // Log comprehensive summary
    console.log('📊 Address Initialization Summary:');
    console.log(`  🎯 Total addresses loaded: ${totalValid}`);
    console.log(`  🚫 Invalid entries skipped: ${totalInvalid}`);
    console.log('  📋 Category breakdown:');
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const status = stats.error ? '❌' : stats.valid > 0 ? '✅' : '⚠️';
      console.log(`    ${status} ${category}: ${stats.valid} valid, ${stats.invalid} invalid${stats.error ? ` (${stats.error})` : ''}`);
    });

    // Warning if no addresses loaded
    if (totalValid === 0) {
      console.warn('⚠️  WARNING: No valid addresses were loaded! All API endpoints may be empty or returning invalid data.');
    }

  } catch (error) {
    console.error('❌ Critical error during address initialization:', error);
    
    // If this is not the last attempt, don't mark as initialized
    if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
      console.log(`🔄 Will retry initialization... (${initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS})`);
      // Retry after a delay
      setTimeout(() => {
        addressesInitialized = false;
        initializeLabeledAddresses();
      }, 2000);
      return;
    }
    
    // Final attempt failed, mark as initialized to prevent infinite retries
    addressesInitialized = true;
    console.error('❌ Maximum initialization attempts reached.');
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Check if addresses have been initialized
 */
export const isAddressesInitialized = (): boolean => addressesInitialized;

/**
 * Force re-initialization (useful for development)
 */
export const forceReinitializeAddresses = async (): Promise<void> => {
  addressesInitialized = false;
  initializationAttempts = 0;
  // Clear existing data
  Object.keys(LabledAddress).forEach(key => delete LabledAddress[key]);
  await initializeLabeledAddresses();
};

/**
 * Get all CEX addresses
 */
export const getCexAddresses = (): string[] => {
  return Object.entries(LabledAddress)
    .filter(([address, data]) => data.Category === "CEX" && isValidPiNetworkAddress(address))
    .map(([address]) => address);
};

/**
 * Get all Core Team addresses
 */
export const getCoreTeamAddresses = (): string[] => {
  const dbCoreTeam = Object.entries(LabledAddress)
    .filter(([address, data]) => data.Category === "Core Team" && isValidPiNetworkAddress(address))
    .map(([address]) => address);
  
  // Return database addresses if available, otherwise validated fallback
  return dbCoreTeam.length > 0 ? dbCoreTeam : coreTeamAddress.filter(isValidPiNetworkAddress);
};

/**
 * Get all valid addresses
 */
export const getAllAddresses = (): string[] => {
  return Object.keys(LabledAddress).filter(isValidPiNetworkAddress);
};

/**
 * Get addresses by category
 */
export const getAddressesByCategory = (category: string): string[] => {
  return Object.entries(LabledAddress)
    .filter(([address, data]) => data.Category === category && isValidPiNetworkAddress(address))
    .map(([address]) => address);
};

/**
 * Get address data by address
 */
export const getAddressData = (address: string): AddressData | null => {
  return isValidPiNetworkAddress(address) ? LabledAddress[address] || null : null;
};

/**
 * Check if an address is labeled
 */
export const isLabeledAddress = (address: string): boolean => {
  return isValidPiNetworkAddress(address) && address in LabledAddress;
};

// ===== ECOSYSTEM FUNCTIONS =====

/**
 * Get all communities with error handling
 */
export const getAllCommunities = async (): Promise<CommunityData[]> => {
  try {
    const result = await fetchFromEndpoint<any>('/api/ecosystem?type=communities&socialStats=1', 'Communities');
    if (result.error) {
      console.warn('Failed to fetch communities:', result.error);
      return [];
    }

    return result.data.map(item => ({
      Name: extractField(item, ['name', 'Name'], 'Unknown Community'),
      Description: extractField(item, ['description', 'Description']),
      Category: extractField(item, ['category', 'Category'], 'General'),
      Members: extractField(item, ['members', 'Members']),
      Activity: extractField(item, ['activity', 'Activity']),
      Logo: extractField(item, ['logo', 'Logo']),
      Website: extractField(item, ['website', 'Website']),
      Region: extractField(item, ['region', 'Region'])
    }));
  } catch (error) {
    console.error('Error loading communities:', error);
    return [];
  }
};

/**
 * Get communities by category
 */
export const getCommunitiesByCategory = async (category: string): Promise<CommunityData[]> => {
  try {
    const result = await fetchFromEndpoint<any>(`/api/ecosystem?type=communities&category=${encodeURIComponent(category)}`, 'Communities');
    if (result.error) {
      console.warn(`Failed to fetch communities for category ${category}:`, result.error);
      return [];
    }

    return result.data.map(item => ({
      Name: extractField(item, ['name', 'Name'], 'Unknown Community'),
      Description: extractField(item, ['description', 'Description']),
      Category: extractField(item, ['category', 'Category'], category),
      Members: extractField(item, ['members', 'Members']),
      Activity: extractField(item, ['activity', 'Activity']),
      Logo: extractField(item, ['logo', 'Logo']),
      Website: extractField(item, ['website', 'Website']),
      Region: extractField(item, ['region', 'Region'])
    }));
  } catch (error) {
    console.error(`Error loading communities for category ${category}:`, error);
    return [];
  }
};

/**
 * Get all influencers with error handling
 */
export const getAllInfluencers = async (): Promise<InfluencerData[]> => {
  try {
    const result = await fetchFromEndpoint<any>('/api/ecosystem?type=influencers&socialStats=1', 'Influencers');
    if (result.error) {
      console.warn('Failed to fetch influencers:', result.error);
      return [];
    }

    return result.data.map(item => ({
      Name: extractField(item, ['name', 'Name'], 'Unknown Influencer'),
      Description: extractField(item, ['description', 'Description']),
      Platform: extractField(item, ['platform', 'Platform'], 'Unknown'),
      Followers: extractField(item, ['followers', 'Followers']),
      Engagement: extractField(item, ['engagement', 'Engagement']),
      Logo: extractField(item, ['logo', 'Logo']),
      Website: extractField(item, ['website', 'Website']),
      Region: extractField(item, ['region', 'Region']),
      Category: extractField(item, ['category', 'Category'])
    }));
  } catch (error) {
    console.error('Error loading influencers:', error);
    return [];
  }
};

/**
 * Get influencers by platform
 */
export const getInfluencersByPlatform = async (platform: string): Promise<InfluencerData[]> => {
  try {
    const result = await fetchFromEndpoint<any>(`/api/ecosystem?type=influencers&socialStats=1&platform=${encodeURIComponent(platform)}`, 'Influencers');
    if (result.error) {
      console.warn(`Failed to fetch influencers for platform ${platform}:`, result.error);
      return [];
    }

    return result.data.map(item => ({
      Name: extractField(item, ['name', 'Name'], 'Unknown Influencer'),
      Description: extractField(item, ['description', 'Description']),
      Platform: extractField(item, ['platform', 'Platform'], platform),
      Followers: extractField(item, ['followers', 'Followers']),
      Engagement: extractField(item, ['engagement', 'Engagement']),
      Logo: extractField(item, ['logo', 'Logo']),
      Website: extractField(item, ['website', 'Website']),
      Region: extractField(item, ['region', 'Region']),
      Category: extractField(item, ['category', 'Category'])
    }));
  } catch (error) {
    console.error(`Error loading influencers for platform ${platform}:`, error);
    return [];
  }
};

/**
 * Get influencers by category
 */
export const getInfluencersByCategory = async (category: string): Promise<InfluencerData[]> => {
  try {
    const result = await fetchFromEndpoint<any>(`/api/ecosystem?type=influencers&socialStats=1&category=${encodeURIComponent(category)}`, 'Influencers');
    if (result.error) {
      console.warn(`Failed to fetch influencers for category ${category}:`, result.error);
      return [];
    }

    return result.data.map(item => ({
      Name: extractField(item, ['name', 'Name'], 'Unknown Influencer'),
      Description: extractField(item, ['description', 'Description']),
      Platform: extractField(item, ['platform', 'Platform'], 'Unknown'),
      Followers: extractField(item, ['followers', 'Followers']),
      Engagement: extractField(item, ['engagement', 'Engagement']),
      Logo: extractField(item, ['logo', 'Logo']),
      Website: extractField(item, ['website', 'Website']),
      Region: extractField(item, ['region', 'Region']),
      Category: extractField(item, ['category', 'Category'], category)
    }));
  } catch (error) {
    console.error(`Error loading influencers for category ${category}:`, error);
    return [];
  }
};