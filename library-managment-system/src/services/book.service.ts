import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";

export class BookService {
  /**
   * Adds a new book to the library catalog.
   */
  static async createBook(
    title: string,
    author: string,
    isbn: string,
    category: string,
    quantity: number
  ) {
    const trimmedIsbn = isbn.trim();

    // 1. Verify if ISBN unique constraint already exists
    const existingBook = await prisma.book.findUnique({
      where: { isbn: trimmedIsbn },
    });
    if (existingBook) {
      throw new AppError("A book with this ISBN already exists in the catalog.", 409);
    }

    // 2. Create the book with both quantity and available quantity set to the initial count
    return await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        isbn: trimmedIsbn,
        category: category.trim(),
        quantity,
        availableQuantity: quantity,
      },
    });
  }

  /**
   * Updates an existing book catalog record.
   */
  static async updateBook(id: string, updateFields: any) {
    // 1. Find existing book
    const book = await prisma.book.findUnique({
      where: { id },
    });
    if (!book) {
      throw new AppError("The book to update was not found.", 404);
    }

    const dataToUpdate: any = {};

    if (updateFields.title !== undefined) dataToUpdate.title = updateFields.title.trim();
    if (updateFields.author !== undefined) dataToUpdate.author = updateFields.author.trim();
    if (updateFields.category !== undefined) dataToUpdate.category = updateFields.category.trim();

    if (updateFields.isbn !== undefined) {
      const trimmedIsbn = updateFields.isbn.trim();
      if (trimmedIsbn !== book.isbn) {
        const existingBook = await prisma.book.findUnique({
          where: { isbn: trimmedIsbn },
        });
        if (existingBook) {
          throw new AppError("Another book with this ISBN already exists.", 409);
        }
        dataToUpdate.isbn = trimmedIsbn;
      }
    }

    if (updateFields.quantity !== undefined) {
      const newQuantity = updateFields.quantity;
      const activeLoans = book.quantity - book.availableQuantity;

      // Ensure the user doesn't shrink the library catalog below checked-out inventory
      if (newQuantity < activeLoans) {
        throw new AppError(
          `Cannot reduce catalog count to ${newQuantity} because ${activeLoans} copies are currently checked out by members.`,
          400
        );
      }

      dataToUpdate.quantity = newQuantity;
      // Recalculate remaining available stock based on the adjusted total and outstanding loans
      dataToUpdate.availableQuantity = newQuantity - activeLoans;
    }

    return await prisma.book.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  /**
   * Deletes a book record from the catalog.
   */
  static async deleteBook(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
    });
    if (!book) {
      throw new AppError("The book was not found.", 404);
    }

    const activeLoans = book.quantity - book.availableQuantity;
    if (activeLoans > 0) {
      throw new AppError(
        `Cannot delete this book from the catalog. ${activeLoans} copies are currently checked out.`,
        400
      );
    }

    // Since onDelete is Restrict, we also double-check in-service that no historical borrow record is breached
    const historicLoans = await prisma.borrowRecord.findFirst({
      where: { bookId: id },
    });
    if (historicLoans) {
      throw new AppError(
        "Cannot delete this book. Historic borrow logs refer to this title. Archive or change quantity to 0 instead.",
        400
      );
    }

    return await prisma.book.delete({
      where: { id },
    });
  }

  /**
   * Query catalog records with optional filters.
   */
  static async listBooks(search?: string, category?: string) {
    const whereClause: any = {};

    if (category) {
      whereClause.category = {
        equals: category.trim(),
      };
    }

    if (search) {
      const trimmedSearch = search.trim();
      whereClause.OR = [
        { title: { contains: trimmedSearch } },
        { author: { contains: trimmedSearch } },
        { isbn: { contains: trimmedSearch } },
      ];
    }

    return await prisma.book.findMany({
      where: whereClause,
      orderBy: { title: "asc" },
    });
  }

  /**
   * Fetch single book catalog record by ID.
   */
  static async getBookById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
    });
    if (!book) {
      throw new AppError("The requested book was not found.", 404);
    }
    return book;
  }
}
