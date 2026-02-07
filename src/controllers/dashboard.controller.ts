import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as dashboardService from "../services/dashboard.service";

// Get organizer dashboard overview (ORGANIZER only)
export const getDashboard = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const dashboard = await dashboardService.getOrganizerDashboard(userId);

    res.status(200).json({
      message: "Dashboard overview retrieved successfully",
      data: dashboard,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to fetch dashboard",
    });
  }
};

// Get event statistics by time period (ORGANIZER only)
export const getStatistics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Parse query parameters
    const year = req.query.year
      ? parseInt(req.query.year as string)
      : undefined;
    const month = req.query.month
      ? parseInt(req.query.month as string)
      : undefined;

    // Validate month requires year
    if (month && !year) {
      res
        .status(400)
        .json({ message: "Year is required when specifying month" });
      return;
    }

    // Validate month range
    if (month && (month < 1 || month > 12)) {
      res.status(400).json({ message: "Month must be between 1 and 12" });
      return;
    }

    const statistics = await dashboardService.getEventStatistics(userId, {
      year,
      month,
    });

    res.status(200).json({
      message: "Statistics retrieved successfully",
      data: statistics,
      filters: {
        year,
        month,
        grouping: year && month ? "daily" : year ? "monthly" : "yearly",
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to fetch statistics",
    });
  }
};

// Get revenue breakdown report (ORGANIZER only)
export const getRevenueReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Parse query parameters
    const year = req.query.year
      ? parseInt(req.query.year as string)
      : undefined;
    const month = req.query.month
      ? parseInt(req.query.month as string)
      : undefined;
    const event_id = req.query.event_id as string | undefined;

    // Validate month requires year
    if (month && !year) {
      res
        .status(400)
        .json({ message: "Year is required when specifying month" });
      return;
    }

    const report = await dashboardService.getRevenueReport(userId, {
      year,
      month,
      event_id,
    });

    res.status(200).json({
      message: "Revenue report retrieved successfully",
      data: report,
      filters: {
        year,
        month,
        event_id,
      },
    });
  } catch (error) {
    console.error("Error fetching revenue report:", error);
    res.status(500).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch revenue report",
    });
  }
};
