import bcrypt from "bcryptjs";

/**
 * Utility for password security operations.
 */
export class HashUtils {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hashes a plain text password using bcrypt.
   * @param password Plain text password to hash
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compares a plain text password with a hashed password.
   * @param password Plain text password
   * @param hash Stored bcrypt hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
