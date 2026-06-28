import { ApiError } from "./ApiError";
import { catchAsync } from "./catchAsync";

/**
 * Backward-compatible subclass of ApiError.
 * Ensures all existing controller, middleware, and service references to AppError compile perfectly.
 */
export class AppError extends ApiError {
  constructor(message: string, statusCode: number, errors: any[] | null = null) {
    super(message, statusCode, errors);
  }
}

export { catchAsync };
