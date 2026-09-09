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
export declare class AdminApiClient {
    private client;
    private token;
    constructor(config: AdminApiConfig);
    authenticate(email: string, role: string, otp?: string): Promise<AdminAuthResponse>;
    checkAuth(): Promise<AdminAuthResponse>;
    logout(): void;
    getUsers(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getListings(): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    reviewListing(listingId: string, action: 'approve' | 'reject', reviewNotes?: string): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getAnalytics(period?: '24h' | '7d' | '30d'): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getCombinedCommunities(params?: {
        status?: string;
        limit?: number;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getCombinedInfluencers(params?: {
        status?: string;
        limit?: number;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getProtectedData(type?: string): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getGeneratedAddresses(): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    createGeneratedAddress(data: {
        identifier: string;
        Name: string;
        Category?: string;
        Description?: string;
        Logo?: string;
        Rank?: number;
        Website?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    updateGeneratedAddress(id: string, data: {
        identifier: string;
        Name: string;
        Category?: string;
        Description?: string;
        Logo?: string;
        Rank?: number;
        Website?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    deleteGeneratedAddress(id: string): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getCexAddresses(): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    createCexAddress(data: {
        identifier: string;
        name: string;
        category?: string;
        description?: string;
        logo?: string;
        buy?: string;
        website?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    updateCexAddress(id: string, data: {
        identifier: string;
        name: string;
        category?: string;
        description?: string;
        logo?: string;
        buy?: string;
        website?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    deleteCexAddress(id: string): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getCoreTeamAddresses(): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    createCoreTeamAddress(data: {
        identifier: string;
        name: string;
        description?: string;
        role?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    updateCoreTeamAddress(id: string, data: {
        identifier: string;
        name: string;
        description?: string;
        role?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    deleteCoreTeamAddress(id: string): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getBusinessListings(params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getStartupListings(params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getCommunityListings(params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getInfluencerListings(params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getEcosystemEvents(params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getEcosystemHackathons(params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    getEcosystemCommunities(params?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    uploadFile(file: File, type?: 'image' | 'document'): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
    checkHealth(): Promise<ApiResponse<any> | {
        success: boolean;
        error: any;
    }>;
}
export declare function createAdminApiClient(baseURL: string): AdminApiClient;
export declare const DEFAULT_ADMIN_API_CONFIG: AdminApiConfig;
export declare const PRODUCTION_ADMIN_API_CONFIG: AdminApiConfig;
//# sourceMappingURL=admin-api-client.d.ts.map