import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  getProfile,
  updateProfile,
  updateProfilePicture,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../services/profile.service";
import { BadRequestError } from "../utils/errors";

/**
 * Get user profile
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const profile = await getProfile(req.user!.id);
  res.status(200).json({ profile });
};

/**
 * Update user profile
 */
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { full_name, phone_number } = req.body;

  if (!full_name && !phone_number) {
    throw new BadRequestError("No fields to update");
  }

  const profile = await updateProfile(req.user!.id, {
    full_name,
    phone_number,
  });
  res.status(200).json({ message: "Profile updated successfully", profile });
};

/**
 * Update profile picture
 */
export const updateMyProfilePicture = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  if (!req.file) {
    throw new BadRequestError("No image file provided");
  }

  const profile = await updateProfilePicture(req.user!.id, req.file);
  res
    .status(200)
    .json({ message: "Profile picture updated successfully", profile });
};

/**
 * Change password (authenticated user)
 */
export const changeMyPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { old_password, new_password } = req.body;

  if (!old_password || !new_password) {
    throw new BadRequestError("Old password and new password are required");
  }

  if (new_password.length < 6) {
    throw new BadRequestError("New password must be at least 6 characters");
  }

  const result = await changePassword(
    req.user!.id,
    old_password,
    new_password,
  );
  res.status(200).json(result);
};

/**
 * Forgot password - send reset email
 */
export const forgotPasswordHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Email is required");
  }

  const result = await forgotPassword(email);
  res.status(200).json(result);
};

/**
 * Reset password with token
 */
export const resetPasswordHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    throw new BadRequestError("Token and new password are required");
  }

  if (new_password.length < 6) {
    throw new BadRequestError("New password must be at least 6 characters");
  }

  const result = await resetPassword(token, new_password);
  res.status(200).json(result);
};
