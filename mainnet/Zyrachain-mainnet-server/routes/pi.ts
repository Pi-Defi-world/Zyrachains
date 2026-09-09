import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import { getPiNetworkService } from '../zyrachain-lib/lib/pi-network';
import { PiPaymentError } from '../types/PiPaymentErrors';
import User from '../zyrachain-lib/lib/models/User';
import { serverPiConfig } from '../zyrachain-lib/config/pi-config';

// Pi Network API response interface
interface PiApiResponse {
  app_id: string;
  uid: string;
  credentials: {
    scopes: string[];
    valid_until: {
      timestamp: number;
      iso8601: string;
    };
  };
  receiving_email: boolean;
  username: string;
  wallet_address?: string;
}

const router: Router = express.Router();

// Platform API (auth verify /v2/me, payments) always uses the Pi Platform API host,
// regardless of sandbox/testnet. Testnet URLs are only for Horizon blockchain reads.
const PI_API_BASE_URL = serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL;

// Auth routes
router.post('/auth/verify', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    console.log('🔍 Verifying Pi token...');
    console.log('🌐 Using Pi API base URL:', PI_API_BASE_URL);

    // Verify token with Pi Network API
    const response = await fetch(`${PI_API_BASE_URL}/v2/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Pi API verification failed:', response.status, response.statusText);
      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }

    const piUserData = await response.json() as PiApiResponse;
    console.log('✅ Pi API response:', piUserData);

    // Validate required fields
    if (!piUserData.uid) {
      console.error('❌ Missing uid in Pi API response:', piUserData);
      return res.status(400).json({
        success: false,
        message: 'Invalid Pi user data: missing uid'
      });
    }

    console.log('🔍 Checking database for existing user...');

    // Check if user already exists with this Pi user_uid
    let user = await User.findOne({ user_uid: piUserData.uid });

    if (!user && piUserData.username) {
      // Reuse a record already keyed on the same Pi username (different uid)
      user = await User.findOne({ piUsername: piUserData.username });
    }

    const currentTime = new Date();
    console.log('🕐 Current timestamp:', currentTime.toISOString());

    if (user) {
      console.log('📝 Updating existing user:', user.user_uid);
      // Update existing user with latest Pi data
      user.user_uid = piUserData.uid;
      user.piUsername = piUserData.username;
      user.from_address = piUserData.wallet_address || null;
      user.piAccessToken = accessToken;
      user.piAuthenticatedAt = currentTime;
      
      // Store additional Pi data
      user.set('piAppId', piUserData.app_id);
      user.set('piCredentials', piUserData.credentials);
      user.set('piReceivingEmail', piUserData.receiving_email);
      
      try {
        await user.save();
        console.log('✅ Existing user updated successfully');
      } catch (saveError) {
        console.error('❌ Failed to save existing user:', saveError);
        throw saveError;
      }
    } else {
      console.log('🆕 Creating new user for:', piUserData.uid);
      // Create new user with Pi Network data
      user = new User({
        user_uid: piUserData.uid,
        piUsername: piUserData.username,
        from_address: piUserData.wallet_address || null,
        role: 'reader',
        piAccessToken: accessToken,
        piAuthenticatedAt: currentTime,
        // Store additional Pi data
        piAppId: piUserData.app_id,
        piCredentials: piUserData.credentials,
        piReceivingEmail: piUserData.receiving_email,
      });
      
      try {
        await user.save();
        console.log('✅ New user created successfully');
      } catch (saveError) {
        console.error('❌ Failed to save new user:', saveError);
        throw saveError;
      }
    }

    // Return user data following Pi Network structure
    const userResponse = {
      uid: user.user_uid,
      username: user.piUsername,
      wallet_address: user.from_address,
      authenticated_at: user.piAuthenticatedAt,
      role: user.role,
      _id: user._id,
      // Include additional Pi data
      app_id: user.get('piAppId'),
      credentials: user.get('piCredentials'),
      receiving_email: user.get('piReceivingEmail')
    };

    console.log('✅ Returning user response:', userResponse);

    return res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Get current user data
router.post('/user', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token with Pi Network API
    const response = await fetch(`${PI_API_BASE_URL}/v2/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }

    const piUserData = await response.json() as PiApiResponse;

    // Find user in our database
    const user = await User.findOne({ user_uid: piUserData.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user data
    const userResponse = {
      uid: user.user_uid,
      username: user.piUsername,
      wallet_address: user.from_address,
      authenticated_at: user.piAuthenticatedAt,
      role: user.role,
      _id: user._id,
      piAccessToken: user.piAccessToken
    };

    return res.json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
});

router.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    // Clear any server-side session data if needed
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'Logout failed'
    });
  }
});

