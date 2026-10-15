import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";
import { Prisma } from "@prisma/client";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = (req.headers["x-request-id"] as string) || "none";
  logger.error(`[${correlationId}] ${req.method} ${req.originalUrl} failed:`, err);

  // Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload or parameters.",
        details: formattedErrors,
      },
    });
    return;
  }

  // Prisma Unique Constraint Error
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) || [];
      res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_RECORD",
          message: `A record with this ${target.join(", ")} already exists.`,
          details: { target },
        },
      });
      return;
    }

    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          code: "RECORD_NOT_FOUND",
          message: "The requested record was not found.",
        },
      });
      return;
    }
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected error occurred.";

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
      ...(err.details && { details: err.details }),
    },
  });
}
