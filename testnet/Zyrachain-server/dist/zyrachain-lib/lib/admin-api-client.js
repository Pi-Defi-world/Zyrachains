"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRODUCTION_ADMIN_API_CONFIG = exports.DEFAULT_ADMIN_API_CONFIG = exports.AdminApiClient = void 0;
exports.createAdminApiClient = createAdminApiClient;
const axios_1 = __importDefault(require("axios"));
class AdminApiClient {
    constructor(config) {
        this.token = null;
        this.client = axios_1.default.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                ...config.headers,
            },
        });
        this.client.interceptors.request.use((config) => {
            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                this.token = null;
            }
            return Promise.reject(error);
        });
    }
    async authenticate(email, role, otp) {
        try {
            const response = await this.client.post('/api/admin/auth', {
                email,
                role,
                otp
            });
            if (response.data.success && response.data.token) {
                this.token = response.data.token;
            }
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Authentication failed'
            };
        }
    }
    async checkAuth() {
        try {
            const response = await this.client.get('/api/admin/auth/check');
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Authentication check failed'
            };
        }
    }
    logout() {
        this.token = null;
    }
    async getUsers(params) {
        try {
            const response = await this.client.get('/api/admin/users', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch users'
            };
        }
    }
    async getListings() {
        try {
            const response = await this.client.get('/api/admin/listings');
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch listings'
            };
        }
    }
    async reviewListing(listingId, action, reviewNotes) {
        try {
            const response = await this.client.post(`/api/admin/listings/${listingId}`, {
                action,
                reviewNotes
            });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to review listing'
            };
        }
    }
    async getAnalytics(period = '7d') {
        try {
            const response = await this.client.get('/api/admin/analytics', {
                params: { period }
            });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch analytics'
            };
        }
    }
    async getCombinedCommunities(params) {
        try {
            const response = await this.client.get('/api/admin/communities/combined', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch communities'
            };
        }
    }
    async getCombinedInfluencers(params) {
        try {
            const response = await this.client.get('/api/admin/influencers/combined', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch influencers'
            };
        }
    }
    async getProtectedData(type) {
        try {
            const response = await this.client.get('/api/admin/protected-data', {
                params: { type }
            });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch protected data'
            };
        }
    }
    async getGeneratedAddresses() {
        try {
            const response = await this.client.get('/api/admin/addresses/generated');
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch generated addresses'
            };
        }
    }
    async createGeneratedAddress(data) {
        try {
            const response = await this.client.post('/api/admin/addresses/generated', data);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create generated address'
            };
        }
    }
    async updateGeneratedAddress(id, data) {
        try {
            const response = await this.client.put(`/api/admin/addresses/generated/${id}`, data);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update generated address'
            };
        }
    }
    async deleteGeneratedAddress(id) {
        try {
            const response = await this.client.delete(`/api/admin/addresses/generated/${id}`);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete generated address'
            };
        }
    }
    async getCexAddresses() {
        try {
            const response = await this.client.get('/api/admin/addresses/cex');
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch CEX addresses'
            };
        }
    }
    async createCexAddress(data) {
        try {
            const response = await this.client.post('/api/admin/addresses/cex', data);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create CEX address'
            };
        }
    }
    async updateCexAddress(id, data) {
        try {
            const response = await this.client.put(`/api/admin/addresses/cex/${id}`, data);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update CEX address'
            };
        }
    }
    async deleteCexAddress(id) {
        try {
            const response = await this.client.delete(`/api/admin/addresses/cex/${id}`);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete CEX address'
            };
        }
    }
    async getCoreTeamAddresses() {
        try {
            const response = await this.client.get('/api/admin/addresses/core-team');
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch core team addresses'
            };
        }
    }
    async createCoreTeamAddress(data) {
        try {
            const response = await this.client.post('/api/admin/addresses/core-team', data);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to create core team address'
            };
        }
    }
    async updateCoreTeamAddress(id, data) {
        try {
            const response = await this.client.put(`/api/admin/addresses/core-team/${id}`, data);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to update core team address'
            };
        }
    }
    async deleteCoreTeamAddress(id) {
        try {
            const response = await this.client.delete(`/api/admin/addresses/core-team/${id}`);
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to delete core team address'
            };
        }
    }
    async getBusinessListings(params) {
        try {
            const response = await this.client.get('/api/listings/business', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch business listings'
            };
        }
    }
    async getStartupListings(params) {
        try {
            const response = await this.client.get('/api/listings/startup', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch startup listings'
            };
        }
    }
    async getCommunityListings(params) {
        try {
            const response = await this.client.get('/api/listings/community', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch community listings'
            };
        }
    }
    async getInfluencerListings(params) {
        try {
            const response = await this.client.get('/api/listings/influencer', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch influencer listings'
            };
        }
    }
    async getEcosystemEvents(params) {
        try {
            const response = await this.client.get('/api/ecosystem/events', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch ecosystem events'
            };
        }
    }
    async getEcosystemHackathons(params) {
        try {
            const response = await this.client.get('/api/ecosystem/hackathons', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch ecosystem hackathons'
            };
        }
    }
    async getEcosystemCommunities(params) {
        try {
            const response = await this.client.get('/api/ecosystem/communities', { params });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to fetch ecosystem communities'
            };
        }
    }
    async uploadFile(file, type = 'image') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            const response = await this.client.post('/api/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to upload file'
            };
        }
    }
    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        }
        catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to check server health'
            };
        }
    }
}
exports.AdminApiClient = AdminApiClient;
function createAdminApiClient(baseURL) {
    return new AdminApiClient({
        baseURL,
        timeout: 30000,
        headers: {
            'X-Client': 'admin-app',
        },
    });
}
exports.DEFAULT_ADMIN_API_CONFIG = {
    baseURL: process.env.ADMIN_API_BASE_URL || 'http://localhost:4111',
    timeout: 30000,
    headers: {
        'X-Client': 'admin-app',
    },
};
exports.PRODUCTION_ADMIN_API_CONFIG = {
    baseURL: process.env.ADMIN_API_BASE_URL || 'https://your-domain.com',
    timeout: 30000,
    headers: {
        'X-Client': 'admin-app',
    },
};
//# sourceMappingURL=admin-api-client.js.map