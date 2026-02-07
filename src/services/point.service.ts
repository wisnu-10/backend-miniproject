import prisma from "../config/prisma-client.config";

/**
 * Get user's total available (non-expired) points balance
 */
export const getPointsBalance = async (userId: string) => {
  const now = new Date();

  const points = await prisma.point.findMany({
    where: {
      user_id: userId,
      expires_at: { gt: now },
      remaining_amount: { gt: 0 },
    },
    orderBy: { expires_at: "asc" },
  });

  const totalBalance = points.reduce((sum, p) => sum + p.remaining_amount, 0);

  return {
    total_balance: totalBalance,
    points: points.map((p) => ({
      id: p.id,
      amount: p.amount,
      remaining_amount: p.remaining_amount,
      expires_at: p.expires_at,
      created_at: p.created_at,
    })),
  };
};

/**
 * Get all user's points history (including expired)
 */
export const getPointsHistory = async (userId: string) => {
  const now = new Date();

  const points = await prisma.point.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  });

  return points.map((p) => ({
    id: p.id,
    amount: p.amount,
    remaining_amount: p.remaining_amount,
    expires_at: p.expires_at,
    created_at: p.created_at,
    is_expired: p.expires_at < now,
  }));
};

/**
 * Use points (FIFO from oldest non-expired)
 * Returns the amount of points actually used
 */
export const usePoints = async (userId: string, amount: number) => {
  const now = new Date();

  // Get available points, ordered by expiration (oldest first - FIFO)
  const availablePoints = await prisma.point.findMany({
    where: {
      user_id: userId,
      expires_at: { gt: now },
      remaining_amount: { gt: 0 },
    },
    orderBy: { expires_at: "asc" },
  });

  const totalAvailable = availablePoints.reduce(
    (sum, p) => sum + p.remaining_amount,
    0,
  );

  if (totalAvailable < amount) {
    throw new Error(
      `Insufficient points. Available: ${totalAvailable}, Required: ${amount}`,
    );
  }

  let remainingToUse = amount;
  const updates: { id: string; newRemainingAmount: number }[] = [];

  for (const point of availablePoints) {
    if (remainingToUse <= 0) break;

    const useFromThis = Math.min(point.remaining_amount, remainingToUse);
    updates.push({
      id: point.id,
      newRemainingAmount: point.remaining_amount - useFromThis,
    });
    remainingToUse -= useFromThis;
  }

  // Update all points in a transaction
  await prisma.$transaction(
    updates.map((u) =>
      prisma.point.update({
        where: { id: u.id },
        data: { remaining_amount: u.newRemainingAmount },
      }),
    ),
  );

  return { used: amount, remaining_total: totalAvailable - amount };
};
