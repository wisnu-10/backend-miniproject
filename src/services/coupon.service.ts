import prisma from "../config/prisma-client.config";
import { generateReferralCode } from "../utils/referral";

/**
 * Get all user's coupons
 */
export const getUserCoupons = async (userId: string) => {
  const now = new Date();

  const coupons = await prisma.coupon.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  return coupons.map((c) => ({
    id: c.id,
    code: c.code,
    discount_percentage: c.discount_percentage
      ? Number(c.discount_percentage)
      : null,
    discount_amount: c.discount_amount ? Number(c.discount_amount) : null,
    valid_from: c.valid_from,
    valid_until: c.valid_until,
    is_used: c.is_used,
    is_expired: c.valid_until < now,
    is_valid: !c.is_used && c.valid_until > now && c.valid_from <= now,
    created_at: c.created_at,
  }));
};

/**
 * Validate a coupon for use
 */
export const validateCoupon = async (code: string, userId: string) => {
  const now = new Date();

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  if (coupon.user_id !== userId) {
    throw new Error("This coupon does not belong to you");
  }

  if (coupon.is_used) {
    throw new Error("Coupon has already been used");
  }

  if (coupon.valid_from > now) {
    throw new Error("Coupon is not yet valid");
  }

  if (coupon.valid_until < now) {
    throw new Error("Coupon has expired");
  }

  return {
    id: coupon.id,
    code: coupon.code,
    discount_percentage: coupon.discount_percentage
      ? Number(coupon.discount_percentage)
      : null,
    discount_amount: coupon.discount_amount
      ? Number(coupon.discount_amount)
      : null,
    valid_until: coupon.valid_until,
  };
};

/**
 * Mark a coupon as used
 */
export const markCouponAsUsed = async (couponId: string) => {
  return prisma.coupon.update({
    where: { id: couponId },
    data: { is_used: true },
  });
};

/**
 * Create a referral discount coupon for a user
 */
export const createReferralCoupon = async (
  userId: string,
  discountPercentage: number = 10,
) => {
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  const couponCode = `REF-${generateReferralCode()}`;

  return prisma.coupon.create({
    data: {
      user_id: userId,
      code: couponCode,
      discount_percentage: discountPercentage,
      valid_from: new Date(),
      valid_until: threeMonthsFromNow,
    },
  });
};
