import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import AdminCredentials from '../zyrachain-lib/lib/models/AdminCredentials';
import AdminActivity from '../zyrachain-lib/lib/models/AdminActivity';
import OTP from '../zyrachain-lib/lib/models/OTP';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth';
import { sendOTPEmail, isValidAdminEmail } from '../zyrachain-lib/lib/email-service';
import mongoose from 'mongoose';

const router: Router = express.Router();

// OTP-based admin authentication
router.post('/auth', async (req: Request, res: Response) => {
  try {
    const { email, role, otp } = req.body;
    const clientIP = req.headers['x-client-ip'] as string || req.ip || 'unknown';

    console.log('🔐 Admin auth request:', { email, role, hasOTP: !!otp });

    // Step 1: Request OTP
    if (!otp) {
      if (!email || !role) {
        return res.status(400).json({
          success: false,
          message: 'Email and role are required'
        });
      }

      // Validate email is in allowed list
      if (!isValidAdminEmail(email)) {
        console.log('❌ Invalid admin email:', email);
        return res.status(401).json({
          success: false,
          message: 'Email not authorized for admin access'
        });
      }

      // Validate role
      const validRoles = ['super_admin', 'admin', 'editor_admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be: super_admin, admin, or editor_admin'
        });
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Save OTP to database
      const savedOTP = await OTP.create({
        email: email.toLowerCase(),
        otp: otpCode,
        role,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });
      
      console.log('✅ OTP saved:', { email: savedOTP.email, otp: savedOTP.otp, role: savedOTP.role });

      // Send OTP email
      try {
      await sendOTPEmail(email, otpCode, role);
      } catch (emailError) {
        console.error('❌ Failed to send OTP email:', emailError);
        // Don't fail the OTP creation if email fails
        // The OTP is still saved and can be used
      }

      // Log OTP request using the correct model structure
      try {
        await AdminActivity.create({
          adminUser: {
            username: email.split('@')[0],
            email: email.toLowerCase(),
            role: role
          },
          action: 'OTP requested for admin login',
          actionType: 'login',
          targetType: 'auth',
          details: { email, role },
          ipAddress: clientIP,
          success: true
        });
      } catch (logError) {
        console.warn('Failed to log admin activity:', logError);
        // Don't fail the main operation if logging fails
      }

      return res.json({
        success: true,
        message: 'OTP sent to your email',
        requiresOTP: true
      });
    }

    // Step 2: Verify OTP and login
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find valid OTP
    console.log('🔍 Looking for OTP:', { email: email.toLowerCase(), otp, used: false });
    
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      console.log('❌ Invalid or expired OTP for:', email);
      
      // Debug: Check what OTPs exist for this email
      const allOtpsForEmail = await OTP.find({ email: email.toLowerCase() });
      console.log('🔍 All OTPs for email:', allOtpsForEmail);
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    // Create or update admin credentials
    let admin = await AdminCredentials.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      // Generate a random password for OTP-based authentication
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      admin = await AdminCredentials.create({
        email: email.toLowerCase(),
        username: email.split('@')[0],
        password: randomPassword, // Required by schema but not used for OTP auth
        role: otpRecord.role,
        isActive: true,
        permissions: getDefaultPermissions(otpRecord.role)
      });
    } else {
      // Update role if changed
      admin.role = otpRecord.role;
      admin.permissions = getDefaultPermissions(otpRecord.role);
      admin.lastLoginAt = new Date();
      await admin.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      process.env.JWT_SECRET || 'admin-secret',
      { expiresIn: '24h' }
    );

    // Log successful login using the correct model structure
    try {
      await AdminActivity.create({
        adminUser: {
          username: admin.username,
          email: admin.email,
          role: admin.role
        },
        action: 'Admin login successful via OTP',
        actionType: 'login',
        targetType: 'auth',
        details: { email, role: otpRecord.role },
        ipAddress: clientIP,
        success: true
      });
    } catch (logError) {
      console.warn('Failed to log admin activity:', logError);
      // Don't fail the main operation if logging fails
    }

    console.log('✅ Admin login successful:', email);

    return res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin auth check route
router.get('/auth/check', authenticateAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 Auth check - adminUser:', req.adminUser);
    
    const admin = await AdminCredentials.findById(req.adminUser?.adminId);
    console.log('🔍 Found admin:', admin ? { id: admin._id, email: admin.email, isActive: admin.isActive } : 'null');
    
    if (!admin || !admin.isActive) {
      console.log('❌ Auth check failed - admin not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive admin account'
      });
    }

    console.log('✅ Auth check successful for:', admin.email);
    return res.json({
      success: true,
      user: {
        id: admin._id,
        name: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to get default permissions based on role
function getDefaultPermissions(role: string): string[] {
  switch (role) {
    case 'super_admin':
      return [
        'manage_users',
        'manage_blog',
        'manage_ip_addresses',
        'view_analytics',
        'view_activity_logs',
        'manage_system_settings',
        'manage_revenue',
        'create_admins',
        'delete_users',
        'manage_permissions'
      ];
    case 'admin':
      return [
        'manage_users',
        'manage_blog',
        'manage_ip_addresses',
        'view_analytics',
        'view_activity_logs',
        'manage_system_settings',
        'manage_revenue'
      ];
    case 'editor_admin':
      return [
        'manage_blog',
        'view_analytics',
        'view_activity_logs'
      ];
    default:
      return [];
  }
}

// Address Management Endpoints
router.get('/addresses/generated', authenticateAdmin, async (req, res) => {
  try {
    const addresses = await mongoose.connection.collection('generated-addresses')
      .find({}).sort({ createdAt: -1 }).toArray();

    return res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Error fetching generated addresses:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/addresses/cex', authenticateAdmin, async (req, res) => {
  try {
    const addresses = await mongoose.connection.collection('cex-addresses')
      .find({}).sort({ createdAt: -1 }).toArray();

    return res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Error fetching CEX addresses:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/addresses/core-team', authenticateAdmin, async (req, res) => {
  try {
    const addresses = await mongoose.connection.collection('core-team-addresses')
      .find({}).sort({ createdAt: -1 }).toArray();

    return res.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Error fetching core team addresses:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router; 