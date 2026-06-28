import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ResponseFormatter } from "../utils/responseFormatter";
import { logger } from "../utils/logger";

/**
 * Global Centralized Error Handling Middleware.
 * Intercepts all operational exceptions and programmer errors thrown within the application,
 * logs them based on severity level, maps specific integration library errors (e.g., Prisma DB, JWT),
 * and standardizes client responses using the ResponseFormatter.
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected system error occurred on the server.";
  let errors = err.errors || null;
  let isOperational = err.isOperational || false;

  // 1. Map Known Prisma Database Engine Exceptions
  if (err.code && err.code.startsWith("P2")) {
    isOperational = true;
    if (err.code === "P2002") {
      // Unique key constraint violation (e.g. duplicate email, isbn)
      const target = err.meta?.target || "field";
      statusCode = 409;
      message = `A record with this ${target} already exists in our system.`;
    } else if (err.code === "P2003") {
      // Foreign key constraint failure (associated entities exist)
      statusCode = 409;
      message = "Referential integrity constraint violated. Associated entities are linked to this record.";
    } else if (err.code === "P2025") {
      // Primary record target not found
      statusCode = 404;
      message = "The requested record was not found or has been removed.";
    }
  }

  // 2. Map Standard JSON Web Token (JWT) Exceptions
  if (err.name === "TokenExpiredError") {
    isOperational = true;
    statusCode = 401;
    message = "Your authentication session has expired. Please log in again.";
  } else if (err.name === "JsonWebTokenError") {
    isOperational = true;
    statusCode = 401;
    message = "Your authentication token is invalid or corrupted.";
  }

  // 3. Map Express Body Parsing Syntax Errors
  if (err instanceof SyntaxError && "body" in err) {
    isOperational = true;
    statusCode = 400;
    message = "Malformed JSON syntax provided in request body.";
  }

  // 4. Record the details inside our professional logging layer
  if (statusCode >= 500) {
    // Programmer/Infrastructure failure - requires attention
    logger.error(`Critical Server Exception: [${req.method}] ${req.originalUrl} -> ${message}`, err);
  } else {
    // Client-side/Operational event - normal warning
    logger.warn(`Operational Client Event: [${req.method}] ${req.originalUrl} [Status ${statusCode}] -> ${message}`, {
      path: req.originalUrl,
      statusCode,
      errors
    });
  }

  // 5. Categorize response status as 'fail' (for 4xx) or 'error' (for 5xx)
  const statusCategory = statusCode >= 500 ? "error" : "fail";

  // Mask sensitive database/internal traces from clients in production
  if (process.env.NODE_ENV === "production" && !isOperational && statusCode >= 500) {
    message = "An unexpected error occurred. Please contact system support.";
  }

  // 6. Generate formatted unified JSON response
  const responsePayload = ResponseFormatter.error(
    statusCategory,
    message,
    errors,
    err.stack
  );

  return res.status(statusCode).json(responsePayload);
};
