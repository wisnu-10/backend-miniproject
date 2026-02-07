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
  let referrer: { id: string } | null = null;
  if (referral_code) {
    referrer = await prisma.user.findUnique({
      where: { referral_code },
      select: { id: true },
    });
    if (!referrer) {
      throw new Error("Invalid referral code");
    }
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

  // Calculate 3 months from now for expiration
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  // Create user with referral rewards in a transaction
  const newUser = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        full_name,
        phone_number,
        role,
        referral_code: newReferralCode,
        referred_by: referrer?.id || null,
      },
    });

    // If user registered with a referral code, create rewards
    if (referrer) {
      // Create 10% discount coupon for new user (valid for 3 months)
      const couponCode = `REF-${generateReferralCode()}`;
      await tx.coupon.create({
        data: {
          user_id: user.id,
          code: couponCode,
          discount_percentage: 10, // 10% discount
          valid_from: new Date(),
          valid_until: threeMonthsFromNow,
        },
      });

      // Add 10,000 points to referrer (expires in 3 months)
      await tx.point.create({
        data: {
          user_id: referrer.id,
          amount: 10000,
          remaining_amount: 10000,
          expires_at: threeMonthsFromNow,
        },
      });
    }

    return user;
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
