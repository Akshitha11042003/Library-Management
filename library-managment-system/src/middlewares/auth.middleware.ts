import { Response, NextFunction } from "express";
import { AuthenticatedRequest, Role } from "../types";
import { AppError } from "../utils/AppError";
import { JWTUtils } from "../utils/jwt.utils";

/**
 * Authentication Middleware
 * 
 * Intercepts requests, extracts the JWT bearer token from the Authorization header,
 * cryptographically verifies the token using JWTUtils, and attaches the verified 
 * user context (id, role) to the request object.
 */
export const protectRoute = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        new AppError(
          "Access denied. Missing or malformed Bearer token in Authorization header.",
          401
        )
      );
    }

    // 2. Extract the token value from the header format "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token || token.trim() === "") {
      return next(
        new AppError(
          "Access denied. Token is empty.",
          401
        )
      );
    }

    // 3. Cryptographically verify signature and check expiration claims
    // JWTUtils.verifyToken automatically throws specific AppErrors if the token has expired or is invalid
    const decoded = JWTUtils.verifyToken(token);

    // 4. Attach verified user context to the request
    req.user = {
      id: decoded.sub,
      role: decoded.role as Role,
    };

    // 5. Pass control to the next middleware or controller in the execution chain
    next();
  } catch (error) {
    // Forward errors to the global error handler
    next(error);
  }
};

