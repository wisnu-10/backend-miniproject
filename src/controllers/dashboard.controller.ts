import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as dashboardService from "../services/dashboard.service";
import { BadRequestError } from "../utils/errors";

// Get organizer dashboard overview (ORGANIZER only)
export const getDashboard = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const dashboard = await dashboardService.getOrganizerDashboard(req.user!.id);

  res.status(200).json({
    message: "Dashboard overview retrieved successfully",
    data: dashboard,
  });
};

// Get event statistics by time period (ORGANIZER only)
export const getStatistics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  // Parse query parameters
  const year = req.query.year
    ? parseInt(req.query.year as string)
    : undefined;
  const month = req.query.month
    ? parseInt(req.query.month as string)
    : undefined;

  // Validate month requires year
  if (month && !year) {
    throw new BadRequestError("Year is required when specifying month");
  }

  // Validate month range
  if (month && (month < 1 || month > 12)) {
    throw new BadRequestError("Month must be between 1 and 12");
  }

  const statistics = await dashboardService.getEventStatistics(req.user!.id, {
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
};

// Get revenue breakdown report (ORGANIZER only)
export const getRevenueReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
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
    throw new BadRequestError("Year is required when specifying month");
  }

  const report = await dashboardService.getRevenueReport(req.user!.id, {
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
};
