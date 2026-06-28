import { Router } from "express";
import { BookController } from "../controllers/book.controller";
import { protectRoute } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { BorrowController } from "../controllers/borrow.controller";
import { createBookValidator, updateBookValidator, idParamValidator } from "../validators/book.validator";
import { validateRequest } from "../middlewares/validate.middleware";
import { Role } from "../types";

const router = Router();

/**
 * @route   GET /api/books
 * @desc    Lists catalog books with search and filter queries
 * @access  Public (Both members and librarians can search catalog)
 */
router.get("/", BookController.list);

/**
 * @route   GET /api/books/:id
 * @desc    Fetches detailed metadata of a specific book
 * @access  Public
 */
router.get("/:id", idParamValidator, validateRequest, BookController.getById);

/**
 * @route   POST /api/books
 * @desc    Adds a new title to the catalog
 * @access  Private (Librarian only)
 */
router.post(
  "/",
  protectRoute,
  authorizeRoles(Role.LIBRARIAN),
  createBookValidator,
  validateRequest,
  BookController.create
);

/**
 * @route   PUT /api/books/:id
 * @desc    Updates fields of an existing catalog entry
 * @access  Private (Librarian only)
 */
router.put(
  "/:id",
  protectRoute,
  authorizeRoles(Role.LIBRARIAN),
  updateBookValidator,
  validateRequest,
  BookController.update
);

/**
 * @route   DELETE /api/books/:id
 * @desc    Removes a title entirely from the catalog
 * @access  Private (Librarian only)
 */
router.delete(
  "/:id",
  protectRoute,
  authorizeRoles(Role.LIBRARIAN),
  idParamValidator,
  validateRequest,
  BookController.delete
);

/**
 * @route   POST /api/books/:id/borrow
 * @desc    Checks out a book for a member
 * @access  Private
 */
router.post(
  "/:id/borrow",
  protectRoute,
  idParamValidator,
  validateRequest,
  BorrowController.borrow
);

/**
 * @route   POST /api/books/:id/return
 * @desc    Returns a borrowed book back to stock
 * @access  Private
 */
router.post(
  "/:id/return",
  protectRoute,
  idParamValidator,
  validateRequest,
  BorrowController.return
);

export default router;
