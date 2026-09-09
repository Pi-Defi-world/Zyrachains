import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ============================================================================
// ADMIN API CLIENT CONFIGURATION FOR EXISTING ROUTES
// ============================================================================

export interface AdminApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name?: string;
    username?: string;
    email: string;
    role: string;
    permissions: string[];
  };
  message?: string;
  requiresOTP?: boolean;
}

export class AdminApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config: AdminApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.token = null;
          // You can trigger a re-authentication here
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // AUTHENTICATION METHODS (using existing admin routes)
  // ============================================================================

  /**
   * Authenticate admin user with email and OTP
   */
  async authenticate(email: string, role: string, otp?: string): Promise<AdminAuthResponse> {
    try {
      const response: AxiosResponse<AdminAuthResponse> = await this.client.post('/api/admin/auth', {
        email,
        role,
        otp
      });

      if (response.data.success && response.data.token) {
        this.token = response.data.token;
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Authentication failed'
      };
    }
  }

  /**
   * Check if current token is valid
   */
  async checkAuth(): Promise<AdminAuthResponse> {
    try {
      const response: AxiosResponse<AdminAuthResponse> = await this.client.get('/api/admin/auth/check');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Authentication check failed'
      };
    }
  }

  /**
   * Logout (clear token)
   */
  logout(): void {
    this.token = null;
  }

  // ============================================================================
  // EXISTING ADMIN ROUTES INTEGRATION
  // ============================================================================

  /**
   * Get Users (from existing admin route)
   */
  async getUsers(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/users', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch users'
      };
    }
  }

  /**
   * Get all listings for review (from existing admin route)
   */
  async getListings() {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/listings');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch listings'
      };
    }
  }

  /**
   * Approve or reject a listing (from existing admin route)
   */
  async reviewListing(listingId: string, action: 'approve' | 'reject', reviewNotes?: string) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.post(`/api/admin/listings/${listingId}`, {
        action,
        reviewNotes
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to review listing'
      };
    }
  }

  /**
   * Get analytics (from existing admin route)
   */
  async getAnalytics(period: '24h' | '7d' | '30d' = '7d') {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/analytics', {
        params: { period }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch analytics'
      };
    }
  }

  /**
   * Get combined communities (from existing admin route)
   */
  async getCombinedCommunities(params?: { status?: string; limit?: number }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/communities/combined', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch communities'
      };
    }
  }

  /**
   * Get combined influencers (from existing admin route)
   */
  async getCombinedInfluencers(params?: { status?: string; limit?: number }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/influencers/combined', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch influencers'
      };
    }
  }

  /**
   * Get protected data (from existing admin route)
   */
  async getProtectedData(type?: string) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/protected-data', {
        params: { type }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch protected data'
      };
    }
  }

  // ============================================================================
  // ADDRESS MANAGEMENT (from existing admin routes)
  // ============================================================================

  /**
   * Get generated addresses
   */
  async getGeneratedAddresses() {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/addresses/generated');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch generated addresses'
      };
    }
  }

  /**
   * Create generated address
   */
  async createGeneratedAddress(data: {
    identifier: string;
    Name: string;
    Category?: string;
    Description?: string;
    Logo?: string;
    Rank?: number;
    Website?: string;
  }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.post('/api/admin/addresses/generated', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create generated address'
      };
    }
  }

  /**
   * Update generated address
   */
  async updateGeneratedAddress(id: string, data: {
    identifier: string;
    Name: string;
    Category?: string;
    Description?: string;
    Logo?: string;
    Rank?: number;
    Website?: string;
  }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.put(`/api/admin/addresses/generated/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update generated address'
      };
    }
  }

  /**
   * Delete generated address
   */
  async deleteGeneratedAddress(id: string) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.delete(`/api/admin/addresses/generated/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete generated address'
      };
    }
  }

  /**
   * Get CEX addresses
   */
  async getCexAddresses() {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/addresses/cex');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch CEX addresses'
      };
    }
  }

  /**
   * Create CEX address
   */
  async createCexAddress(data: {
    identifier: string;
    name: string;
    category?: string;
    description?: string;
    logo?: string;
    buy?: string;
    website?: string;
  }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.post('/api/admin/addresses/cex', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create CEX address'
      };
    }
  }

  /**
   * Update CEX address
   */
  async updateCexAddress(id: string, data: {
    identifier: string;
    name: string;
    category?: string;
    description?: string;
    logo?: string;
    buy?: string;
    website?: string;
  }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.put(`/api/admin/addresses/cex/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update CEX address'
      };
    }
  }

  /**
   * Delete CEX address
   */
  async deleteCexAddress(id: string) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.delete(`/api/admin/addresses/cex/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete CEX address'
      };
    }
  }

  /**
   * Get core team addresses
   */
  async getCoreTeamAddresses() {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/admin/addresses/core-team');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch core team addresses'
      };
    }
  }

  /**
   * Create core team address
   */
  async createCoreTeamAddress(data: {
    identifier: string;
    name: string;
    description?: string;
    role?: string;
  }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.post('/api/admin/addresses/core-team', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create core team address'
      };
    }
  }

  /**
   * Update core team address
   */
  async updateCoreTeamAddress(id: string, data: {
    identifier: string;
    name: string;
    description?: string;
    role?: string;
  }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.put(`/api/admin/addresses/core-team/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update core team address'
      };
    }
  }

  /**
   * Delete core team address
   */
  async deleteCoreTeamAddress(id: string) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.delete(`/api/admin/addresses/core-team/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete core team address'
      };
    }
  }

  // ============================================================================
  // LISTINGS MANAGEMENT (using existing listings routes)
  // ============================================================================

  /**
   * Get business listings
   */
  async getBusinessListings(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/listings/business', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch business listings'
      };
    }
  }

  /**
   * Get startup listings
   */
  async getStartupListings(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/listings/startup', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch startup listings'
      };
    }
  }

  /**
   * Get community listings
   */
  async getCommunityListings(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/listings/community', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch community listings'
      };
    }
  }

  /**
   * Get influencer listings
   */
  async getInfluencerListings(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/listings/influencer', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch influencer listings'
      };
    }
  }

  // ============================================================================
  // ECOSYSTEM MANAGEMENT (using existing ecosystem routes)
  // ============================================================================

  /**
   * Get ecosystem events
   */
  async getEcosystemEvents(params?: { page?: number; limit?: number; status?: string }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/ecosystem/events', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch ecosystem events'
      };
    }
  }

  /**
   * Get ecosystem hackathons
   */
  async getEcosystemHackathons(params?: { page?: number; limit?: number; status?: string }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/ecosystem/hackathons', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch ecosystem hackathons'
      };
    }
  }

  /**
   * Get ecosystem communities
   */
  async getEcosystemCommunities(params?: { page?: number; limit?: number; status?: string }) {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/api/ecosystem/communities', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch ecosystem communities'
      };
    }
  }

  // ============================================================================
  // FILE UPLOAD
  // ============================================================================

  /**
   * Upload file
   */
  async uploadFile(file: File, type: 'image' | 'document' = 'image') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response: AxiosResponse<ApiResponse> = await this.client.post(
        '/api/upload/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to upload file'
      };
    }
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Check server health
   */
  async checkHealth() {
    try {
      const response: AxiosResponse<ApiResponse> = await this.client.get('/health');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to check server health'
      };
    }
  }
}

// ============================================================================
// USAGE EXAMPLES AND CONFIGURATION
// ============================================================================

/**
 * Create and configure admin API client
 */
export function createAdminApiClient(baseURL: string): AdminApiClient {
  return new AdminApiClient({
    baseURL,
    timeout: 30000,
    headers: {
      'X-Client': 'admin-app',
    },
  });
}

/**
 * Default configuration for development
 */
export const DEFAULT_ADMIN_API_CONFIG: AdminApiConfig = {
  baseURL: process.env.ADMIN_API_BASE_URL || 'http://localhost:4111',
  timeout: 30000,
  headers: {
    'X-Client': 'admin-app',
  },
};

/**
 * Production configuration
 */
export const PRODUCTION_ADMIN_API_CONFIG: AdminApiConfig = {
  baseURL: process.env.ADMIN_API_BASE_URL || 'https://your-domain.com',
  timeout: 30000,
  headers: {
    'X-Client': 'admin-app',
  },
}; 