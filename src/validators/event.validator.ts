import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

// Reusable middleware to check for validation errors
export const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            message: "Validation failed",
            errors: errors.array(),
        });
        return;
    }
    next();
};

// Validation rules for creating an event
export const createEventValidator = [
    body("name")
        .trim()
        .notEmpty()
        .isLength({ min: 5, max: 100 })
        .withMessage("Name must be at least 5 characters long"),

    body("description")
        .trim()
        .notEmpty()
        .isLength({ min: 10, max: 500 })
        .withMessage("Description must be at least 10 characters long"),

    body("category_id")
        .trim()
        .notEmpty()
        .withMessage("Category is required")
        .isUUID()
        .withMessage("Category ID must be a valid UUID"),

    body("start_date")
        .notEmpty()
        .withMessage("Start date is required")
        .isISO8601()
        .withMessage("Invalid date format for start_date")
        .custom((value: string) => {
            if (new Date(value) < new Date()) {
                throw new Error("Start date must be in the future");
            }
            return true;
        }),

    body("end_date")
        .notEmpty()
        .withMessage("End date is required")
        .isISO8601()
        .withMessage("Invalid date format for end_date")
        .custom((value: string, { req }) => {
            if (req.body.start_date && new Date(value) <= new Date(req.body.start_date)) {
                throw new Error("End date must be after start date");
            }
            return true;
        }),

    body("total_seats")
        .notEmpty()
        .withMessage("Total seats is required")
        .isInt({ min: 1 })
        .withMessage("Total seats must be at least 1"),

    body("base_price")
        .notEmpty()
        .withMessage("Base price is required")
        .isFloat({ min: 0 })
        .withMessage("Base price cannot be negative"),

    // Optional fields
    body("city").optional().trim(),
    body("province").optional().trim(),
    body("is_free").optional().isBoolean().withMessage("is_free must be a boolean"),
    body("image").optional().trim(),

    // Optional ticket_types array
    body("ticket_types")
        .optional()
        .isArray()
        .withMessage("ticket_types must be an array"),

    body("ticket_types.*.name")
        .trim()
        .notEmpty()
        .withMessage("Ticket type name is required"),

    body("ticket_types.*.price")
        .isFloat({ min: 0 })
        .withMessage("Ticket type price must be 0 or greater"),

    body("ticket_types.*.quantity")
        .isInt({ min: 1 })
        .withMessage("Ticket type quantity must be at least 1"),

    body("ticket_types.*.description").optional().trim(),
];
