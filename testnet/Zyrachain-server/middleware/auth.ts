import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

// Admin user UIDs (Pi Network user IDs)
const ADMIN_USER_UIDS = [
  // Add your Pi Network user UIDs here
  'd0b3fc20-faf3-4897-a7f4-1e2a1a0fa0b1' // junman140
];

export interface AuthenticatedRequest extends Request {
  user?: any;
  adminUser?: any;
}

// Middleware to authenticate admin users via JWT only
export const authenticateAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token (admin app uses email-based auth only)
    try {
      console.log('🔍 Attempting JWT verification...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin-secret') as any;
      console.log('✅ JWT verification successful:', { adminId: decoded.adminId, email: decoded.email, role: decoded.role });
      req.adminUser = decoded;
      return next();
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown error');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid JWT token' 
      });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

// Middleware to check if user is authenticated (for regular users)
export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify Pi Network token
    const piApiBaseUrl =
      serverPiConfig.PI_BACKEND_PLATFORM_BASE_URL ||
      (process.env.PI_ENV === 'sandbox' || process.env.PI_SANDBOX_MODE === 'true'
        ? 'https://api.testnet.minepi.com'
        : 'https://api.minepi.com');

    const piResponse = await fetch(`${piApiBaseUrl}/v2/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!piResponse.ok) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid Pi Network token' 
      });
    }

    const piUserData = await piResponse.json() as PiApiResponse;
    
    // Find or create user in our database
    let user = await User.findOne({ user_uid: piUserData.uid });

    if (!user) {
      // Reuse a record already keyed on the same Pi username (different uid)
      if (piUserData.username) {
        user = await User.findOne({ piUsername: piUserData.username });
      }
    }

    if (!user) {
      user = new User({
        user_uid: piUserData.uid,
        piUsername: piUserData.username,
        role: 'reader',
        piAccessToken: token,
        piAuthenticatedAt: new Date()
      });
      await user.save();
    } else {
      user.user_uid = piUserData.uid;
      user.piUsername = piUserData.username;
      user.piAccessToken = token;
      user.piAuthenticatedAt = new Date();
      await user.save();
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error('User authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
}; 