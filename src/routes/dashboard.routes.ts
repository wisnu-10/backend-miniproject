import { Router } from "express";
import {
  getDashboard,
  getStatistics,
  getRevenueReport,
} from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All dashboard routes require ORGANIZER role
router.use(authenticate, authorize(["ORGANIZER"]));

// GET /api/dashboard/overview - Get dashboard summary
router.get("/overview", getDashboard);

// GET /api/dashboard/statistics - Get event statistics by time period
// Query params: year, month
router.get("/statistics", getStatistics);

// GET /api/dashboard/revenue - Get revenue breakdown report
// Query params: year, month, event_id
router.get("/revenue", getRevenueReport);

export default router;
