import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { registerValidator, loginValidator } from "../validators/auth.validator";
import { validateRequest } from "../middlewares/validate.middleware";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registers a new member profile
 * @access  Public
 */
router.post("/register", registerValidator, validateRequest, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticates credentials and signs session tokens
 * @access  Public
 */
router.post("/login", loginValidator, validateRequest, AuthController.login);

export default router;
