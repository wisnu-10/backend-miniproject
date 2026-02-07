import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getPointsBalance, getPointsHistory } from "../services/point.service";

/**
 * Get user's points balance and details
 */
export const getMyPoints = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const pointsData = await getPointsBalance(req.user.id);
    res.status(200).json(pointsData);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Get user's points history (including expired)
 */
export const getMyPointsHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const history = await getPointsHistory(req.user.id);
    res.status(200).json({ history });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
