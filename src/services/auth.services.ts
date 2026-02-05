import prisma from "../config/prisma-client.config";
import { UserRole } from "../generated/prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateReferralCode } from "../utils/referral";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const register = async (data: {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  referral_code?: string;
}) => {
  const { email, password, full_name, phone_number, role, referral_code } =
    data;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  // Validate referral code if provided
  let referredByUserId: string | null = null;
  if (referral_code) {
    const referrer = await prisma.user.findUnique({
      where: { referral_code },
    });
    if (!referrer) {
      throw new Error("Invalid referral code");
    }
    referredByUserId = referrer.id;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate unique referral code for new user
  let newReferralCode = generateReferralCode();
  let isUnique = false;
  while (!isUnique) {
    const existing = await prisma.user.findUnique({
      where: { referral_code: newReferralCode },
    });
    if (!existing) {
      isUnique = true;
    } else {
      newReferralCode = generateReferralCode();
    }
  }

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      full_name,
      phone_number,
      role,
      referral_code: newReferralCode,
      referred_by: referredByUserId,
    },
  });

  return newUser;
};

export const login = async (data: { email: string; password: string }) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate Token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  return { user, token };
};
