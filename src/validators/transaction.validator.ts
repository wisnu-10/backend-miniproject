import { body } from "express-validator";
import { handleValidationErrors } from "./event.validator";

// Validation rules for creating a transaction
export const createTransactionValidator = [
    body("event_id")
        .trim()
        .notEmpty()
        .withMessage("event_id is required"),

    body("items")
        .isArray({ min: 1 })
        .withMessage("items must be a non-empty array"),

    body("items.*.ticket_type_id")
        .trim()
        .notEmpty()
        .withMessage("Each item must have a ticket_type_id"),

    body("items.*.quantity")
        .isInt({ min: 1 })
        .withMessage("Each item quantity must be an integer >= 1"),

    // Optional discount fields (mutually exclusive)
    body("promotion_code").optional().trim(),
    body("coupon_code").optional().trim(),

    body("points_to_use")
        .optional()
        .isInt({ min: 0 })
        .withMessage("points_to_use must be a non-negative integer"),

    // Mutual exclusivity: only one discount option allowed per transaction
    body()
        .custom((value) => {
            const hasPromotion = !!value.promotion_code;
            const hasCoupon = !!value.coupon_code;
            const hasPoints = value.points_to_use && parseInt(value.points_to_use) > 0;

            const optionsUsed = [hasPromotion, hasCoupon, hasPoints].filter(Boolean).length;

            if (optionsUsed > 1) {
                throw new Error(
                    "Only one discount option can be used per transaction: promotion_code, coupon_code, or points_to_use"
                );
            }
            return true;
        }),

    handleValidationErrors,
];

// Validation rules for updating transaction status (accept/reject)
export const updateTransactionStatusValidator = [
    body("status")
        .trim()
        .notEmpty()
        .withMessage("status is required")
        .isIn(["DONE", "REJECTED"])
        .withMessage("status must be either 'DONE' or 'REJECTED'"),

    body("rejection_reason")
        .optional()
        .trim(),

    body()
        .custom((value) => {
            if (value.status === "REJECTED" && !value.rejection_reason) {
                throw new Error(
                    "rejection_reason is required when status is 'REJECTED'"
                );
            }
            return true;
        }),

    handleValidationErrors,
];
