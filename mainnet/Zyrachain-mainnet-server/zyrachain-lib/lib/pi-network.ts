import axios, { AxiosInstance } from 'axios';
import { serverPiConfig } from '../config/pi-config';
import { 
  PaymentDTO, 
  NetworkPassphrase, 
  Direction,
  PaymentArgs,
  TransactionData 
} from '../../types';
import { 
  PiPaymentError, 
  PiPaymentErrorCode 
} from '../../types/PiPaymentErrors';

// Server-side utility functions
export const createPlatformApiClient = (apiKey: string) => {
  const baseUrl = serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL + "/v2";
  const axiosClient = axios.create({
    baseURL: baseUrl,
    timeout: serverPiConfig.PI_BACKEND_HORIZON_TIMEOUT_MS,
    headers: { Authorization: `Key ${apiKey}`, "Content-Type": "application/json" },
  });

  return axiosClient;
};

export const isMainnet = (passphrase: NetworkPassphrase) => {
  return passphrase === serverPiConfig.PI_BACKEND_HORIZON_MAINNET_PASSPHRASE;
};

// Enhanced Pi Network Types
export interface PiUser {
  uid: string;
  username?: string;
  wallet_address?: string;
}

export interface PiAuthResult {
  accessToken: string;
  user: PiUser;
}

export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
}

export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: PaymentDTO) => void;
}

// Listing payment configurations (client-safe constants)
export const LISTING_PAYMENTS = {
  company: {
    amount: 100, // 100 Pi for companies
    memo: "Company listing fee for Zyrachain",
    type: "company" as const
  },
  business: {
    amount: 20, // 20 Pi for businesses
    memo: "Business listing fee for Zyrachain",
    type: "business" as const
  },
  startup: {
    amount: 50, // 50 Pi for startups
    memo: "Startup listing fee for Zyrachain",
    type: "startup" as const
  },
  community: {
    amount: 50, // 50 Pi for communities
    memo: "Community listing fee for Zyrachain",
    type: "community" as const
  },
  influencer: {
    amount: 50, // 50 Pi for influencers
    memo: "Influencer listing fee for Zyrachain",
    type: "influencer" as const
  },
  update: {
    amount: 80, // 80 Pi for updates
    memo: "Listing update fee for Zyrachain",
    type: "update" as const
  },
  oracle_api: {
    amount: 100,
    memo: "Oracle API key purchase for Zyrachain",
    type: "oracle_api" as const
  }
} as const;

export type ListingType = keyof typeof LISTING_PAYMENTS;

