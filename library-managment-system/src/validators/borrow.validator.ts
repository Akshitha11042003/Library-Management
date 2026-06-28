import { body, param } from "express-validator";

export const createBorrowValidator = [
  body("bookId")
    .trim()
    .notEmpty()
    .withMessage("Book ID is required.")
    .isUUID(4)
    .withMessage("Book ID must be a valid UUIDv4."),
  body("memberId")
    .optional()
    .trim()
    .isUUID(4)
    .withMessage("Member ID must be a valid UUIDv4."),
];

export const returnBorrowValidator = [
  param("id")
    .isUUID(4)
    .withMessage("Invalid borrow record ID. Must be a valid UUIDv4."),
];

export const memberIdParamValidator = [
  param("memberId")
    .isUUID(4)
    .withMessage("Invalid member ID format. Must be a valid UUIDv4."),
];
