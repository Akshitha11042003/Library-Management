import { Response, NextFunction } from "express";
import { AuthenticatedRequest, Role } from "../types";
import { AppError } from "../utils/AppError";

/**
 * Reusable Role-Based Authorization Middleware
 * 
 * Intercepts requests and filters based on user roles.
 * Must be executed after the primary authentication filter (protectRoute).
 * 
 * @param allowedRoles List of roles permitted to access this resource
 * 
 * @example
 * // 1. Restricting a route to Librarians only:
 * router.post("/books", protectRoute, authorize(Role.LIBRARIAN), bookController.create);
 * 
 * // 2. Restricting a route to both Members and Librarians:
 * router.get("/books", protectRoute, authorize(Role.MEMBER, Role.LIBRARIAN), bookController.list);
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // 1. Ensure user identity was successfully mapped in previous filter
    if (!req.user) {
      return next(
        new AppError("User context not found. Authentication required before authorization.", 401)
      );
    }

    // 2. Evaluate if current role fits the allowed parameters
    const userRole = req.user.role as Role;
    if (!allowedRoles.includes(userRole)) {
      return next(
        new AppError(
          `Access denied. Your role '${userRole}' is insufficient to access this resource. Required role(s): ${allowedRoles.join(", ")}.`,
          403
        )
      );
    }

    // 3. Clear authorization, proceed to handler
    next();
  };
};

/**
 * Pre-configured Middleware for Librarian-only resources.
 * Allows ONLY users with the 'LIBRARIAN' role.
 * 
 * @example
 * router.delete("/books/:id", protectRoute, requireLibrarian, bookController.delete);
 */
export const requireLibrarian = authorize(Role.LIBRARIAN);

/**
 * Pre-configured Middleware for Member-only resources.
 * Allows ONLY users with the 'MEMBER' role.
 * 
 * @example
 * router.post("/borrows", protectRoute, requireMember, borrowController.create);
 */
export const requireMember = authorize(Role.MEMBER);

/**
 * Backward-compatible alias for standard authorize middleware.
 */
export const authorizeRoles = authorize;
