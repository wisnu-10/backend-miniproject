import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

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

export const validateRegister = [
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Full name must be at least 3 characters long"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 50 })
    .withMessage("Password must be at least 6 characters long"),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("phone_number")
    .optional({ values: "falsy" })
    .isMobilePhone("id-ID")
    .withMessage("Invalid phone number format"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["CUSTOMER", "ORGANIZER"])
    .withMessage("Role must be either CUSTOMER or ORGANIZER"),

  body("referral_code").optional().trim(),

  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password").trim().notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];
