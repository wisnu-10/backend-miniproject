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
import { upload } from "../config/multer.config";
import {
  createTransactionValidator,
  updateTransactionStatusValidator,
} from "../validators/transaction.validator";

const router = Router();

// Customer routes - static paths MUST come before /:id
router.post(
  "/",
  authenticate,
  authorize(["CUSTOMER"]),
  createTransactionValidator,
  createTransaction,
);
router.get("/me", authenticate, authorize(["CUSTOMER"]), getMyTransactions);

// Organizer routes - static paths MUST come before /:id
router.get(
  "/organizer/list",
  authenticate,
  authorize(["ORGANIZER"]),
  getOrganizerTransactions,
);

// Admin/Scheduler routes - static paths MUST come before /:id
router.post("/admin/expire-unpaid", expireUnpaidTransactions);
router.post("/admin/cancel-stale", cancelStaleTransactions);

// Dynamic /:id routes MUST come after all static paths
router.get(
  "/:id",
  authenticate,
  authorize(["CUSTOMER", "ORGANIZER"]),
  getTransactionById,
);
router.post(
  "/:id/payment-proof",
  authenticate,
  authorize(["CUSTOMER"]),
  upload.single("payment_proof"),
  uploadPaymentProof,
);
router.post(
  "/:id/cancel",
  authenticate,
  authorize(["CUSTOMER"]),
  cancelTransaction,
);
router.put(
  "/:id/status",
  authenticate,
  authorize(["ORGANIZER"]),
  updateTransactionStatusValidator,
  updateTransactionStatus,
);

export default router;
