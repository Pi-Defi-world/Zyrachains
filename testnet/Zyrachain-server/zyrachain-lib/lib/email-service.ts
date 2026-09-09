import nodemailer from 'nodemailer';

// Allowed admin emails
export const ALLOWED_ADMIN_EMAILS = [
  'zyrachains@gmail.com',
];

// Email transporter configuration
const createTransporter = () => {
  // Use existing SMTP configuration from environment variables
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export const sendOTPEmail = async (email: string, otp: string, role: string) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: `Zyrachain Admin Access - OTP Code`,
      text: `Your OTP code for admin access is: ${otp}\n\nThis code will expire in 10 minutes.\n\nRole: ${role}\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Zyrachain Admin Access</h2>
          <p>Your OTP code for admin access is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #16a34a; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>Role:</strong> ${role}</p>
          <p><strong>Expires in:</strong> 10 minutes</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully to:', email);
    return result;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

export const isValidAdminEmail = (email: string): boolean => {
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
}; 