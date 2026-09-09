"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidAdminEmail = exports.sendOTPEmail = exports.ALLOWED_ADMIN_EMAILS = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
exports.ALLOWED_ADMIN_EMAILS = [
    'zyrachains@gmail.com',
];
const createTransporter = () => {
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};
const sendOTPEmail = async (email, otp, role) => {
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
    }
    catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw error;
    }
};
exports.sendOTPEmail = sendOTPEmail;
const isValidAdminEmail = (email) => {
    return exports.ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase());
};
exports.isValidAdminEmail = isValidAdminEmail;
//# sourceMappingURL=email-service.js.map