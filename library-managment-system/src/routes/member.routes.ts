import { Router } from "express";
import { MemberController } from "../controllers/member.controller";
import { protectRoute } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { idParamValidator } from "../validators/book.validator";
import { validateRequest } from "../middlewares/validate.middleware";
import { Role } from "../types";

const router = Router();

import { BorrowController } from "../controllers/borrow.controller";

// Apply security guards: must be authenticated
router.use(protectRoute);

/**
 * @route   GET /api/members/me/books
 * @desc    Retrieves current active checkouts for the logged-in member
 * @access  Private (Member / Librarian)
 */
router.get("/me/books", BorrowController.getMyActiveBorrows);

// Restrict following endpoints to LIBRARIAN only
router.use(authorizeRoles(Role.LIBRARIAN));

/**
 * @route   GET /api/members
 * @desc    Retrieves a list of registered members
 * @access  Private (Librarian only)
 */
router.get("/", MemberController.list);

/**
 * @route   GET /api/members/:id
 * @desc    Retrieves profile details of a single member
 * @access  Private (Librarian only)
 */
router.get("/:id", idParamValidator, validateRequest, MemberController.getById);

/**
 * @route   DELETE /api/members/:id
 * @desc    Deletes a member's registration record
 * @access  Private (Librarian only)
 */
router.delete("/:id", idParamValidator, validateRequest, MemberController.delete);

export default router;
