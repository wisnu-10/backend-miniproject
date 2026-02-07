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

/**
 * Get user profile
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const profile = await getProfile(req.user.id);
    res.status(200).json({ profile });
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Update user profile
 */
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { full_name, phone_number } = req.body;

    if (!full_name && !phone_number) {
      res.status(400).json({ message: "No fields to update" });
      return;
    }

    const profile = await updateProfile(req.user.id, {
      full_name,
      phone_number,
    });
    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Update profile picture
 */
export const updateMyProfilePicture = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "No image file provided" });
      return;
    }

    const profile = await updateProfilePicture(req.user.id, req.file);
    res
      .status(200)
      .json({ message: "Profile picture updated successfully", profile });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Change password (authenticated user)
 */
export const changeMyPassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      res
        .status(400)
        .json({ message: "Old password and new password are required" });
      return;
    }

    if (new_password.length < 6) {
      res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
      return;
    }

    const result = await changePassword(
      req.user.id,
      old_password,
      new_password,
    );
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "Current password is incorrect") {
      res.status(400).json({ message: error.message });
      return;
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Forgot password - send reset email
 */
export const forgotPasswordHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const result = await forgotPassword(email);
    res.status(200).json(result);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Reset password with token
 */
export const resetPasswordHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      res.status(400).json({ message: "Token and new password are required" });
      return;
    }

    if (new_password.length < 6) {
      res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
      return;
    }

    const result = await resetPassword(token, new_password);
    res.status(200).json(result);
  } catch (error: any) {
    if (
      error.message === "Invalid or expired reset token" ||
      error.message === "Reset token has expired"
    ) {
      res.status(400).json({ message: error.message });
      return;
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
