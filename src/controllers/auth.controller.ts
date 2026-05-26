import { Request, Response } from "express";
import {
  register as registerService,
  login as loginService,
} from "../services/auth.services";
import { UserRole } from "@prisma/client";
import { BadRequestError } from "../utils/errors";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name, role, referral_code, phone_number } =
    req.body;

  if (!email || !password || !full_name || !role) {
    throw new BadRequestError("Missing required fields");
  }

  if (!Object.values(UserRole).includes(role)) {
    throw new BadRequestError("Invalid role");
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
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  const { user, token } = await loginService({ email, password, role });

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
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};
