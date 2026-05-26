export const getPasswordResetTemplate = (resetUrl: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You have requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" 
         style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
        Reset Password
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p style="color: #666; font-size: 12px;">
        This link will expire in 1 hour. If you did not request a password reset, 
        please ignore this email.
      </p>
    </div>
  `;
};
