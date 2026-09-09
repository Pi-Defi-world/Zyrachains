"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const pi_network_1 = require("../zyrachain-lib/lib/pi-network");
const PiPaymentErrors_1 = require("../types/PiPaymentErrors");
const User_1 = __importDefault(require("../zyrachain-lib/lib/models/User"));
const pi_config_1 = require("../zyrachain-lib/config/pi-config");
const router = express_1.default.Router();
const PI_API_BASE_URL = pi_config_1.serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL;
router.post('/auth/verify', async (req, res) => {
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
        const piUserData = await response.json();
        console.log('✅ Pi API response:', piUserData);
        if (!piUserData.uid) {
            console.error('❌ Missing uid in Pi API response:', piUserData);
            return res.status(400).json({
                success: false,
                message: 'Invalid Pi user data: missing uid'
            });
        }
        console.log('🔍 Checking database for existing user...');
        let user = await User_1.default.findOne({ user_uid: piUserData.uid });
        if (!user && piUserData.username) {
            user = await User_1.default.findOne({ piUsername: piUserData.username });
        }
        const currentTime = new Date();
        console.log('🕐 Current timestamp:', currentTime.toISOString());
        if (user) {
            console.log('📝 Updating existing user:', user.user_uid);
            user.user_uid = piUserData.uid;
            user.piUsername = piUserData.username;
            user.from_address = piUserData.wallet_address || null;
            user.piAccessToken = accessToken;
            user.piAuthenticatedAt = currentTime;
            user.set('piAppId', piUserData.app_id);
            user.set('piCredentials', piUserData.credentials);
            user.set('piReceivingEmail', piUserData.receiving_email);
            try {
                await user.save();
                console.log('✅ Existing user updated successfully');
            }
            catch (saveError) {
                console.error('❌ Failed to save existing user:', saveError);
                throw saveError;
            }
        }
        else {
            console.log('🆕 Creating new user for:', piUserData.uid);
            user = new User_1.default({
                user_uid: piUserData.uid,
                piUsername: piUserData.username,
                from_address: piUserData.wallet_address || null,
                role: 'reader',
                piAccessToken: accessToken,
                piAuthenticatedAt: currentTime,
                piAppId: piUserData.app_id,
                piCredentials: piUserData.credentials,
                piReceivingEmail: piUserData.receiving_email,
            });
            try {
                await user.save();
                console.log('✅ New user created successfully');
            }
            catch (saveError) {
                console.error('❌ Failed to save new user:', saveError);
                throw saveError;
            }
        }
        const userResponse = {
            uid: user.user_uid,
            username: user.piUsername,
            wallet_address: user.from_address,
            authenticated_at: user.piAuthenticatedAt,
            role: user.role,
            _id: user._id,
            app_id: user.get('piAppId'),
            credentials: user.get('piCredentials'),
            receiving_email: user.get('piReceivingEmail')
        };
        console.log('✅ Returning user response:', userResponse);
        return res.json({
            success: true,
            user: userResponse
        });
    }
    catch (error) {
        console.error('❌ Token verification error:', error);
        return res.status(500).json({
            success: false,
            message: `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }
});
router.post('/user', async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Access token is required'
            });
        }
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
        const piUserData = await response.json();
        const user = await User_1.default.findOne({ user_uid: piUserData.uid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
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
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get user data'
        });
    }
});
router.post('/auth/logout', async (req, res) => {
    try {
        return res.json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            error: 'Logout failed'
        });
    }
});
router.get('/payments/incomplete', async (req, res) => {
    try {
        const piService = (0, pi_network_1.getPiNetworkService)();
        const payments = await piService.getIncompleteServerPayments();
        return res.json({
            success: true,
            incompletePayments: payments,
        });
    }
    catch (error) {
        console.error('Get incomplete payments error:', error?.response?.data || error);
        return res.status(500).json({
            error: 'Failed to get incomplete payments',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
router.get('/payments/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        if (!paymentId) {
            return res.status(400).json({
                error: 'Payment ID is required'
            });
        }
        console.log(`🔍 Getting payment details for: ${paymentId}`);
        const piService = (0, pi_network_1.getPiNetworkService)();
        const payment = await piService.getPayment(paymentId);
        return res.json({
            success: true,
            paymentId,
            payment
        });
    }
    catch (error) {
        console.error('Get payment error:', error);
        if (error instanceof PiPaymentErrors_1.PiPaymentError) {
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
router.post('/payments/approve', async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) {
            return res.status(400).json({ error: 'Payment ID is required' });
        }
        console.log(`📝 Approving payment: ${paymentId}`);
        const piService = (0, pi_network_1.getPiNetworkService)();
        await piService.approvePayment(paymentId);
        console.log(`✅ Payment ${paymentId} approved`);
        return res.json({ success: true, paymentId, approved: true });
    }
    catch (error) {
        console.error('Payment approval error:', error?.response?.data || error);
        return res.status(500).json({
            error: 'Payment approval failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/payments/complete', async (req, res) => {
    try {
        const { paymentId, txid, listingData, listingType } = req.body;
        if (!paymentId || !txid) {
            return res.status(400).json({
                error: 'Payment ID and transaction ID are required'
            });
        }
        const piService = (0, pi_network_1.getPiNetworkService)();
        try {
            await piService.completePayment(paymentId, txid);
        }
        catch (error) {
            if (error.response?.data?.error === 'already_completed') {
                console.warn(`Payment ${paymentId} already completed - continuing with listing creation`);
            }
            else {
                throw error;
            }
        }
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
            if (!userId || !mongoose_1.default.Types.ObjectId.isValid(String(userId))) {
                throw new Error('oracle_api requires listingData.userId (Mongo ObjectId string)');
            }
            const plain = generateOracleApiKey();
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            const user = await User_1.default.findById(userId);
            const keyDoc = new ApiKey({
                keyHash: hashOracleApiKey(plain),
                keyPrefix: plain.slice(0, 12),
                userId,
                piUid: user?.user_uid,
                name: name || 'Oracle API Key',
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
        if (listingType === 'topup_credits') {
            const ApiKey = require('../zyrachain-lib/lib/models/ApiKey').default;
            const { keyId, amount } = listingData || {};
            if (!keyId || !mongoose_1.default.Types.ObjectId.isValid(String(keyId))) {
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
    }
    catch (error) {
        console.error('Payment completion error:', error);
        if (error instanceof PiPaymentErrors_1.PiPaymentError) {
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
router.post('/payments/cancel', async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) {
            return res.status(400).json({
                error: 'Payment ID is required'
            });
        }
        const piService = (0, pi_network_1.getPiNetworkService)();
        await piService.cancelPayment(paymentId);
        return res.json({
            success: true,
            message: 'Payment cancelled successfully'
        });
    }
    catch (error) {
        console.error('Payment cancellation error:', error);
        if (error instanceof PiPaymentErrors_1.PiPaymentError) {
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
router.get('/payments/config/:listingType', async (req, res) => {
    try {
        const { listingType } = req.params;
        const piService = (0, pi_network_1.getPiNetworkService)();
        let amount;
        let memo;
        try {
            const paymentConfig = piService.getListingPayment(listingType, 'temp-user', {});
            amount = paymentConfig.amount;
            memo = paymentConfig.memo;
        }
        catch {
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
    }
    catch (error) {
        console.error('Payment config error:', error);
        return res.status(500).json({
            error: 'Failed to get payment configuration'
        });
    }
});
exports.default = router;
//# sourceMappingURL=pi.js.map