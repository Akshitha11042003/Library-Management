import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { BorrowStatus } from "../types";

export class BorrowService {
  /**
   * Transactional operation to check out a book for a member.
   */
  static async borrowBook(memberId: string, bookId: string) {
    // 1. Verify member exists
    const member = await prisma.user.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new AppError("Member record not found.", 404);
    }

    // 2. Fetch the book
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });
    if (!book) {
      throw new AppError("The book to borrow does not exist in our catalog.", 404);
    }

    // 3. Enforce Inventory Check
    if (book.availableQuantity <= 0) {
      throw new AppError("This book is currently out of stock.", 400);
    }

    // 4. Enforce Duplicate Check (Cannot borrow the same title twice concurrently)
    const existingActiveBorrow = await prisma.borrowRecord.findFirst({
      where: {
        memberId,
        bookId,
        status: BorrowStatus.BORROWED,
        returnDate: null,
      },
    });
    if (existingActiveBorrow) {
      throw new AppError("You already have an active checkout of this book. Return it first.", 400);
    }

    // 5. Enforce Limit Check (Cannot exceed 5 concurrent active loans)
    const activeBorrowsCount = await prisma.borrowRecord.count({
      where: {
        memberId,
        status: BorrowStatus.BORROWED,
        returnDate: null,
      },
    });
    const MAX_BORROWS = 5;
    if (activeBorrowsCount >= MAX_BORROWS) {
      throw new AppError(
        `Borrowing limit exceeded. You cannot have more than ${MAX_BORROWS} active checkouts simultaneously.`,
        400
      );
    }

    // 6. Calculate Due Date (Standard 14 days loan period)
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + 14);

    // 7. Execute transactional updates
    return await prisma.$transaction(async (tx) => {
      // Re-fetch book inside transaction with locking (if supported, or double check available qty to prevent race conditions)
      const freshBook = await tx.book.findUnique({
        where: { id: bookId },
      });

      if (!freshBook || freshBook.availableQuantity <= 0) {
        throw new AppError("The book became out of stock during processing.", 400);
      }

      // Decrement available quantity
      await tx.book.update({
        where: { id: bookId },
        data: {
          availableQuantity: {
            decrement: 1,
          },
        },
      });

      // Create borrow transaction record
      return await tx.borrowRecord.create({
        data: {
          memberId,
          bookId,
          dueDate,
          status: BorrowStatus.BORROWED,
        },
        include: {
          book: true,
        },
      });
    });
  }

  /**
   * Transactional operation to return a checked-out book.
   */
  static async returnBook(memberId: string, bookId: string) {
    // 1. Locate active, outstanding checkout record
    const activeBorrow = await prisma.borrowRecord.findFirst({
      where: {
        memberId,
        bookId,
        status: BorrowStatus.BORROWED,
        returnDate: null,
      },
    });

    if (!activeBorrow) {
      throw new AppError(
        "No active checkout record found for this book and member. It might have already been returned.",
        404
      );
    }

    // 2. Process return inside a database transaction
    return await prisma.$transaction(async (tx) => {
      // Increment available stock
      await tx.book.update({
        where: { id: bookId },
        data: {
          availableQuantity: {
            increment: 1,
          },
        },
      });

      // Close the borrow record
      return await tx.borrowRecord.update({
        where: { id: activeBorrow.id },
        data: {
          returnDate: new Date(),
          status: BorrowStatus.RETURNED,
        },
        include: {
          book: true,
        },
      });
    });
  }

  /**
   * Retrieves active checkouts for a specific member.
   */
  static async getMemberActiveBorrows(memberId: string) {
    return await prisma.borrowRecord.findMany({
      where: {
        memberId,
        status: BorrowStatus.BORROWED,
        returnDate: null,
      },
      include: {
        book: true,
      },
      orderBy: {
        borrowDate: "desc",
      },
    });
  }

  /**
   * Retrieves complete loan histories for a member.
   */
  static async getMemberBorrowHistory(memberId: string) {
    return await prisma.borrowRecord.findMany({
      where: { memberId },
      include: {
        book: true,
      },
      orderBy: {
        borrowDate: "desc",
      },
    });
  }
}
