'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { piListingPaymentService } from '../lib/pi-payment-frontend';
import { ListingType } from '../lib/pi-network';
import { getPublicBackendUrl } from '@/lib/get-backend-url';

interface PiUser {
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
  piReceivingEmail?: boolean;
}

interface PiAuthResult {
  accessToken: string;
  user: PiUser;
}

interface PiNetworkContextType {
  // Authentication state
  isAuthenticated: boolean;
  user: PiUser | null;
  accessToken: string | null;
  isLoading: boolean;
  
  // Authentication methods
  authenticate: () => Promise<PiAuthResult>;
  syncUser: () => Promise<PiUser | null>;
  refreshUser: () => Promise<void>;
  ensurePiAuthentication: () => Promise<PiAuthResult>;
  logout: () => void;
  
  // Payment methods
  createListingPayment: (
    listingType: ListingType,
    listingData: Record<string, any>,
    userInfo: { email: string; name: string }
  ) => Promise<{
    success: boolean;
    paymentId?: string;
    error?: string;
    apiKey?: string;
    keyId?: string;
    warning?: string;
    alreadyCompleted?: boolean;
    keyPrefix?: string;
  }>;
  
  createPayment: (paymentData: {
    amount: number;
    memo: string;
    metadata?: Record<string, any>;
  }) => Promise<{ success: boolean; paymentId?: string; error?: string }>;
  
  // Payment state
  isPaymentInProgress: boolean;
  currentPaymentId: string | null;
}

const PiNetworkContext = createContext<PiNetworkContextType | undefined>(undefined);

interface PiNetworkProviderProps {
  children: ReactNode;
}

function getBaseUrl(): string {
  return getPublicBackendUrl();
}

