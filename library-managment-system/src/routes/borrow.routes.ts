import { Router } from "express";
import { BorrowController } from "../controllers/borrow.controller";
import { protectRoute } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { Role } from "../types";

const router = Router();

// Apply auth middleware globally to all borrowing endpoints
router.use(protectRoute);

/**
 * @route   POST /api/borrows/borrow
 * @desc    Checks out a book for a member
 * @access  Private (Member can self-checkout, Librarian can check out on behalf of any member)
 */
router.post("/borrow", BorrowController.borrow);

/**
 * @route   POST /api/borrows/return
 * @desc    Returns a borrowed book back to stock
 * @access  Private (Member can self-return, Librarian can process return on behalf of any member)
 */
router.post("/return", BorrowController.return);

/**
 * @route   GET /api/borrows/my-active
 * @desc    Retrieves current active checkouts for the logged-in member
 * @access  Private (Member / Librarian)
 */
router.get("/my-active", BorrowController.getMyActiveBorrows);

/**
 * @route   GET /api/borrows/my-history
 * @desc    Retrieves full transaction history of borrowings for the logged-in member
 * @access  Private (Member / Librarian)
 */
router.get("/my-history", BorrowController.getMyHistory);

export default router;
