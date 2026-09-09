export declare const ALLOWED_ADMIN_EMAILS: string[];
export declare const sendOTPEmail: (email: string, otp: string, role: string) => Promise<import("nodemailer/lib/smtp-transport").SentMessageInfo>;
export declare const isValidAdminEmail: (email: string) => boolean;
//# sourceMappingURL=email-service.d.ts.map