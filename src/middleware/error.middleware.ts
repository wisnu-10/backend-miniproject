import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If headers are already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Custom Operational Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  // Handle Prisma Known Request Errors (e.g. Unique Constraint, Record Not Found)
  if (err.code && typeof err.code === "string" && err.code.startsWith("P")) {
    // P2002: Unique constraint failed (e.g. duplicate email)
    if (err.code === "P2002") {
      const fields = err.meta?.target ? (err.meta.target as string[]).join(", ") : "field";
      res.status(409).json({
        status: "error",
        message: `Conflict: Unique constraint failed on ${fields}`,
      });
      return;
    }

    // P2025: Record to update/delete not found
    if (err.code === "P2025") {
      res.status(404).json({
        status: "error",
        message: err.meta?.cause || "Record not found",
      });
      return;
    }
  }

  // Unhandled / Unexpected Errors
  console.error("Unhandled Error:", err);

  res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { 
      error: err.message, 
      stack: err.stack 
    }),
  });
};
