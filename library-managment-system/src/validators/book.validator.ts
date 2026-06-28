import { body, param } from "express-validator";

export const createBookValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Book title is required.")
    .isLength({ max: 255 })
    .withMessage("Title cannot exceed 255 characters."),
  body("author")
    .trim()
    .notEmpty()
    .withMessage("Author name is required.")
    .isLength({ max: 100 })
    .withMessage("Author name cannot exceed 100 characters."),
  body("isbn")
    .trim()
    .notEmpty()
    .withMessage("ISBN number is required.")
    .matches(/^(?:ISBN(?:-1[03])?:?\s*)?(?=[0-9X]{10}$|(?=(?:[0-9]{3}[-\s]){3})[0-9-\s]{17}$)(?:[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X])$/)
    .withMessage("Please provide a valid 10-digit or 13-digit ISBN string."),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required.")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters."),
  body("quantity")
    .notEmpty()
    .withMessage("Total quantity is required.")
    .isInt({ min: 1 })
    .withMessage("Total book quantity must be a positive integer greater than or equal to 1."),
];

export const updateBookValidator = [
  param("id").isUUID(4).withMessage("Please provide a valid book UUIDv4 parameter."),
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Book title cannot be empty.")
    .isLength({ max: 255 })
    .withMessage("Title cannot exceed 255 characters."),
  body("author")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Author name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Author name cannot exceed 100 characters."),
  body("isbn")
    .optional()
    .trim()
    .matches(/^(?:ISBN(?:-1[03])?:?\s*)?(?=[0-9X]{10}$|(?=(?:[0-9]{3}[-\s]){3})[0-9-\s]{17}$)(?:[0-9]{1,5}[-\s]?[0-9]+[-\s]?[0-9]+[-\s]?[0-9X])$/)
    .withMessage("Please provide a valid 10-digit or 13-digit ISBN string."),
  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters."),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer greater than or equal to 1."),
];

export const idParamValidator = [
  param("id").isUUID(4).withMessage("Invalid identifier format. Must be a standard UUIDv4."),
];
