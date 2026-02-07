import { Router } from "express";
import {
    createTransaction,
    uploadPaymentProof,
    cancelTransaction,
    getMyTransactions,
    getTransactionById,
    getOrganizerTransactions,
    updateTransactionStatus,
    expireUnpaidTransactions,
    cancelStaleTransactions,
} from "../controllers/transaction.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// Customer routes
router.post("/", authenticate, authorize(["CUSTOMER"]), createTransaction);
router.get("/me", authenticate, authorize(["CUSTOMER"]), getMyTransactions);
router.get("/:id", authenticate, authorize(["CUSTOMER", "ORGANIZER"]), getTransactionById);
router.post("/:id/payment-proof", authenticate, authorize(["CUSTOMER"]), uploadPaymentProof);
router.post("/:id/cancel", authenticate, authorize(["CUSTOMER"]), cancelTransaction);

// Organizer routes
router.get("/organizer/list", authenticate, authorize(["ORGANIZER"]), getOrganizerTransactions);
router.put("/:id/status", authenticate, authorize(["ORGANIZER"]), updateTransactionStatus);

// Admin/Scheduler routes (for manual testing or cron jobs)
router.post("/admin/expire-unpaid", expireUnpaidTransactions);
router.post("/admin/cancel-stale", cancelStaleTransactions);

export default router;
