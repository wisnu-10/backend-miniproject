import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getMyPoints,
  getMyPointsHistory,
} from "../controllers/point.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get points balance
router.get("/", getMyPoints);

// Get points history
router.get("/history", getMyPointsHistory);

export default router;
