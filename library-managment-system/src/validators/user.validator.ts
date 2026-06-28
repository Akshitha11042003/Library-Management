import { body, param } from "express-validator";
import { Role } from "../types";

export const createUserValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters.")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters.")
    .matches(/^[A-Za-z\s.]+$/)
    .withMessage("Name can only contain alphabetic letters, spaces, and periods."),
  body("role")
    .optional()
    .trim()
    .isIn(Object.values(Role))
    .withMessage(`Role must be one of: ${Object.values(Role).join(", ")}`),
];

export const updateUserValidator = [
  param("id")
    .isUUID(4)
    .withMessage("Invalid user ID format. Must be a valid UUIDv4."),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("password")
    .optional()
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be between 8 and 72 characters.")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters.")
    .matches(/^[A-Za-z\s.]+$/)
    .withMessage("Name can only contain alphabetic letters, spaces, and periods."),
  body("role")
    .optional()
    .trim()
    .isIn(Object.values(Role))
    .withMessage(`Role must be one of: ${Object.values(Role).join(", ")}`),
];

export const userIdParamValidator = [
  param("id")
    .isUUID(4)
    .withMessage("Invalid user ID format. Must be a valid UUIDv4."),
];