// Payment routes - Following official Pi Network SDK pattern
// Note: The official Pi Network SDK doesn't have an approvePayment method
// The flow is: createPayment -> submitPayment -> completePayment

// Get incomplete server payments (auth required by Pi Platform API)
router.get('/payments/incomplete', async (req: Request, res: Response) => {
  try {
    const piService = getPiNetworkService();
    const payments = await piService.getIncompleteServerPayments();
    return res.json({
      success: true,
      incompletePayments: payments,
    });
  } catch (error: any) {
    console.error('Get incomplete payments error:', error?.response?.data || error);
    return res.status(500).json({
      error: 'Failed to get incomplete payments',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get payment details (for debugging and validation)
router.get('/payments/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        error: 'Payment ID is required'
      });
    }

    console.log(`🔍 Getting payment details for: ${paymentId}`);

    const piService = getPiNetworkService();
    const payment = await piService.getPayment(paymentId);

    return res.json({
      success: true,
      paymentId,
      payment
    });

  } catch (error) {
    console.error('Get payment error:', error);
    
    if (error instanceof PiPaymentError) {
      let statusCode = 400;
      if (error.code === 'payment_not_found') {
        statusCode = 404;
      }
      
      return res.status(statusCode).json({
        error: error.message,
        code: error.code,
        paymentId: req.params.paymentId
      });
    }

    return res.status(500).json({
      error: 'Failed to get payment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Payment approval — required by Pi Platform API before user can sign
router.post('/payments/approve', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    console.log(`📝 Approving payment: ${paymentId}`);
    const piService = getPiNetworkService();
    await piService.approvePayment(paymentId);
    console.log(`✅ Payment ${paymentId} approved`);

    return res.json({ success: true, paymentId, approved: true });
  } catch (error: any) {
    console.error('Payment approval error:', error?.response?.data || error);
    return res.status(500).json({
      error: 'Payment approval failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/payments/complete', async (req: Request, res: Response) => {
  try {
    const { paymentId, txid, listingData, listingType } = req.body;

    if (!paymentId || !txid) {
      return res.status(400).json({
        error: 'Payment ID and transaction ID are required'
      });
    }

    const piService = getPiNetworkService();
    
    try {
      // Complete the payment
      await piService.completePayment(paymentId, txid);
    } catch (error: any) {
      // Handle already_completed as success
      if (error.response?.data?.error === 'already_completed') {
        console.warn(`Payment ${paymentId} already completed - continuing with listing creation`);
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    // Oracle API key (100 Pi) — create key document; return plaintext once
    if (listingType === 'oracle_api') {
      const ApiKey = require('../zyrachain-lib/lib/models/ApiKey').default;
      const { generateOracleApiKey, hashOracleApiKey } = require('../zyrachain-lib/lib/apiKeyCrypto');

      const existing = await ApiKey.findOne({ paymentId });
      if (existing) {
        return res.json({
          success: true,
          message: 'Payment already processed',
          keyPrefix: existing.keyPrefix,
          alreadyCompleted: true,
          paymentId,
          txid,
        });
      }

      const { userId, name } = listingData || {};
      if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        throw new Error('oracle_api requires listingData.userId (Mongo ObjectId string)');
      }

      const plain = generateOracleApiKey();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const user = await User.findById(userId);
      const keyDoc = new ApiKey({
        keyHash: hashOracleApiKey(plain),
        keyPrefix: plain.slice(0, 12),
        userId,
        piUid: user?.user_uid,
        name: (name as string) || 'Oracle API Key',
        paymentId,
        transactionId: txid,
        status: 'active',
        credits: 100,
        creditCostPerRequest: 0.01,
        expiresAt,
      });
      await keyDoc.save();

      return res.json({
        success: true,
        message: 'Oracle API key created',
        paymentId,
        txid,
        apiKey: plain,
        keyId: keyDoc._id,
        warning: 'Save this key now — it will not be shown again.',
      });
    }

    // Credit top-up for existing API key
    if (listingType === 'topup_credits') {
      const ApiKey = require('../zyrachain-lib/lib/models/ApiKey').default;
      const { keyId, amount } = listingData || {};

      if (!keyId || !mongoose.Types.ObjectId.isValid(String(keyId))) {
        throw new Error('topup_credits requires listingData.keyId (Mongo ObjectId)');
      }

      const key = await ApiKey.findById(keyId);
      if (!key) {
        throw new Error('API key not found');
      }
      if (key.status !== 'active') {
        throw new Error(`API key is ${key.status}`);
      }

      const creditAmount = Number(amount) || 100;
      key.credits = (key.credits || 0) + creditAmount;
      await key.save();

      return res.json({
        success: true,
        message: `Added ${creditAmount} credits to API key`,
        paymentId,
        txid,
        keyId: key._id,
        credits: key.credits,
      });
    }

    // ZP Token purchase for social features
    if (listingType === 'social_tokens') {
      const { purchaseZP } = require('../services/token-ledger');
      const { piAmount } = listingData || {};
      const piNum = parseFloat(piAmount) || 0;

      if (piNum <= 0) {
        throw new Error('Invalid Pi amount for ZP purchase');
      }

      const { account, zpAmount } = await purchaseZP(listingData.userId, piNum, paymentId, txid);

      return res.json({
        success: true,
        message: `Credited ${zpAmount} ZP for ${piNum} Pi`,
        paymentId,
        txid,
        zp_credited: zpAmount,
        new_balance: account.balance,
      });
    }

    // Save the listing data based on type
    if (listingData && listingType) {
      let ListingModel;

      switch (listingType) {
        case 'business':
          const BusinessListing = require('../zyrachain-lib/lib/models/BusinessListing').default;
          ListingModel = BusinessListing;
          break;
        case 'startup':
          const StartupListing = require('../zyrachain-lib/lib/models/StartupListing').default;
          ListingModel = StartupListing;
          break;
        case 'community':
          const CommunityListing = require('../zyrachain-lib/lib/models/CommunityListing').default;
          ListingModel = CommunityListing;
          break;
        case 'influencer':
          const InfluencerListing = require('../zyrachain-lib/lib/models/InfluencerListing').default;
          ListingModel = InfluencerListing;
          break;
        case 'project':
          const ProjectListing = require('../zyrachain-lib/lib/models/ProjectListing').default;
          ListingModel = ProjectListing;
          break;
        case 'update':
          const UpdateListingModel = require('../zyrachain-lib/lib/models/UpdateListing').default;
          ListingModel = UpdateListingModel;
          break;
        default:
          throw new Error(`Unknown listing type: ${listingType}`);
      }

      const listing = new ListingModel({
        ...listingData,
        status: 'pending',
        paymentId,
        transactionId: txid,
        paidAt: new Date(),
        submittedAt: new Date(),
      });

      await listing.save();
      console.log(`${listingType} listing saved successfully:`, listing._id);
    }

    return res.json({
      success: true,
      message: 'Payment completed and listing submitted for review',
      paymentId,
      txid,
    });

  } catch (error) {
    console.error('Payment completion error:', error);
    
    if (error instanceof PiPaymentError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }

    return res.status(500).json({
      error: 'Payment completion failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/payments/cancel', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        error: 'Payment ID is required'
      });
    }

    const piService = getPiNetworkService();
    await piService.cancelPayment(paymentId);

    return res.json({
      success: true,
      message: 'Payment cancelled successfully'
    });

  } catch (error) {
    console.error('Payment cancellation error:', error);
    
    if (error instanceof PiPaymentError) {
      return res.status(400).json({
        error: error.message,
        code: error.code
      });
    }

    return res.status(500).json({
      error: 'Payment cancellation failed'
    });
  }
});

// Get payment configuration for listing types
router.get('/payments/config/:listingType', async (req: Request, res: Response) => {
  try {
    const { listingType } = req.params;
    const piService = getPiNetworkService();

    // Get payment configuration (some listing types such as social_tokens have
    // no LISTING_PAYMENTS entry — fall back to a safe default instead of 500).
    let amount: number | undefined;
    let memo: string | undefined;
    try {
      const paymentConfig = piService.getListingPayment(
        listingType as any,
        'temp-user',
        {}
      );
      amount = paymentConfig.amount;
      memo = paymentConfig.memo;
    } catch {
      amount = undefined;
      memo = `Payment config for ${listingType}`;
    }

    const { getConversionRate } = require('../services/platform-settings');
    const zpPerPi = await getConversionRate();

    return res.json({
      success: true,
      config: {
        amount: amount ?? 0,
        memo,
        listingType,
        zp_per_pi: zpPerPi
      }
    });

  } catch (error) {
    console.error('Payment config error:', error);
    return res.status(500).json({
      error: 'Failed to get payment configuration'
    });
  }
});

export default router; 