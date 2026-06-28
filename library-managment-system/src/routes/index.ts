import { Router } from "express";
import authRoutes from "./auth.routes";
import bookRoutes from "./book.routes";
import borrowRoutes from "./borrow.routes";
import memberRoutes from "./member.routes";

const router = Router();

// Namespace all domain routes
router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/borrows", borrowRoutes);
router.use("/members", memberRoutes);

export default router;
