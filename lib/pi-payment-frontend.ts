// Use Pi SDK types from types/pi sdk.d.ts
import { PiSDK, PiPayment, PiPaymentRequest, PiPaymentCallbacks } from '../types/pi sdk';

import { ListingType, LISTING_PAYMENTS } from './pi-network';
import { getPublicBackendUrl } from './get-backend-url';

export interface PiListingPaymentData {
  listingType: ListingType;
  listingData: Record<string, any>;
  userInfo: {
    email: string;
    name: string;
  };
}

export interface PiPaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  apiKey?: string;
  keyId?: string;
  warning?: string;
  alreadyCompleted?: boolean;
  keyPrefix?: string;
}

// Express server base URL - aligned with backend structure
const SERVER_BASE_URL = getPublicBackendUrl();

export class PiListingPaymentService {
  private static instance: PiListingPaymentService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): PiListingPaymentService {
    if (!PiListingPaymentService.instance) {
      PiListingPaymentService.instance = new PiListingPaymentService();
    }
    return PiListingPaymentService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Wait for the Pi SDK to be available on the window object, loaded by next/script
    await new Promise<void>((resolve, reject) => {
        const maxRetries = 20; // Wait for up to 10 seconds
        let retries = 0;
        const interval = setInterval(() => {
            if (window.Pi) {
                clearInterval(interval);
                resolve();
            } else if (retries >= maxRetries) {
                clearInterval(interval);
                console.error('❌ Pi SDK failed to load in time.');
                reject(new Error('Pi SDK not loaded.'));
            }
            retries++;
        }, 500);
    });

    try {
      const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
      console.log('🔧 Initializing Pi SDK (sandbox:', isDev, ')');
      await window.Pi.init({
        version: "2.0",
        sandbox: isDev
      });
      
      this.isInitialized = true;
      console.log('✅ Pi SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Pi SDK:', error);
      throw new Error(`Pi Network SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async authenticate(): Promise<{ accessToken: string; user: any }> {
    console.log('🔐 Starting Pi authentication...');
    await this.initialize();

    try {
      console.log('📱 Calling Pi.authenticate...');
      const auth = await window.Pi.authenticate(
        ['username', 'payments', 'wallet_address'],
        this.onIncompletePaymentFound
      );

      console.log('✅ Pi authentication successful:', { 
        hasAccessToken: !!auth.accessToken, 
        hasUser: !!auth.user,
        userUid: auth.user?.uid 
      });

      return auth;
    } catch (error) {
      console.error('❌ Pi authentication failed:', error);
      throw new Error(`Pi Network authentication failed: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  }

  async createListingPayment(paymentData: PiListingPaymentData): Promise<PiPaymentResult> {
    await this.initialize();

    const listingConfig = LISTING_PAYMENTS[paymentData.listingType];
    if (!listingConfig) {
      throw new Error(`Invalid listing type: ${paymentData.listingType}`);
    }

    try {
      // First authenticate the user
      await this.authenticate();

      return new Promise((resolve) => {
        const piPaymentRequest: PiPaymentRequest = {
          amount: listingConfig.amount,
          memo: listingConfig.memo,
          metadata: {
            listingType: paymentData.listingType,
            listingData: paymentData.listingData,
            userInfo: paymentData.userInfo,
            timestamp: new Date().toISOString()
          }
        };

        const callbacks: PiPaymentCallbacks = {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('Payment ready for server approval:', paymentId);
            try {
              const response = await fetch(`${SERVER_BASE_URL}/api/pi/payments/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId })
              });
              if (!response.ok) {
                console.error('Payment approval failed:', await response.text());
              } else {
                console.log('✅ Payment approved by server');
              }
            } catch (error) {
              console.error('Payment approval request failed:', error);
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log('Payment ready for completion:', paymentId, txid);
            try {
              // Call Express server to complete payment and save listing
              const response = await fetch(`${SERVER_BASE_URL}/api/pi/payments/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  paymentId, 
                  txid,
                  listingData: paymentData.listingData,
                  listingType: paymentData.listingType
                })
              });

              if (!response.ok) {
                throw new Error('Payment completion failed');
              }

              const result = await response.json();
              console.log('✅ Payment completed and listing saved:', result);
              resolve({
                success: true,
                paymentId,
                apiKey: result.apiKey,
                keyId: result.keyId,
                warning: result.warning,
                alreadyCompleted: result.alreadyCompleted,
                keyPrefix: result.keyPrefix,
              });
            } catch (error) {
              console.error('❌ Payment completion error:', error);
              resolve({ 
                success: false, 
                error: error instanceof Error ? error.message : 'Payment completion failed' 
              });
            }
          },

          onCancel: (paymentId: string) => {
            console.log('❌ Payment cancelled:', paymentId);
            console.log('❌ Payment cancellation details:', {
              paymentId,
              timestamp: new Date().toISOString(),
              reason: 'User cancelled or payment was cancelled automatically'
            });
            
            // Note: For user-to-app payments, we don't need to call server cancel
            // Pi Network handles the cancellation automatically
            // The server cancel endpoint is mainly for app-to-user payments
            
            resolve({ success: false, error: 'Payment was cancelled' });
          },

          onError: (error: Error, payment?: PiPayment) => {
            console.error('❌ Payment error:', error, payment);
            console.error('❌ Error details:', {
              message: error.message,
              name: error.name,
              stack: error.stack,
              payment: payment ? {
                identifier: payment.identifier,
                status: payment.status,
                amount: payment.amount
              } : 'No payment data'
            });
            
            // Enhanced error handling based on Pi SDK patterns
            let errorMessage = 'Payment failed';
            const msg = error.message || '';
            
            if (msg.includes('payments') && msg.includes('scope')) {
              errorMessage = 'Payment permissions required. Please login again to enable payments.';
            } else if (msg.includes('insufficient_balance')) {
              errorMessage = 'Insufficient Pi balance for this transaction';
            } else if (msg.includes('user_cancelled')) {
              errorMessage = 'Payment was cancelled by user';
            } else if (msg.includes('network_error')) {
              errorMessage = 'Network error. Please check your connection and try again';
            } else if (msg.includes('payment_timeout')) {
              errorMessage = 'Payment timed out. Please try again';
            } else if (msg) {
              errorMessage = msg;
            }
            
            resolve({ success: false, error: errorMessage });
          }
        };

        // Create the payment using Pi SDK
        console.log('🔄 Creating payment with Pi SDK:', piPaymentRequest);
        try {
          window.Pi.createPayment(piPaymentRequest, callbacks);
          console.log('✅ Payment creation initiated successfully');
        } catch (error) {
          console.error('❌ Payment creation failed:', error);
          resolve({ success: false, error: 'Failed to create payment' });
        }
      });

    } catch (error) {
      console.error('❌ Failed to create Pi payment:', error);
      
      let errorMessage = 'Failed to create payment';
      if (error instanceof Error) {
        if (error.message.includes('Pi SDK not available')) {
          errorMessage = 'Please open this app in Pi Browser to make payments';
        } else if (error.message.includes('authentication')) {
          errorMessage = 'Authentication required. Please sign in with Pi Network';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  private onIncompletePaymentFound = (payment: PiPayment) => {
    console.log('Incomplete payment found:', payment);
    // Cancel incomplete payment
    fetch(`${SERVER_BASE_URL}/api/pi/payments/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: payment.identifier })
    }).catch(error => {
      console.error('Failed to cancel incomplete payment:', error);
    });
  };

  getListingPrice(listingType: ListingType): number {
    return LISTING_PAYMENTS[listingType]?.amount || 0;
  }

  getListingMemo(listingType: ListingType): string {
    return LISTING_PAYMENTS[listingType]?.memo || '';
  }

  // Alias for createListingPayment for backward compatibility
  async createAndProcessPayment(paymentData: PiListingPaymentData): Promise<PiPaymentResult> {
    return this.createListingPayment(paymentData);
  }
}

// Export singleton instance
export const piListingPaymentService = PiListingPaymentService.getInstance(); 
