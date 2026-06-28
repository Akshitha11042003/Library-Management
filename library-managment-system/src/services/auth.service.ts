import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { Role } from "../types";
import { HashUtils } from "../utils/hash.utils";
import { JWTUtils } from "../utils/jwt.utils";

export class AuthService {
  /**
   * Registers a new user as a library MEMBER.
   * Performs validation, duplicate email checking, hashes the password, and saves the record.
   */
  static async register(name: string, email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if email already exists to prevent duplicate registrations
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new AppError("An account with this email address is already registered.", 409);
    }

    // 2. Hash password with bcrypt via the HashUtils helper
    const passwordHash = await HashUtils.hashPassword(password);

    // 3. Create the user record in the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: Role.MEMBER, // Default registration role is Member
      },
    });

    // 4. Return sanitized user details (do not return passwordHash)
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }

  /**
   * Verifies credentials, cryptographically checks the password, and generates a secure JWT.
   */
  static async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      // Generic error message for security (prevents user enumeration)
      throw new AppError("Invalid email address or password.", 401);
    }

    // 2. Cryptographically verify password hash using the HashUtils helper
    const isPasswordValid = await HashUtils.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Invalid email address or password.", 401);
    }

    // 3. Generate a secure, signed JWT using JWTUtils
    const token = JWTUtils.signToken({
      sub: user.id,
      role: user.role as Role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