export class PiNetworkService {
  private piNetworkApi: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new PiPaymentError("missing_api_key");
    }
    this.apiKey = apiKey;
    this.piNetworkApi = createPlatformApiClient(apiKey);
  }

  // Authentication methods
  async verifyUserToken(accessToken: string): Promise<PiUser> {
    try {
      const response = await this.piNetworkApi.get("/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error verifying user token:", error);
      throw new PiPaymentError("unknown_error", {
        messageOverride: "Token verification failed"
      });
    }
  }

  // Payment methods - Following official Pi Network SDK pattern
  async getPayment(paymentId: string): Promise<any> {
    try {
      console.log(`🔍 Getting payment: ${paymentId}`);
      const response = await this.piNetworkApi.get(`/payments/${paymentId}`);
      console.log(`✅ Payment retrieved:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error getting payment ${paymentId}:`, error);
      
      if (error.response?.status === 404) {
        throw new PiPaymentError("payment_not_found", {
          messageOverride: `Payment ${paymentId} not found`,
          data: { paymentId }
        });
      }
      
      throw new PiPaymentError("unknown_error", {
        messageOverride: "Failed to get payment",
        data: { paymentId }
      });
    }
  }

  async createPayment(paymentData: any): Promise<any> {
    try {
      console.log(`🔄 Creating payment:`, paymentData);
      const response = await this.piNetworkApi.post(`/payments`, { payment: paymentData });
      console.log(`✅ Payment created:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error creating payment:`, error);
      
      if (error.response) {
        const { status, data } = error.response;
        console.error(`API Error - Status: ${status}, Data:`, data);
        
        if (status === 400) {
          throw new PiPaymentError("invalid_arguments", {
            messageOverride: `Invalid payment request: ${data?.error_message || 'Bad request'}`
          });
        } else if (status === 401) {
          throw new PiPaymentError("missing_api_key", {
            messageOverride: "Invalid API key or authentication failed"
          });
        }
      }
      
      throw new PiPaymentError("unknown_error", {
        messageOverride: "Payment creation failed"
      });
    }
  }

  // Note: The official Pi Network SDK doesn't have an approvePayment method
  // The flow is: createPayment -> submitPayment -> completePayment
  // For server-side applications, we typically only need to complete payments
  // that were created and submitted by the frontend

  async approvePayment(paymentId: string): Promise<void> {
    try {
      console.log(`✅ Approving payment: ${paymentId}`);
      await this.piNetworkApi.post(`/payments/${paymentId}/approve`);
      console.log(`Payment ${paymentId} approved successfully.`);
    } catch (error: any) {
      console.error(`Error approving payment ${paymentId}:`, error?.response?.data || error);
      if (error?.response?.data?.error === 'already_approved') {
        console.log(`Payment ${paymentId} already approved — continuing`);
        return;
      }
      throw new PiPaymentError("unknown_error", {
        messageOverride: "Payment approval failed",
        data: { paymentId }
      });
    }
  }

  async completePayment(paymentId: string, txid: string): Promise<void> {
    try {
      await this.piNetworkApi.post(`/payments/${paymentId}/complete`, {
        txid: txid
      });
      console.log(`Payment ${paymentId} completed successfully with txid: ${txid}.`);
    } catch (error: any) {
      console.error(`Error completing payment ${paymentId}:`, error);
      throw new PiPaymentError("unknown_error", {
        messageOverride: "Payment completion failed",
        data: { paymentId, txid }
      });
    }
  }

  async cancelPayment(paymentId: string): Promise<void> {
    try {
      await this.piNetworkApi.post(`/payments/${paymentId}/cancel`);
      console.log(`Payment ${paymentId} cancelled successfully.`);
    } catch (error: any) {
      console.error(`Error cancelling payment ${paymentId}:`, error);
      
      // Handle specific Pi Network API errors
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        if (errorData?.error === 'forbidden' && 
            errorData?.error_message?.includes('app-to-user payments')) {
          console.log(`⚠️ Payment ${paymentId} cannot be cancelled by server (user-to-app payment)`);
          // Don't throw error - this is expected behavior
          return;
        }
      }
      
      // For other errors, still throw
      throw new PiPaymentError("unknown_error", {
        messageOverride: "Payment cancellation failed",
        data: { paymentId }
      });
    }
  }

  async getIncompleteServerPayments(): Promise<any[]> {
    try {
      const response = await this.piNetworkApi.get(`/payments/incomplete_server_payments`);
      return response.data?.incomplete_server_payments || [];
    } catch (error: any) {
      console.error(`❌ Error getting incomplete server payments:`, error?.response?.data || error);
      throw new PiPaymentError("unknown_error", {
        messageOverride: "Failed to get incomplete server payments"
      });
    }
  }

  // Get listing payment configuration
  getListingPayment(
    type: ListingType,
    userId: string,
    listingData: Record<string, any>
  ): PiPaymentData {
    const basePayment = LISTING_PAYMENTS[type];
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

// Singleton instance
let piNetworkServiceInstance: PiNetworkService | null = null;

export function getPiNetworkService(): PiNetworkService {
  if (!piNetworkServiceInstance) {
    // Try multiple environment variable names for API key
    const apiKey = process.env.PI_NETWORK_API_KEY || 
                   process.env.PI_API_KEY || 
                   serverPiConfig.PI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Missing Pi Network API key. Please set PI_NETWORK_API_KEY or PI_API_KEY environment variable.');
      throw new PiPaymentError("missing_api_key", {
        messageOverride: "Pi Network API key is not configured"
      });
    }
    
    console.log('✅ Using Pi Network API key:', apiKey.substring(0, 8) + '...');
    console.log('🌐 Pi Network Environment:', serverPiConfig.PI_ENV);
    const piApiBase = serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL;
    console.log('🔗 Pi Network API Base URL:', `${piApiBase}/v2`);
    piNetworkServiceInstance = new PiNetworkService(apiKey);
  }
  return piNetworkServiceInstance;
}

// Export server config for server-side usage
export { serverPiConfig } from '../config/pi-config'; 