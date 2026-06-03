/**
 * API Client for Express Server
 */

function resolveApiBaseUrl(): string {
  // In the browser, prefer same-origin Next.js route handlers as a proxy layer.
  if (typeof window !== 'undefined') {
    return '';
  }
  const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();
  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, '');
  }
  return `http://${raw.replace(/\/$/, '')}`;
}

const BASE_URL = resolveApiBaseUrl();

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  listings?: any[];
  socialStats?: boolean;
  posts?: T[];
  events?: any[];
  hackathons?: any[];
  communities?: any[];
  influencers?: any[];
  total?: number;
  limit?: number;
  offset?: number;
}

export class ApiClient {
  submitContact: any;
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Ecosystem API endpoints (communities/influencers request live TG/X counts when server tokens are set)
  async getEcosystemData(type?: 'events' | 'hackathons' | 'communities' | 'influencers'): Promise<ApiResponse> {
    const social =
      type === 'communities' || type === 'influencers' ? '&socialStats=1' : '';
    const endpoint = type ? `/api/ecosystem?type=${type}${social}` : '/api/ecosystem';
    return this.request(endpoint);
  }


  // Add these specific methods
  async getCexAddresses(): Promise<ApiResponse> {
    return this.request('/api/addresses/cex');
  }

  async getCoreTeamAddresses(): Promise<ApiResponse> {
    return this.request('/api/addresses/core-team');
  }

  async getGeneratedAddresses(): Promise<ApiResponse> {
    return this.request('/api/addresses/generated');
  }

  async getCommunities(): Promise<ApiResponse> {
    return this.request('/api/ecosystem?type=communities&socialStats=1');
  }

  async getInfluencers(): Promise<ApiResponse> {
    return this.request('/api/ecosystem?type=influencers&socialStats=1');
  }

  /** Paid MongoDB influencer listings with live X metrics when server tokens are set (`?socialStats=1`). */
  async getInfluencerDirectoryListings(): Promise<ApiResponse> {
    return this.request('/api/listings/influencer?socialStats=1');
  }

  /** Paid MongoDB community listings with live Telegram metrics when server tokens are set (`?socialStats=1`). */
  async getCommunityDirectoryListings(): Promise<ApiResponse> {
    return this.request('/api/listings/community?socialStats=1');
  }

  // Events API endpoints
  async getEvents(params?: {
    limit?: number;
    status?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/ecosystem?type=events${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Hackathons API endpoints
  async getHackathons(params?: {
    limit?: number;
    status?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/ecosystem?type=hackathons${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  // Listings API endpoints
  async getListings(type: string, params?: {
    limit?: number;
    page?: number;
    category?: string;
    region?: string;
    search?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams({ type });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/listings?${searchParams.toString()}`;
    return this.request(endpoint);
  }

  // Contact form submission
  // async submitContact(data: {
  //   name: string;
  //   email: string;
  //   subject: string;
  //   message: string;
  // }): Promise<ApiResponse> {
  //   return this.request('/api/contact', {
  //     method: 'POST',
  //     body: JSON.stringify(data),
  //   });
  // }

  // Listing submission methods - aligned with backend routes
  async submitBusinessListing(data: any): Promise<ApiResponse> {
    return this.request('/api/listings/business', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitStartupListing(data: any): Promise<ApiResponse> {
    return this.request('/api/listings/startup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitCommunityListing(data: any): Promise<ApiResponse> {
    return this.request('/api/listings/community', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitInfluencerListing(data: any): Promise<ApiResponse> {
    return this.request('/api/listings/influencer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitProjectListing(data: any): Promise<ApiResponse> {
    return this.request('/api/listings/project', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitUpdateListing(data: any): Promise<ApiResponse> {
    return this.request('/api/listings/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Pi Network payment configuration
  async getPaymentConfig(listingType: string): Promise<ApiResponse> {
    return this.request(`/api/pi/payments/config/${listingType}`);
  }

  // Pi Network authentication
  async verifyPiToken(accessToken: string): Promise<ApiResponse> {
    return this.request('/api/pi/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
  }

  // Scam report submission
  async submitScamReport(data: any): Promise<ApiResponse> {
    return this.request('/api/report-scam', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Address distribution
  async getAddressDistribution(): Promise<ApiResponse> {
    return this.request('/api/addresses/distribution');
  }

  // Top accounts
  async getTopAccounts(page: number): Promise<ApiResponse> {
    return this.request(`/api/addresses/top-accounts?page=${page}`);
  }

  // Health check
  async getHealth(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // ---- Chart data endpoints ----

  /** Price history (OHLC) for TradingView charts */
  async getPriceHistory(range: '1d' | '7d' | '30d' | '90d' = '7d'): Promise<ApiResponse> {
    return this.request(`/api/charts/price-history?range=${range}`);
  }

  /** Balance history for a specific wallet address */
  async getBalanceHistory(address: string): Promise<ApiResponse> {
    return this.request(`/api/pct-monitor/balance-history/${address}`);
  }

  /** Aggregate balance history for CEX wallets */
  async getCexAggregateBalanceHistory(range: '1d' | '7d' | '30d' = '7d'): Promise<ApiResponse> {
    return this.request(`/api/cex-monitor/aggregate-balance-history?range=${range}`);
  }

  /** Aggregate balance history for core team wallets */
  async getPctAggregateBalanceHistory(range: '1d' | '7d' | '30d' = '7d'): Promise<ApiResponse> {
    return this.request(`/api/pct-monitor/aggregate-balance-history?range=${range}`);
  }

  // ---- Community follower endpoints ----

  /** Follower history time-series for a specific X handle */
  async getCommunityFollowerHistory(handle: string, range: '1d' | '7d' | '30d' | '90d' = '7d'): Promise<ApiResponse> {
    return this.request(`/api/community-followers/history?handle=${encodeURIComponent(handle)}&range=${range}`);
  }

  /** Current stats + growth metrics for a specific X handle */
  async getCommunityFollowerStats(handle: string): Promise<ApiResponse> {
    return this.request(`/api/community-followers/stats?handle=${encodeURIComponent(handle)}`);
  }

  /** Overview of all tracked communities with live follower counts and growth */
  async getCommunityOverview(): Promise<ApiResponse> {
    return this.request('/api/community-followers/overview');
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();

export default apiClient;

export async function getProjectByWallet(walletAddress: string) {
  // Replace the URL below with your actual API endpoint for fetching a project by wallet address
  const res = await fetch(`/api/projects?wallet=${encodeURIComponent(walletAddress)}`);
  if (!res.ok) return null;
  return res.json();
}
