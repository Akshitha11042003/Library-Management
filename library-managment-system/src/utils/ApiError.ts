/**
 * Centralized API Error class for custom operational and client-facing exceptions.
 * Implements a standardized structure containing an HTTP status code, operational flags,
 * optional structured validation/details errors, and captures stack traces.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational: boolean;
  public readonly errors: any[] | null;

  constructor(message: string, statusCode: number, errors: any[] | null = null, stack = "") {
    super(message);
    this.statusCode = statusCode;
    // Status is 'fail' for 4xx client errors, 'error' for 5xx server errors
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Denotes that this is a known, handled operational exception
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
