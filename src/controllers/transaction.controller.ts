import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as transactionService from "../services/transaction.service";
import { getParamAsString } from "../utils/params";
import { TransactionStatus } from "../generated/prisma/client";

// Create a new transaction (CUSTOMER only)
export const createTransaction = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const { event_id, items, promotion_code, coupon_code, points_to_use } = req.body;

        const transaction = await transactionService.createTransaction({
            user_id: req.user.id,
            event_id,
            items,
            promotion_code,
            coupon_code,
            points_to_use: points_to_use ? parseInt(points_to_use) : undefined,
        });

        res.status(201).json({
            message: "Transaction created successfully",
            data: transaction,
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("Invalid") ||
            error.message.includes("Insufficient") ||
            error.message.includes("Cannot") ||
            error.message.includes("Not enough")
        ) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Upload payment proof (CUSTOMER only)
export const uploadPaymentProof = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);

        // Check for file upload
        if (!req.file) {
            res.status(400).json({ message: "Payment proof file is required" });
            return;
        }

        const transaction = await transactionService.uploadPaymentProof(
            id,
            req.user.id,
            req.file
        );

        res.status(200).json({
            message: "Payment proof uploaded successfully",
            data: transaction,
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("Cannot") ||
            error.message.includes("expired") ||
            error.message.includes("deadline")
        ) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Cancel transaction (CUSTOMER only)
export const cancelTransaction = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);

        const transaction = await transactionService.cancelTransaction(id, req.user.id);

        res.status(200).json({
            message: "Transaction cancelled successfully",
            data: transaction,
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("Can only")
        ) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get user transactions (CUSTOMER only)
export const getMyTransactions = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

        const filters: transactionService.TransactionFilters = {};

        if (req.query.status) {
            const status = req.query.status as string;
            if (Object.values(TransactionStatus).includes(status as TransactionStatus)) {
                filters.status = status as TransactionStatus;
            }
        }

        if (req.query.date_from) {
            filters.date_from = new Date(req.query.date_from as string);
        }

        if (req.query.date_to) {
            filters.date_to = new Date(req.query.date_to as string);
        }

        const result = await transactionService.getUserTransactions(
            req.user.id,
            filters,
            { page, limit }
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get transaction by ID (CUSTOMER only)
export const getTransactionById = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);

        const transaction = await transactionService.getTransactionById(id, req.user.id);

        res.status(200).json({
            data: transaction,
        });
    } catch (error: any) {
        if (error.message === "Transaction not found") {
            res.status(404).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get organizer transactions (ORGANIZER only)
export const getOrganizerTransactions = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

        const filters: transactionService.TransactionFilters & { event_id?: string } = {};

        if (req.query.event_id) {
            filters.event_id = req.query.event_id as string;
        }

        if (req.query.status) {
            const status = req.query.status as string;
            if (Object.values(TransactionStatus).includes(status as TransactionStatus)) {
                filters.status = status as TransactionStatus;
            }
        }

        if (req.query.date_from) {
            filters.date_from = new Date(req.query.date_from as string);
        }

        if (req.query.date_to) {
            filters.date_to = new Date(req.query.date_to as string);
        }

        const result = await transactionService.getOrganizerTransactions(
            req.user.id,
            filters,
            { page, limit }
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Update transaction status - accept/reject (ORGANIZER only)
export const updateTransactionStatus = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const id = getParamAsString(req.params.id);
        const { status, rejection_reason } = req.body;

        const transaction = await transactionService.updateTransactionStatus(
            id,
            req.user.id,
            status,
            rejection_reason
        );

        res.status(200).json({
            message: `Transaction ${status === "DONE" ? "accepted" : "rejected"} successfully`,
            data: transaction,
        });
    } catch (error: any) {
        if (
            error.message.includes("not found") ||
            error.message.includes("permission") ||
            error.message.includes("Can only")
        ) {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Manual trigger for expiring unpaid transactions (for testing/admin)
export const expireUnpaidTransactions = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const result = await transactionService.expireUnpaidTransactions();
        res.status(200).json({
            message: "Expired transactions processed",
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Manual trigger for cancelling stale transactions (for testing/admin)
export const cancelStaleTransactions = async (
    _req: Request,
    res: Response
): Promise<void> => {
    try {
        const result = await transactionService.cancelStaleTransactions();
        res.status(200).json({
            message: "Stale transactions cancelled",
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
