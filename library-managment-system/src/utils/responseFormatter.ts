/**
 * Standard interface for all JSON API responses.
 * Implements a structured payload format across successes, client failures (4xx), and server errors (5xx).
 */
export interface ApiResponsePayload<T> {
  status: "success" | "fail" | "error";
  message?: string;
  data?: T;
  errors?: any[] | null;
  stack?: string;
}

/**
 * Standardized Response Formatter class.
 * Enforces unified schema representation for all client-facing responses.
 */
export class ResponseFormatter {
  /**
   * Generates a standardized payload for a successful operation.
   * 
   * @param data Main resource data payload returned to client
   * @param message Optional client message indicating details of operation
   */
  static success<T>(data: T, message?: string): ApiResponsePayload<T> {
    return {
      status: "success",
      ...(message ? { message } : {}),
      data,
    };
  }

  /**
   * Generates a standardized payload for a failed operation or unhandled system error.
   * 
   * @param status Category: 'fail' for operational/client issues (4xx), 'error' for server/internal issues (5xx)
   * @param message Descriptive message of what went wrong
   * @param errors Structured list of issues (e.g. express-validator validation failures)
   * @param stack Developer-centric error stack trace (only supplied in non-production environments)
   */
  static error(
    status: "fail" | "error",
    message: string,
    errors: any[] | null = null,
    stack?: string
  ): ApiResponsePayload<null> {
    return {
      status,
      message,
      ...(errors ? { errors } : {}),
      ...(process.env.NODE_ENV === "development" && stack ? { stack } : {}),
    };
  }
}
