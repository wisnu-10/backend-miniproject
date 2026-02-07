import prisma from "../config/prisma-client.config";
import bcrypt from "bcrypt";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.config";
import { sendPasswordResetEmail } from "../config/nodemailer.config";

const SALT_ROUNDS = 10;

/**
 * Get user profile
 */
export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone_number: true,
      profile_picture: true,
      role: true,
      referral_code: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Update user profile (full_name, phone_number)
 */
export const updateProfile = async (
  userId: string,
  data: { full_name?: string; phone_number?: string },
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      full_name: data.full_name,
      phone_number: data.phone_number,
    },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone_number: true,
      profile_picture: true,
      role: true,
      referral_code: true,
      updated_at: true,
    },
  });

  return user;
};

/**
 * Upload profile picture to Cloudinary and update user
 */
export const updateProfilePicture = async (
  userId: string,
  file: Express.Multer.File,
) => {
  // Upload to Cloudinary
  const uploadResult = await new Promise<{ secure_url: string }>(
    (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "profile_pictures",
          public_id: `user_${userId}_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        },
      );
      uploadStream.end(file.buffer);
    },
  );

  // Update user with new profile picture URL
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profile_picture: uploadResult.secure_url },
    select: {
      id: true,
      email: true,
      full_name: true,
      profile_picture: true,
    },
  });

  return user;
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully" };
};

/**
 * Request password reset - generates token and sends email
 */
export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    // Don't reveal if email exists for security
    return { message: "If the email exists, a reset link has been sent" };
  }

  // Delete any existing reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { user_id: user.id },
  });

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

  // Save token to database
  await prisma.passwordResetToken.create({
    data: {
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
    },
  });

  // Send email
  await sendPasswordResetEmail(user.email, resetToken);

  return { message: "If the email exists, a reset link has been sent" };
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true } } },
  });

  if (!resetToken) {
    throw new Error("Invalid or expired reset token");
  }

  if (resetToken.expires_at < new Date()) {
    // Clean up expired token
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    throw new Error("Reset token has expired");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password and delete token in transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ]);

  return { message: "Password reset successfully" };
};
