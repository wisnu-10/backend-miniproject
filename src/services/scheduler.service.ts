import * as transactionService from "./transaction.service";

// Interval references for cleanup
let expireIntervalId: NodeJS.Timeout | null = null;
let cancelIntervalId: NodeJS.Timeout | null = null;

/**
 * Start the transaction scheduler
 * - Runs expireUnpaidTransactions every 5 minutes
 * - Runs cancelStaleTransactions every hour
 */
export const startScheduler = () => {
    console.log("[Scheduler] Starting transaction scheduler...");

    // Run immediately on start
    runExpireUnpaid();
    runCancelStale();

    // Schedule recurring jobs
    // Expire unpaid transactions every 5 minutes
    expireIntervalId = setInterval(runExpireUnpaid, 5 * 60 * 1000);

    // Cancel stale transactions every hour
    cancelIntervalId = setInterval(runCancelStale, 60 * 60 * 1000);

    console.log("[Scheduler] Transaction scheduler started successfully");
};

/**
 * Stop the scheduler (useful for graceful shutdown)
 */
export const stopScheduler = () => {
    if (expireIntervalId) {
        clearInterval(expireIntervalId);
        expireIntervalId = null;
    }
    if (cancelIntervalId) {
        clearInterval(cancelIntervalId);
        cancelIntervalId = null;
    }
    console.log("[Scheduler] Transaction scheduler stopped");
};

/**
 * Run the expire unpaid transactions job
 */
const runExpireUnpaid = async () => {
    try {
        const result = await transactionService.expireUnpaidTransactions();
        if (result.expired_count > 0) {
            console.log(`[Scheduler] Expired ${result.expired_count} unpaid transactions`);
        }
    } catch (error) {
        console.error("[Scheduler] Error expiring unpaid transactions:", error);
    }
};

/**
 * Run the cancel stale transactions job
 */
const runCancelStale = async () => {
    try {
        const result = await transactionService.cancelStaleTransactions();
        if (result.cancelled_count > 0) {
            console.log(`[Scheduler] Cancelled ${result.cancelled_count} stale transactions`);
        }
    } catch (error) {
        console.error("[Scheduler] Error cancelling stale transactions:", error);
    }
};
