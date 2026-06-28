import jwt from "jsonwebtoken";
import { AppError } from "./AppError";
import { Role } from "../types";

export interface JWTPayload {
  sub: string;
  role: Role;
}

/**
 * Utility class for JSON Web Token operations.
 */
export class JWTUtils {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim() === "") {
      throw new AppError("Cryptographic misconfiguration: JWT_SECRET is not set in environment variables.", 500);
    }
    return secret;
  }

  private static getExpiration(): string {
    return process.env.JWT_EXPIRES_IN || "15m";
  }

  /**
   * Signs a JWT payload containing user ID (sub) and role.
   * @param payload Payload with user details
   */
  static signToken(payload: JWTPayload): string {
    const secret = this.getSecret();
    const expiresIn = this.getExpiration();
    
    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  /**
   * Verifies and decodes a signed JWT.
   * @param token Signed JWT string
   */
  static verifyToken(token: string): JWTPayload {
    const secret = this.getSecret();
    try {
      return jwt.verify(token, secret) as JWTPayload;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Authentication token has expired. Please log in again.", 401);
      }
      throw new AppError("Invalid or corrupted authentication token.", 401);
    }
  }
}
