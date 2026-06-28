import bcrypt from "bcryptjs";
import { prisma } from "../config/db";
import { logger } from "./logger";
import { Role } from "../types";

export async function seedDatabase() {
  try {
    // 1. Check if users are already seeded to prevent duplicate operations
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      logger.info("Database already seeded. Skipping seeder operation.");
      return;
    }

    logger.info("Empty database detected. Initializing professional seeding routine...");

    // 2. Generate secure bcrypt password hash
    const defaultPassword = "Password123!";
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    // 3. Create Default Librarian Account
    const librarian = await prisma.user.create({
      data: {
        name: "Eleanor Vance (Librarian)",
        email: "librarian@library.com",
        passwordHash,
        role: Role.LIBRARIAN,
      },
    });
    logger.info(`Seeded Librarian profile: ${librarian.email} with password: ${defaultPassword}`);

    // 4. Create Default Member Account
    const member = await prisma.user.create({
      data: {
        name: "Mark Anthony (Member)",
        email: "member@library.com",
        passwordHash,
        role: Role.MEMBER,
      },
    });
    logger.info(`Seeded Member profile: ${member.email} with password: ${defaultPassword}`);

    // 5. Seed Catalog Books
    const booksToSeed = [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "978-0743273565",
        category: "Classic Fiction",
        quantity: 5,
        availableQuantity: 5,
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "978-0446310789",
        category: "Classic Fiction",
        quantity: 3,
        availableQuantity: 3,
      },
      {
        title: "1984",
        author: "George Orwell",
        isbn: "978-0451524935",
        category: "Dystopian Literature",
        quantity: 7,
        availableQuantity: 7,
      },
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "978-0547928227",
        category: "Fantasy",
        quantity: 4,
        availableQuantity: 4,
      },
      {
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        isbn: "978-0553380163",
        category: "Popular Science",
        quantity: 2,
        availableQuantity: 2,
      },
    ];

    for (const book of booksToSeed) {
      await prisma.book.create({
        data: book,
      });
    }

    logger.info("Successfully seeded book catalog with 5 premium titles.");
  } catch (error) {
    logger.error("Seeder failed to execute correctly", error);
  }
}
