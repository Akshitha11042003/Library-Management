import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

/**
 * Catch-all middleware for handling requests to unrouted endpoints.
 * Wraps unrouted requests into a standardized 404 ApiError.
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(
    new ApiError(
      `Endpoint [${req.method}] ${req.originalUrl} does not exist on this server.`,
      404
    )
  );
};
