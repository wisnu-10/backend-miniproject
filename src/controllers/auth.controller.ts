import { Request, Response } from "express";
import {
  register as registerService,
  login as loginService,
} from "../services/auth.services";
import { UserRole } from "../generated/prisma/client";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, role, referral_code, phone_number } =
      req.body;

    if (!email || !password || !full_name || !role) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ message: "Invalid role" });
      return;
    }

    const user = await registerService({
      email,
      password,
      full_name,
      phone_number,
      role,
      referral_code,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        referral_code: user.referral_code,
      },
    });
  } catch (error: any) {
    // Handle specific errors like "User already exists" or "Invalid referral code"
    if (
      error.message === "User already exists" ||
      error.message === "Invalid referral code"
    ) {
      res.status(400).json({ message: error.message });
      return;
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const { user, token } = await loginService({ email, password });

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token, // Optional: send token in body if needed for non-browser clients
    });
  } catch (error: any) {
    if (error.message === "Invalid email or password") {
      res.status(401).json({ message: error.message });
      return;
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};
