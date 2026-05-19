import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import * as transactionService from "../services/transaction.service";
import { getParamAsString } from "../utils/params";
import { TransactionStatus } from "../generated/prisma/client";
import { BadRequestError } from "../utils/errors";

// Create a new transaction (CUSTOMER only)
export const createTransaction = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const { event_id, items, promotion_code, coupon_code, points_to_use } = req.body;

    const transaction = await transactionService.createTransaction({
        user_id: req.user!.id,
        event_id,
        items,
        promotion_code,
        coupon_code,
        points_to_use: points_to_use != null ? Number(points_to_use) : undefined,
    });

    res.status(201).json({
        message: "Transaction created successfully",
        data: transaction,
    });
};

// Upload payment proof (CUSTOMER only)
export const uploadPaymentProof = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const id = getParamAsString(req.params.id);

    // Check for file upload
    if (!req.file) {
        throw new BadRequestError("Payment proof file is required");
    }

    const transaction = await transactionService.uploadPaymentProof(
        id,
        req.user!.id,
        req.file
    );

    res.status(200).json({
        message: "Payment proof uploaded successfully",
        data: transaction,
    });
};

// Cancel transaction (CUSTOMER only)
export const cancelTransaction = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const id = getParamAsString(req.params.id);

    const transaction = await transactionService.cancelTransaction(id, req.user!.id);

    res.status(200).json({
        message: "Transaction cancelled successfully",
        data: transaction,
    });
};

// Get user transactions (CUSTOMER only)
export const getMyTransactions = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
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
        req.user!.id,
        filters,
        { page, limit }
    );

    res.status(200).json(result);
};

// Get transaction by ID (CUSTOMER only)
export const getTransactionById = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const id = getParamAsString(req.params.id);

    const transaction = await transactionService.getTransactionById(id, req.user!.id);

    res.status(200).json({
        data: transaction,
    });
};

// Get organizer transactions (ORGANIZER only)
export const getOrganizerTransactions = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
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
        req.user!.id,
        filters,
        { page, limit }
    );

    res.status(200).json(result);
};

// Update transaction status - accept/reject (ORGANIZER only)
export const updateTransactionStatus = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    const id = getParamAsString(req.params.id);
    const { status, rejection_reason } = req.body;

    const transaction = await transactionService.updateTransactionStatus(
        id,
        req.user!.id,
        status,
        rejection_reason
    );

    res.status(200).json({
        message: `Transaction ${status === "DONE" ? "accepted" : "rejected"} successfully`,
        data: transaction,
    });
};

// Manual trigger for expiring unpaid transactions (for testing/admin)
export const expireUnpaidTransactions = async (
    _req: Request,
    res: Response
): Promise<void> => {
    const result = await transactionService.expireUnpaidTransactions();
    res.status(200).json({
        message: "Expired transactions processed",
        data: result,
    });
};

// Manual trigger for cancelling stale transactions (for testing/admin)
export const cancelStaleTransactions = async (
    _req: Request,
    res: Response
): Promise<void> => {
    const result = await transactionService.cancelStaleTransactions();
    res.status(200).json({
        message: "Stale transactions cancelled",
        data: result,
    });
};
