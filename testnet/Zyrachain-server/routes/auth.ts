import express, { Request, Response, Router } from 'express';
import User from '../zyrachain-lib/lib/models/User';
import VerificationCode from '../zyrachain-lib/lib/models/VerificationCode';
import jwt from 'jsonwebtoken';

const router: Router = express.Router();

// Verify user token/session
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token, email, code } = req.body;

    if (token) {
      // Verify JWT token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        return res.json({ 
          valid: true, 
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            walletAddress: user.walletAddress,
            status: user.status
          }
        });
      } catch (jwtError) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (email && code) {
      // Verify email verification code
      const verification = await VerificationCode.findOne({
        email,
        code,
        type: 'email_verification',
        expiresAt: { $gt: new Date() },
        used: false
      });

      if (!verification) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
      }

      // Mark verification as used
      verification.used = true;
      await verification.save();

      // Update user as verified
      const user = await User.findOneAndUpdate(
        { email },
        { emailVerified: true, status: 'active' },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({ 
        success: true, 
        message: 'Email verified successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          walletAddress: user.walletAddress,
          status: user.status
        }
      });
    }

    return res.status(400).json({ error: 'Token or email/code required' });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// Generate verification code
router.post('/generate-code', async (req: Request, res: Response) => {
  try {
    const { email, type = 'email_verification' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create verification code record
    await VerificationCode.create({
      email,
      code,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // In production, you would send this code via email
    // For now, we'll just return success
    return res.json({ 
      success: true, 
      message: 'Verification code sent to email'
    });
  } catch (error) {
    console.error('Error generating verification code:', error);
    return res.status(500).json({ error: 'Failed to generate verification code' });
  }
});

export default router;
