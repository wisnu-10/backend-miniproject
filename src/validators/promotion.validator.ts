import { body } from "express-validator";
import { handleValidationErrors } from "./event.validator";

// Validation rules for creating a promotion
export const createPromotionValidator = [
    body("code")
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage("Promotion code must be between 3 and 20 characters")
        .isAlphanumeric()
        .withMessage("Promotion code must contain only letters and numbers"),

    body("discount_percentage")
        .optional()
        .isFloat({ min: 0.01, max: 100 })
        .withMessage("Discount percentage must be between 0.01 and 100"),

    body("discount_amount")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("Discount amount must be greater than 0"),

    body()
        .custom((value) => {
            if (!value.discount_percentage && !value.discount_amount) {
                throw new Error(
                    "Must provide either discount_percentage or discount_amount"
                );
            }
            return true;
        }),

    body("max_usage")
        .notEmpty()
        .withMessage("Max usage is required")
        .isInt({ min: 1 })
        .withMessage("Max usage must be at least 1"),

    body("valid_from")
        .notEmpty()
        .withMessage("Valid from date is required")
        .isISO8601()
        .withMessage("Invalid date format for valid_from"),

    body("valid_until")
        .notEmpty()
        .withMessage("Valid until date is required")
        .isISO8601()
        .withMessage("Invalid date format for valid_until")
        .custom((value: string, { req }) => {
            if (
                req.body.valid_from &&
                new Date(value) <= new Date(req.body.valid_from)
            ) {
                throw new Error("valid_until must be after valid_from");
            }
            return true;
        }),

    handleValidationErrors,
];

// Validation rules for updating a promotion
export const updatePromotionValidator = [
    body("code")
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage("Promotion code must be between 3 and 20 characters")
        .isAlphanumeric()
        .withMessage("Promotion code must contain only letters and numbers"),

    body("discount_percentage")
        .optional()
        .isFloat({ min: 0.01, max: 100 })
        .withMessage("Discount percentage must be between 0.01 and 100"),

    body("discount_amount")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("Discount amount must be greater than 0"),

    body("max_usage")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Max usage must be at least 1"),

    body("valid_from")
        .optional()
        .isISO8601()
        .withMessage("Invalid date format for valid_from"),

    body("valid_until")
        .optional()
        .isISO8601()
        .withMessage("Invalid date format for valid_until")
        .custom((value: string, { req }) => {
            if (
                req.body.valid_from &&
                new Date(value) <= new Date(req.body.valid_from)
            ) {
                throw new Error("valid_until must be after valid_from");
            }
            return true;
        }),

    handleValidationErrors,
];

