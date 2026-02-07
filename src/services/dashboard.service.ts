import prisma from "../config/prisma-client.config";
import { TransactionStatus } from "../generated/prisma/client";

// Types for service inputs
interface TimeFilters {
  year?: number;
  month?: number;
}

interface RevenueFilters extends TimeFilters {
  event_id?: string;
}

interface DashboardOverview {
  total_events: number;
  total_transactions: number;
  total_revenue: number;
  pending_confirmations: number;
  upcoming_events: number;
  completed_transactions: number;
}

interface StatisticsItem {
  period: string;
  total_transactions: number;
  total_revenue: number;
  total_tickets_sold: number;
}

interface RevenueByEvent {
  event_id: string;
  event_name: string;
  total_revenue: number;
  total_tickets_sold: number;
  transaction_count: number;
}

// Get organizer dashboard overview statistics
export const getOrganizerDashboard = async (
  organizerId: string,
): Promise<DashboardOverview> => {
  const now = new Date();

  // Get all events for this organizer
  const events = await prisma.event.findMany({
    where: {
      organizer_id: organizerId,
      deleted_at: null,
    },
    select: {
      id: true,
      start_date: true,
    },
  });

  const eventIds = events.map((e) => e.id);

  // Count upcoming events
  const upcomingEvents = events.filter((e) => e.start_date > now).length;

  // Get transaction statistics
  const transactions = await prisma.transaction.findMany({
    where: {
      event_id: { in: eventIds },
    },
    select: {
      status: true,
      final_amount: true,
    },
  });

  const totalTransactions = transactions.length;
  const pendingConfirmations = transactions.filter(
    (t) => t.status === TransactionStatus.WAITING_CONFIRMATION,
  ).length;
  const completedTransactions = transactions.filter(
    (t) => t.status === TransactionStatus.DONE,
  ).length;

  // Calculate total revenue (only from completed transactions)
  const totalRevenue = transactions
    .filter((t) => t.status === TransactionStatus.DONE)
    .reduce((sum, t) => sum + Number(t.final_amount), 0);

  return {
    total_events: events.length,
    total_transactions: totalTransactions,
    total_revenue: totalRevenue,
    pending_confirmations: pendingConfirmations,
    upcoming_events: upcomingEvents,
    completed_transactions: completedTransactions,
  };
};

// Get event statistics by time period (year/month/day)
export const getEventStatistics = async (
  organizerId: string,
  filters: TimeFilters = {},
): Promise<StatisticsItem[]> => {
  const { year, month } = filters;

  // Get all events for this organizer
  const events = await prisma.event.findMany({
    where: {
      organizer_id: organizerId,
      deleted_at: null,
    },
    select: { id: true },
  });

  const eventIds = events.map((e) => e.id);

  // Build date filters
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (year && month) {
    // Get daily statistics for specific month
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
  } else if (year) {
    // Get monthly statistics for specific year
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  }

  // Get completed transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      event_id: { in: eventIds },
      status: TransactionStatus.DONE,
      ...(startDate && endDate
        ? {
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    },
    include: {
      items: true,
    },
  });

  // Group statistics by period
  const statsMap = new Map<string, StatisticsItem>();

  transactions.forEach((t) => {
    const date = new Date(t.created_at);
    let periodKey: string;

    if (year && month) {
      // Group by day
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    } else if (year) {
      // Group by month
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    } else {
      // Group by year
      periodKey = `${date.getFullYear()}`;
    }

    const existing = statsMap.get(periodKey) || {
      period: periodKey,
      total_transactions: 0,
      total_revenue: 0,
      total_tickets_sold: 0,
    };

    existing.total_transactions += 1;
    existing.total_revenue += Number(t.final_amount);
    existing.total_tickets_sold += t.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    statsMap.set(periodKey, existing);
  });

  // Sort by period
  const result = Array.from(statsMap.values()).sort((a, b) =>
    a.period.localeCompare(b.period),
  );

  return result;
};

// Get revenue breakdown report
export const getRevenueReport = async (
  organizerId: string,
  filters: RevenueFilters = {},
): Promise<{
  by_event: RevenueByEvent[];
  total_revenue: number;
  total_tickets_sold: number;
  total_transactions: number;
}> => {
  const { year, month, event_id } = filters;

  // Build date filters
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (year && month) {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
  } else if (year) {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  }

  // Get events for this organizer
  const eventFilter: { organizer_id: string; deleted_at: null; id?: string } = {
    organizer_id: organizerId,
    deleted_at: null,
  };

  if (event_id) {
    eventFilter.id = event_id;
  }

  const events = await prisma.event.findMany({
    where: eventFilter,
    select: { id: true, name: true },
  });

  const eventIds = events.map((e) => e.id);
  const eventNameMap = new Map(events.map((e) => [e.id, e.name]));

  // Get completed transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      event_id: { in: eventIds },
      status: TransactionStatus.DONE,
      ...(startDate && endDate
        ? {
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    },
    include: {
      items: true,
    },
  });

  // Group by event
  const eventStatsMap = new Map<string, RevenueByEvent>();

  transactions.forEach((t) => {
    const existing = eventStatsMap.get(t.event_id) || {
      event_id: t.event_id,
      event_name: eventNameMap.get(t.event_id) || "Unknown",
      total_revenue: 0,
      total_tickets_sold: 0,
      transaction_count: 0,
    };

    existing.total_revenue += Number(t.final_amount);
    existing.total_tickets_sold += t.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    existing.transaction_count += 1;

    eventStatsMap.set(t.event_id, existing);
  });

  const byEvent = Array.from(eventStatsMap.values()).sort(
    (a, b) => b.total_revenue - a.total_revenue,
  );

  // Calculate totals
  const totalRevenue = byEvent.reduce((sum, e) => sum + e.total_revenue, 0);
  const totalTicketsSold = byEvent.reduce(
    (sum, e) => sum + e.total_tickets_sold,
    0,
  );
  const totalTransactions = byEvent.reduce(
    (sum, e) => sum + e.transaction_count,
    0,
  );

  return {
    by_event: byEvent,
    total_revenue: totalRevenue,
    total_tickets_sold: totalTicketsSold,
    total_transactions: totalTransactions,
  };
};
