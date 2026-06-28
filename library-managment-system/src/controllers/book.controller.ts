import { Request, Response } from "express";
import { BookService } from "../services/book.service";
import { catchAsync } from "../utils/AppError";

export class BookController {
  /**
   * Adds a new book to the library catalog.
   */
  static create = catchAsync(async (req: Request, res: Response) => {
    const { title, author, isbn, category, quantity } = req.body;

    const book = await BookService.createBook(title, author, isbn, category, quantity);

    return res.status(201).json({
      status: "success",
      message: "Book added to catalog successfully.",
      data: { book },
    });
  });

  /**
   * List books with optional search term and category filter.
   */
  static list = catchAsync(async (req: Request, res: Response) => {
    const { search, category } = req.query;

    const books = await BookService.listBooks(
      search ? String(search) : undefined,
      category ? String(category) : undefined
    );

    return res.status(200).json({
      status: "success",
      results: books.length,
      data: { books },
    });
  });

  /**
   * Fetches detailed information for a single book.
   */
  static getById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const book = await BookService.getBookById(id);

    return res.status(200).json({
      status: "success",
      data: { book },
    });
  });

  /**
   * Updates fields of an existing book.
   */
  static update = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateFields = req.body;

    const book = await BookService.updateBook(id, updateFields);

    return res.status(200).json({
      status: "success",
      message: "Book details updated successfully.",
      data: { book },
    });
  });

  /**
   * Deletes a book entirely from the system.
   */
  static delete = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await BookService.deleteBook(id);

    return res.status(200).json({
      status: "success",
      message: "Book removed from catalog successfully.",
      data: null,
    });
  });
}
