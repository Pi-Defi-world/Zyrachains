"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverPiConfig = exports.PiNetworkService = exports.LISTING_PAYMENTS = exports.isMainnet = exports.createPlatformApiClient = void 0;
exports.getPiNetworkService = getPiNetworkService;
const axios_1 = __importDefault(require("axios"));
const pi_config_1 = require("../config/pi-config");
const PiPaymentErrors_1 = require("../../types/PiPaymentErrors");
const createPlatformApiClient = (apiKey) => {
    const baseUrl = pi_config_1.serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL + "/v2";
    const axiosClient = axios_1.default.create({
        baseURL: baseUrl,
        timeout: pi_config_1.serverPiConfig.PI_BACKEND_HORIZON_TIMEOUT_MS,
        headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
    });
    return axiosClient;
};
exports.createPlatformApiClient = createPlatformApiClient;
const isMainnet = (passphrase) => {
    return passphrase === pi_config_1.serverPiConfig.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE;
};
exports.isMainnet = isMainnet;
exports.LISTING_PAYMENTS = {
    company: {
        amount: 100,
        memo: "Company listing fee for Zyrachain",
        type: "company"
    },
    business: {
        amount: 20,
        memo: "Business listing fee for Zyrachain",
        type: "business"
    },
    startup: {
        amount: 50,
        memo: "Startup listing fee for Zyrachain",
        type: "startup"
    },
    community: {
        amount: 50,
        memo: "Community listing fee for Zyrachain",
        type: "community"
    },
    influencer: {
        amount: 50,
        memo: "Influencer listing fee for Zyrachain",
        type: "influencer"
    },
    update: {
        amount: 80,
        memo: "Listing update fee for Zyrachain",
        type: "update"
    },
    oracle_api: {
        amount: 100,
        memo: "Oracle API key purchase for Zyrachain",
        type: "oracle_api"
    }
};
class PiNetworkService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new PiPaymentErrors_1.PiPaymentError("missing_api_key");
        }
        this.apiKey = apiKey;
        this.piNetworkApi = (0, exports.createPlatformApiClient)(apiKey);
    }
    async verifyUserToken(accessToken) {
        try {
            const response = await this.piNetworkApi.get("/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error("Error verifying user token:", error);
            throw new PiPaymentErrors_1.PiPaymentError("unknown_error", {
                messageOverride: "Token verification failed"
            });
        }
    }
    async getPayment(paymentId) {
        try {
            console.log(`🔍 Getting payment: ${paymentId}`);
            const response = await this.piNetworkApi.get(`/payments/${paymentId}`);
            console.log(`✅ Payment retrieved:`, response.data);
            return response.data;
        }
        catch (error) {
            console.error(`❌ Error getting payment ${paymentId}:`, error);
            if (error.response?.status === 404) {
                throw new PiPaymentErrors_1.PiPaymentError("payment_not_found", {
                    messageOverride: `Payment ${paymentId} not found`,
                    data: { paymentId }
                });
            }
            throw new PiPaymentErrors_1.PiPaymentError("unknown_error", {
                messageOverride: "Failed to get payment",
                data: { paymentId }
            });
        }
    }
    async createPayment(paymentData) {
        try {
            console.log(`🔄 Creating payment:`, paymentData);
            const response = await this.piNetworkApi.post(`/payments`, { payment: paymentData });
            console.log(`✅ Payment created:`, response.data);
            return response.data;
        }
        catch (error) {
            console.error(`❌ Error creating payment:`, error);
            if (error.response) {
                const { status, data } = error.response;
                console.error(`API Error - Status: ${status}, Data:`, data);
                if (status === 400) {
                    throw new PiPaymentErrors_1.PiPaymentError("invalid_arguments", {
                        messageOverride: `Invalid payment request: ${data?.error_message || 'Bad request'}`
                    });
                }
                else if (status === 401) {
                    throw new PiPaymentErrors_1.PiPaymentError("missing_api_key", {
                        messageOverride: "Invalid API key or authentication failed"
                    });
                }
            }
            throw new PiPaymentErrors_1.PiPaymentError("unknown_error", {
                messageOverride: "Payment creation failed"
            });
        }
    }
    async approvePayment(paymentId) {
        try {
            console.log(`✅ Approving payment: ${paymentId}`);
            await this.piNetworkApi.post(`/payments/${paymentId}/approve`);
            console.log(`Payment ${paymentId} approved successfully.`);
        }
        catch (error) {
            console.error(`Error approving payment ${paymentId}:`, error?.response?.data || error);
            if (error?.response?.data?.error === 'already_approved') {
                console.log(`Payment ${paymentId} already approved — continuing`);
                return;
            }
            throw new PiPaymentErrors_1.PiPaymentError("unknown_error", {
                messageOverride: "Payment approval failed",
                data: { paymentId }
            });
        }
    }
    async completePayment(paymentId, txid) {
        try {
            await this.piNetworkApi.post(`/payments/${paymentId}/complete`, {
                txid: txid
            });
            console.log(`Payment ${paymentId} completed successfully with txid: ${txid}.`);
        }
        catch (error) {
            console.error(`Error completing payment ${paymentId}:`, error);
            throw new PiPaymentErrors_1.PiPaymentError("unknown_error", {
                messageOverride: "Payment completion failed",
                data: { paymentId, txid }
            });
        }
    }
    async cancelPayment(paymentId) {
        try {
            await this.piNetworkApi.post(`/payments/${paymentId}/cancel`);
            console.log(`Payment ${paymentId} cancelled successfully.`);
        }
        catch (error) {
            console.error(`Error cancelling payment ${paymentId}:`, error);
            if (error.response?.status === 403) {
                const errorData = error.response.data;
                if (errorData?.error === 'forbidden' &&
                    errorData?.error_message?.includes('app-to-user payments')) {
                    console.log(`⚠️ Payment ${paymentId} cannot be cancelled by server (user-to-app payment)`);
                    return;
                }
            }
            throw new PiPaymentErrors_1.PiPaymentError("unknown_error", {
                messageOverride: "Payment cancellation failed",
                data: { paymentId }
            });
        }
    }
    async getIncompleteServerPayments() {
        try {
            const response = await this.piNetworkApi.get(`/payments/incomplete_server_payments`);
            return response.data?.incomplete_server_payments || [];
        }
        catch (error) {
            console.error(`❌ Error getting incomplete server payments:`, error?.response?.data || error);
            throw new PiPaymentErrors_1.PiPaymentError("unknown_error", {
                messageOverride: "Failed to get incomplete server payments"
            });
        }
    }
    getListingPayment(type, userId, listingData) {
        const basePayment = exports.LISTING_PAYMENTS[type];
        return {
            amount: basePayment.amount,
            memo: basePayment.memo,
            metadata: {
                listingType: basePayment.type,
                userId,
                listingData,
                timestamp: new Date().toISOString()
            }
        };
    }
}
exports.PiNetworkService = PiNetworkService;
let piNetworkServiceInstance = null;
function getPiNetworkService() {
    if (!piNetworkServiceInstance) {
        const apiKey = process.env.PI_NETWORK_API_KEY ||
            process.env.PI_API_KEY ||
            pi_config_1.serverPiConfig.PI_API_KEY;
        if (!apiKey) {
            console.error('❌ Missing Pi Network API key. Please set PI_NETWORK_API_KEY or PI_API_KEY environment variable.');
            throw new PiPaymentErrors_1.PiPaymentError("missing_api_key", {
                messageOverride: "Pi Network API key is not configured"
            });
        }
        console.log('✅ Using Pi Network API key:', apiKey.substring(0, 8) + '...');
        console.log('🌐 Pi Network Environment:', pi_config_1.serverPiConfig.PI_ENV);
        const piApiBase = pi_config_1.serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL;
        console.log('🔗 Pi Network API Base URL:', `${piApiBase}/v2`);
        piNetworkServiceInstance = new PiNetworkService(apiKey);
    }
    return piNetworkServiceInstance;
}
var pi_config_2 = require("../config/pi-config");
Object.defineProperty(exports, "serverPiConfig", { enumerable: true, get: function () { return pi_config_2.serverPiConfig; } });
//# sourceMappingURL=pi-network.js.map