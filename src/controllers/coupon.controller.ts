import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getUserCoupons, validateCoupon } from "../services/coupon.service";

/**
 * Get user's coupons
 */
export const getMyCoupons = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const coupons = await getUserCoupons(req.user.id);
    res.status(200).json({ coupons });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Validate a coupon code
 */
export const validateMyCoupon = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { code } = req.params;

    if (!code || typeof code !== "string") {
      res.status(400).json({ message: "Coupon code is required" });
      return;
    }

    const coupon = await validateCoupon(code, req.user.id);
    res.status(200).json({ valid: true, coupon });
  } catch (error: any) {
    res.status(400).json({ valid: false, message: error.message });
  }
};
