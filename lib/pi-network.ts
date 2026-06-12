// Pi Network Backend Service - Following Official Pi Network SDK Guidelines
import { 
  PaymentDTO, 
} from '../types/index';
// import { 
//   PiPaymentError, 
//   PiPaymentErrorCode 
// } from '../types/PiPaymentErrors';
// import { getClientConfig } from '../types/utils';

// Enhanced Pi Network Types (client-safe)
export interface PiUser {
  uid: string;
  username?: string;
  wallet_address?: string;
  authenticated_at?: Date;
  role?: string;
  _id?: string;
  // Additional Pi Network data
  app_id?: string;
  credentials?: {
    scopes: string[];
    valid_until: {
      timestamp: number;
      iso8601: string;
    };
  };
  receiving_email?: boolean;
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

// Listing payment configurations - aligned with backend pricing
export const LISTING_PAYMENTS = {
  company: {
    amount: 100, // 100 Pi for companies
    memo: "Company listing fee for Zyrachain",
    type: "company" as const
  },
  business: {
    amount: 20, // 20 Pi for businesses (updated from backend analysis)
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
  },
  topup_credits: {
    amount: 10,
    memo: "API credit top-up for Zyrachain Oracle",
    type: "topup_credits" as const
  }
} as const;

export type ListingType = keyof typeof LISTING_PAYMENTS;

// Client-side helper functions
export function getListingPaymentConfig(type: ListingType) {
  return LISTING_PAYMENTS[type];
}

export function createPaymentMetadata(
  listingType: ListingType,
  userId: string,
  listingData: Record<string, any>
) {
  return {
    listingType,
    userId,
    listingData,
    timestamp: new Date().toISOString()
  };
}

// Client-side payment data builder
export function buildPaymentData(
    type: ListingType,
    userId: string,
    listingData: Record<string, any>
  ): PiPaymentData {
    const basePayment = LISTING_PAYMENTS[type];
    return {
      amount: basePayment.amount,
      memo: basePayment.memo,
    metadata: createPaymentMetadata(type, userId, listingData)
  };
}

// Server-side Pi Network service (for API routes)
export class PiNetworkBackendService {
  private apiKey: string;
  private baseUrl = "https://api.minepi.com/v2";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Pi Network API Key is required");
    }
    this.apiKey = apiKey;
  }

  // Approve a payment (Server-Side Approval)
  async approvePayment(paymentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Payment approval failed: ${errorData.error || 'Unknown error'}`);
      }

      console.log(`Payment ${paymentId} approved successfully`);
    } catch (error) {
      console.error(`Error approving payment ${paymentId}:`, error);
      throw error;
    }
  }

  // Complete a payment (Server-Side Completion)
  async completePayment(paymentId: string, txid: string): Promise<PaymentDTO> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Payment completion failed: ${errorData.error || 'Unknown error'}`);
      }

      const paymentData = await response.json();
      console.log(`Payment ${paymentId} completed successfully with txid: ${txid}`);
      return paymentData;
    } catch (error) {
      console.error(`Error completing payment ${paymentId}:`, error);
      throw error;
    }
  }

  // Cancel a payment
  async cancelPayment(paymentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Payment cancellation failed: ${errorData.error || 'Unknown error'}`);
      }

      console.log(`Payment ${paymentId} cancelled successfully`);
    } catch (error) {
      console.error(`Error cancelling payment ${paymentId}:`, error);
      throw error;
    }
  }

  // Get payment information
  async getPayment(paymentId: string): Promise<PaymentDTO> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get payment: ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting payment ${paymentId}:`, error);
      throw error;
    }
  }

  // Get incomplete server payments
  async getIncompleteServerPayments(): Promise<PaymentDTO[]> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/incomplete_server_payments`, {
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get incomplete payments: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.incomplete_server_payments || [];
    } catch (error) {
      console.error('Error getting incomplete server payments:', error);
      throw error;
    }
  }

  // Verify user token
  async verifyUserToken(accessToken: string): Promise<PiUser> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token verification failed: ${errorData.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying user token:', error);
      throw error;
    }
  }
}

// Singleton instance for server-side usage
let piNetworkBackendInstance: PiNetworkBackendService | null = null;

export function getPiNetworkBackendService(): PiNetworkBackendService {
  if (!piNetworkBackendInstance) {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      throw new Error("PI_API_KEY environment variable is required");
    }
    piNetworkBackendInstance = new PiNetworkBackendService(apiKey);
  }
  return piNetworkBackendInstance;
}

 
