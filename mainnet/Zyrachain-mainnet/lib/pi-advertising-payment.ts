// Pi Network Payment Service - Unified for all listings and advertising
import type { PiSDK, PiPayment, PiPaymentRequest, PiPaymentCallbacks } from '@/types/pi sdk';

export interface AdvertisingPlan {
  id: string;
  name: string;
  price: number; // Price in Pi
  duration: string;
  features: string[];
  description: string;
}

export interface ListingPlan {
  id: string;
  name: string;
  price: number; // Price in Pi
  description: string;
  features: string[];
}

export interface AdvertisingPaymentData {
  planId: string;
  planName: string;
  amount: number;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  industry: string;
  campaignType: string;
  targetAudience?: string;
  campaignGoals?: string;
  startDate?: string;
  duration: string;
  additionalInfo?: string;
}

export interface ListingPaymentData {
  listingType: 'business' | 'startup' | 'project' | 'community' | 'influencer' | 'update';
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
}


export class PiPaymentService {
  private isInitialized = false;

  private async loadPiSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Pi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.minepi.com/pi-sdk.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pi SDK'));
      document.head.appendChild(script);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load Pi SDK if not already loaded
      if (!window.Pi) {
        await this.loadPiSDK();
      }

      // Initialize Pi SDK
      await window.Pi.init({ version: "2.0" });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Pi SDK:', error);
      throw new Error('Pi Network SDK initialization failed');
    }
  }

  async processAdvertisingPayment(
    paymentData: AdvertisingPaymentData,
    callbacks: {
      onSuccess: (paymentId: string, txid: string) => void;
      onError: (error: string) => void;
      onCancel: () => void;
    }
  ): Promise<void> {
    try {
      await this.initialize();

      // Authenticate user
      const auth = await window.Pi.authenticate(['payments'], this.onIncompletePaymentFound);

      // Create payment request
      const piPaymentRequest: PiPaymentRequest = {
        amount: paymentData.amount,
        memo: `Advertising: ${paymentData.planName} - ${paymentData.companyName}`,
        metadata: {
          type: 'advertising',
          planId: paymentData.planId,
          planName: paymentData.planName,
          companyName: paymentData.companyName,
          contactName: paymentData.contactName,
          email: paymentData.email,
          phone: paymentData.phone,
          website: paymentData.website,
          industry: paymentData.industry,
          campaignType: paymentData.campaignType,
          targetAudience: paymentData.targetAudience,
          campaignGoals: paymentData.campaignGoals,
          startDate: paymentData.startDate,
          duration: paymentData.duration,
          additionalInfo: paymentData.additionalInfo
        }
      };

      // Set up payment callbacks
      const piCallbacks: PiPaymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            const response = await fetch('/api/pi/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId })
            });

            if (!response.ok) {
              throw new Error('Payment approval failed');
            }
          } catch (error) {
            console.error('Payment approval error:', error);
            callbacks.onError('Payment approval failed');
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            // Submit advertising inquiry with payment confirmation
            const inquiryData = {
              ...paymentData,
              paymentId,
              txid,
              amount: paymentData.amount
            };

            const response = await fetch('/api/advertising-inquiries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(inquiryData)
            });

            if (!response.ok) {
              throw new Error('Failed to submit inquiry');
            }

            callbacks.onSuccess(paymentId, txid);
          } catch (error) {
            console.error('Inquiry submission error:', error);
            callbacks.onError('Failed to submit inquiry');
          }
        },
        onCancel: (paymentId: string) => {
          callbacks.onCancel();
        },
        onError: (error: Error, payment?: PiPayment) => {
          console.error('Payment error:', error);
          callbacks.onError(error.message);
        }
      };

      // Create payment
      window.Pi.createPayment(piPaymentRequest, piCallbacks);
    } catch (error) {
      console.error('Payment processing error:', error);
      callbacks.onError('Payment processing failed');
    }
  }

  async processListingPayment(
    paymentData: ListingPaymentData,
    callbacks: {
      onSuccess: (paymentId: string, txid: string) => void;
      onError: (error: string) => void;
      onCancel: () => void;
    }
  ): Promise<void> {
    try {
      await this.initialize();

      // Get listing plan
      const listingPlan = this.getListingPlan(paymentData.listingType);
      if (!listingPlan) {
        throw new Error('Invalid listing type');
      }

      // Authenticate user
      const auth = await window.Pi.authenticate(['payments'], this.onIncompletePaymentFound);

      // Create payment request
      const piPaymentRequest: PiPaymentRequest = {
        amount: listingPlan.price,
        memo: `${listingPlan.name} - ${paymentData.userInfo.name}`,
        metadata: {
          type: 'listing',
          listingType: paymentData.listingType,
          listingData: paymentData.listingData,
          userInfo: paymentData.userInfo,
          planId: listingPlan.id,
          planName: listingPlan.name
        }
      };

      // Set up payment callbacks
      const piCallbacks: PiPaymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            const response = await fetch('/api/pi/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId })
            });

            if (!response.ok) {
              throw new Error('Payment approval failed');
            }
          } catch (error) {
            console.error('Payment approval error:', error);
            callbacks.onError('Payment approval failed');
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            // Submit listing with payment confirmation
            const listingData = {
              ...paymentData.listingData,
              paymentId,
              txid,
              amount: listingPlan.price,
              planId: listingPlan.id,
              planName: listingPlan.name,
              status: 'paid'
            };

            const response = await fetch(`/api/${paymentData.listingType}-listings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(listingData)
            });

            if (!response.ok) {
              throw new Error('Failed to submit listing');
            }

            callbacks.onSuccess(paymentId, txid);
          } catch (error) {
            console.error('Listing submission error:', error);
            callbacks.onError('Failed to submit listing');
          }
        },
        onCancel: (paymentId: string) => {
          callbacks.onCancel();
        },
        onError: (error: Error, payment?: PiPayment) => {
          console.error('Payment error:', error);
          callbacks.onError(error.message);
        }
      };

      // Create payment
      window.Pi.createPayment(piPaymentRequest, piCallbacks);
    } catch (error) {
      console.error('Payment processing error:', error);
      callbacks.onError('Payment processing failed');
    }
  }

  private onIncompletePaymentFound = (payment: PiPayment) => {
    console.log('Incomplete payment found:', payment);
    // You can implement logic to handle incomplete payments
  }

  // Get available advertising plans
  getAdvertisingPlans(): AdvertisingPlan[] {
    return [
      {
        id: 'basic',
        name: 'Basic Banner',
        price: 50, // 50 Pi
        duration: '7 days',
        features: [
          '728x90 banner placement',
          'Homepage visibility',
          'Basic analytics',
          'Mobile responsive',
          'Standard targeting'
        ],
        description: 'Perfect for small businesses and startups looking to reach the Pi Network community.'
      },
      {
        id: 'premium',
        name: 'Premium Package',
        price: 150,  
        duration: '14 days',
        features: [
          'Multiple banner placements',
          'Blog post sponsorship',
          'Social media shoutout',
          'Advanced analytics',
          'Priority placement',
          'Custom targeting'
        ],
        description: 'Our most popular package with comprehensive advertising solutions.'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 400, // 400 Pi
        duration: '30 days',
        features: [
          'Full campaign management',
          'Sponsored content series',
          'Newsletter integration',
          'Custom landing page',
          'Dedicated account manager',
          'Performance guarantees'
        ],
        description: 'Complete advertising solution for established businesses and large campaigns.'
      }
    ];
  }

  // Get listing plans
  getListingPlans(): ListingPlan[] {
    return [
      {
        id: 'business',
        name: 'Business Listing',
        price: 48, // 48 Pi (40% reduction from 80)
        description: 'List your business in our Pi Network business directory',
        features: [
          'Business profile page',
          'Search visibility',
          'Contact information',
          'Pi payment acceptance badge',
          'Category listing',
          'Instant approval'
        ]
      },
      {
        id: 'startup',
        name: 'Startup Listing',
        price: 30, // 30 Pi (40% reduction from 50)
        description: 'Showcase your startup in our ecosystem',
        features: [
          'Startup profile page',
          'Investment visibility',
          'Team information',
          'Project showcase',
          'Community access',
          'Instant approval'
        ]
      },
      {
        id: 'project',
        name: 'Project Listing',
        price: 30, // 30 Pi (40% reduction from 50)
        description: 'List your Pi Network project',
        features: [
          'Project profile page',
          'Developer visibility',
          'GitHub integration',
          'Community feedback',
          'Technical showcase',
          'Instant approval'
        ]
      },
      {
        id: 'community',
        name: 'Community Listing',
        price: 30, // 30 Pi (40% reduction from 50)
        description: 'List your Pi Network community',
        features: [
          'Community profile page',
          'Member visibility',
          'Event announcements',
          'Social links',
          'Community showcase',
          'Instant approval'
        ]
      },
      {
        id: 'influencer',
        name: 'Influencer Listing',
        price: 30, // 30 Pi (40% reduction from 50)
        description: 'List yourself as a Pi Network influencer',
        features: [
          'Influencer profile page',
          'Social media showcase',
          'Content highlights',
          'Community influence',
          'Brand partnerships',
          'Instant approval'
        ]
      },
      {
        id: 'update',
        name: 'Listing Update',
        price: 48, // 48 Pi (40% reduction from 80)
        description: 'Update your existing listing',
        features: [
          'Profile updates',
          'Information refresh',
          'Priority placement',
          'Updated timestamps',
          'Enhanced visibility',
          'Instant approval'
        ]
      }
    ];
  }

  // Get plan by ID
  getAdvertisingPlanById(planId: string): AdvertisingPlan | undefined {
    return this.getAdvertisingPlans().find(plan => plan.id === planId);
  }

  // Get listing plan by type
  getListingPlan(listingType: string): ListingPlan | undefined {
    return this.getListingPlans().find(plan => plan.id === listingType);
  }
}

// Export singleton instance
export const piPaymentService = new PiPaymentService();

// Legacy exports for backward compatibility
export const piAdvertisingPaymentService = piPaymentService; 