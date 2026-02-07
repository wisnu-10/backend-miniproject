import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getMyCoupons,
  validateMyCoupon,
} from "../controllers/coupon.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's coupons
router.get("/", getMyCoupons);

// Validate a coupon code
router.get("/validate/:code", validateMyCoupon);

export default router;
