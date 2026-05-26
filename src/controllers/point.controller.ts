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
  const pointsData = await getPointsBalance(req.user!.id);
  res.status(200).json(pointsData);
};

/**
 * Get user's points history (including expired)
 */
export const getMyPointsHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const history = await getPointsHistory(req.user!.id);
  res.status(200).json({ history });
};