export function PiNetworkProvider({ children }: PiNetworkProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<PiUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      const savedToken = localStorage.getItem('pi_access_token');
      const savedUser = localStorage.getItem('pi_user');
      
      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          // Do NOT mark as authenticated from localStorage alone —
          // the Pi session must be re-verified with the backend first.

          // Re-initialize Pi SDK so payments scope stays alive
          if (typeof window !== 'undefined' && (window as any).Pi) {
            try {
              const isDev = process.env.NODE_ENV === 'development';
              const useSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true' || isDev;
              await (window as any).Pi.init({ version: "2.0", sandbox: useSandbox });
              console.log('✅ Pi SDK re-initialized for existing auth (sandbox:', useSandbox, ')');
            } catch (initError) {
              console.warn('⚠️ Pi SDK re-init failed:', initError);
            }
          }

          // Re-verify with backend; only restore auth if verification succeeds
          try {
            const resp = await fetch(`${getBaseUrl()}/api/pi/auth/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: savedToken }),
            });
            if (resp.ok) {
              const data = await resp.json();
              if (data.user?._id) {
                setUser(data.user);
                setAccessToken(savedToken);
                setIsAuthenticated(true);
                localStorage.setItem('pi_user', JSON.stringify(data.user));
                console.log('✅ Authentication restored after backend verification');
              }
            } else if (resp.status === 401 || resp.status === 403) {
              console.warn('⚠️ Access token invalid, clearing auth');
              localStorage.removeItem('pi_access_token');
              localStorage.removeItem('pi_user');
              setUser(null);
              setAccessToken(null);
              setIsAuthenticated(false);
            }
          } catch {
            // Backend unreachable — do not trust cached credentials
            console.warn('⚠️ Backend verification failed — staying signed out');
            localStorage.removeItem('pi_access_token');
            localStorage.removeItem('pi_user');
            setUser(null);
            setAccessToken(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error restoring saved authentication:', error);
          localStorage.removeItem('pi_access_token');
          localStorage.removeItem('pi_user');
        }
      }
    };

    checkExistingAuth();
  }, []);

  const authenticate = async (): Promise<PiAuthResult> => {
    if (typeof window === 'undefined' || !(window as any).Pi) {
      throw new Error('Pi SDK not available. Please open in Pi Browser.');
    }

    setIsLoading(true);
    try {
      console.log('🔐 Starting authentication flow...');

      const isDev = process.env.NODE_ENV === 'development';
      const useSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true' || isDev;
      console.log('📦 Initializing Pi SDK (sandbox:', useSandbox, ')');
      await (window as any).Pi.init({ version: "2.0", sandbox: useSandbox });

      const onIncompletePaymentFound = async (payment: any) => {
        console.log('⚠️ Incomplete payment found:', payment);
        const paymentId = payment.identifier;
        try {
          await fetch(`${getBaseUrl()}/api/pi/payments/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });
          console.log('✅ Incomplete payment cancelled:', paymentId);
        } catch (err) {
          console.error('Error cancelling incomplete payment:', err);
        }
      };

      console.log('🔑 Authenticating with Pi Network...');
      const auth = await (window as any).Pi.authenticate(
        ["username", "payments", "wallet_address"],
        onIncompletePaymentFound
      );

      console.log('✅ Pi authentication completed — scopes:', auth.user.credentials?.scopes);

      const userData = auth.user;

      setUser(userData);
      setAccessToken(auth.accessToken);
      setIsAuthenticated(true);

      localStorage.setItem('pi_access_token', auth.accessToken);
      localStorage.setItem('pi_user', JSON.stringify(userData));
      console.log('💾 Authentication data saved to localStorage');

      // Verify token with backend
      try {
        const response = await fetch(`${getBaseUrl()}/api/pi/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: auth.accessToken }),
        });

        if (response.ok) {
          const backendResponse = await response.json();
          setUser(backendResponse.user);
          localStorage.setItem('pi_user', JSON.stringify(backendResponse.user));
          console.log('✅ User verified and synced with backend');
        } else {
          console.warn('⚠️ Backend verification failed, using frontend auth only');
        }
      } catch (error) {
        console.error('⚠️ Backend verification request failed:', error);
      }

      return auth;
    } catch (error) {
      console.error('Pi Network authentication failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const syncUser = async (): Promise<PiUser | null> => {
    const token = localStorage.getItem('pi_access_token');
    if (!token) return null;
    try {
      const response = await fetch(`${getBaseUrl()}/api/pi/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user?._id) {
          setUser(data.user);
          localStorage.setItem('pi_user', JSON.stringify(data.user));
          return data.user;
        }
      }
    } catch (error) {
      console.error('User sync failed:', error);
    }
    return null;
  };

  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem('pi_access_token');
    if (!token) return;
    try {
      const resp = await fetch(`${getBaseUrl()}/api/pi/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.user?._id) {
          setUser(data.user);
          localStorage.setItem('pi_user', JSON.stringify(data.user));
        }
      } else if (resp.status === 401) {
        logout();
      }
    } catch { /* silent */ }
  };

  const ensurePiAuthentication = async (): Promise<PiAuthResult> => {
    if (typeof window === 'undefined' || !(window as any).Pi) {
      throw new Error('Pi SDK not available. Please open in Pi Browser.');
    }
    const isDev = process.env.NODE_ENV === 'development';
    const useSandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true' || isDev;
    await (window as any).Pi.init({ version: "2.0", sandbox: useSandbox });

    const auth = await (window as any).Pi.authenticate(
      ["username", "payments", "wallet_address"],
      async (payment: any) => {
        const paymentId = payment.identifier;
        await fetch(`${getBaseUrl()}/api/pi/payments/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId })
        });
      }
    );

    setAccessToken(auth.accessToken);
    setUser(auth.user);
    localStorage.setItem('pi_access_token', auth.accessToken);
    localStorage.setItem('pi_user', JSON.stringify(auth.user));
    return auth;
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
    setIsPaymentInProgress(false);
    setCurrentPaymentId(null);
    
    // Clear localStorage
    localStorage.removeItem('pi_access_token');
    localStorage.removeItem('pi_user');
  };

  const createListingPayment = async (
    listingType: ListingType,
    listingData: Record<string, any>,
    userInfo: { email: string; name: string }
  ): Promise<{
    success: boolean;
    paymentId?: string;
    error?: string;
    apiKey?: string;
    keyId?: string;
    warning?: string;
    alreadyCompleted?: boolean;
    keyPrefix?: string;
  }> => {
    if (!isAuthenticated) {
      return { success: false, error: 'User must be authenticated to make payments' };
    }

    setIsPaymentInProgress(true);
    setCurrentPaymentId(null);

    try {
      const result = await piListingPaymentService.createListingPayment({
        listingType,
        listingData,
        userInfo
      });

      if (result.success && result.paymentId) {
        setCurrentPaymentId(result.paymentId);
      }

      return result;
    } catch (error) {
      console.error('Payment creation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    } finally {
      setIsPaymentInProgress(false);
    }
  };

  const createPayment = async (paymentData: {
    amount: number;
    memo: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    if (!isAuthenticated) {
      return { success: false, error: 'User must be authenticated to make payments' };
    }

    if (typeof window === 'undefined' || !(window as any).Pi) {
      return { success: false, error: 'Pi SDK not available. Please open in Pi Browser.' };
    }

    setIsPaymentInProgress(true);
    setCurrentPaymentId(null);

    try {
      await ensurePiAuthentication();

      return new Promise((resolve) => {
        const callbacks = {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('Payment ready for approval:', paymentId);
            setCurrentPaymentId(paymentId);
            try {
              const response = await fetch(`${getBaseUrl()}/api/pi/payments/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId })
              });
              if (!response.ok) throw new Error('Payment approval failed');
            } catch (error) {
              console.error('Payment approval error:', error);
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log('Payment ready for completion:', paymentId, txid);
            try {
              const response = await fetch(`${getBaseUrl()}/api/pi/payments/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  paymentId, 
                  txid,
                  listingData: paymentData.metadata?.listingData,
                  listingType: paymentData.metadata?.listingType
                })
              });
              if (!response.ok) throw new Error('Payment completion failed');
              resolve({ success: true, paymentId });
            } catch (error) {
              console.error('Payment completion error:', error);
              resolve({ success: false, error: 'Payment completion failed' });
            } finally {
              setIsPaymentInProgress(false);
            }
          },

          onCancel: (paymentId: string) => {
            console.log('Payment cancelled:', paymentId);
            setIsPaymentInProgress(false);
            resolve({ success: false, error: 'Payment was cancelled' });
          },

          onError: (error: Error, payment?: any) => {
            console.error('Payment error:', error?.message, payment);
            setIsPaymentInProgress(false);
            const msg = error?.message || 'Payment failed';
            if (msg.includes('payments') && msg.includes('scope')) {
              console.warn('⚠️ Payments scope missing — logging out to force re-auth');
              logout();
              resolve({ success: false, error: 'Payment permissions required. Please login again to enable payments.' });
            } else {
              resolve({ success: false, error: msg });
            }
          }
        };

        (window as any).Pi.createPayment(paymentData, callbacks);
      });

    } catch (error) {
      console.error('Failed to create Pi payment:', error);
      setIsPaymentInProgress(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      };
    }
  };

  const value: PiNetworkContextType = {
    isAuthenticated,
    user,
    accessToken,
    isLoading,
    authenticate,
    syncUser,
    refreshUser,
    ensurePiAuthentication,
    logout,
    createListingPayment,
    createPayment,
    isPaymentInProgress,
    currentPaymentId
  };

  return (
    <PiNetworkContext.Provider value={value}>
      {children}
    </PiNetworkContext.Provider>
  );
}

export function usePiNetwork() {
  const context = useContext(PiNetworkContext);
  if (context === undefined) {
    throw new Error('usePiNetwork must be used within a PiNetworkProvider');
  }
  return context;
}
