import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getUserCoupons, validateCoupon } from "../services/coupon.service";
import { BadRequestError } from "../utils/errors";

/**
 * Get user's coupons
 */
export const getMyCoupons = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const coupons = await getUserCoupons(req.user!.id);
  res.status(200).json({ coupons });
};

/**
 * Validate a coupon code
 */
export const validateMyCoupon = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { code } = req.params;

  if (!code || typeof code !== "string") {
    throw new BadRequestError("Coupon code is required");
  }

  const coupon = await validateCoupon(code, req.user!.id);
  res.status(200).json({ valid: true, coupon });
};
