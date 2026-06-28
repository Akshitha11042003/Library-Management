import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import compression from "compression";
import router from "./routes";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { AppError } from "./utils/AppError";
import { logger } from "./utils/logger";

const app = express();

// 1. Establish security headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
      },
    },
  })
);

// 2. Configure Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: "*", // Adjust as necessary for deployment policies
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Rate Limiting to prevent brute-force and resource flooding
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: "fail",
    message: "Too many requests from this IP address. Please try again after 15 minutes.",
  },
});

// Apply rate limiter specifically to API endpoints
app.use("/api", apiLimiter);

// 4. Compress HTTP response payloads
app.use(compression());

// 5. Request payload parsing with safe body-size limits
app.use(express.json({ limit: "10kb" })); // Max body size of 10KB
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 6. Request Logger Middleware using Morgan
app.use(
  morgan("dev", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// 7. Mount consolidated API routes
app.use("/api", router);

// 8. Handle Unrouted Endpoint Traps (Catch-All 404 for API)
app.all("/api/*", notFoundHandler);

// 9. Register Centralized Global Error Handler
app.use(globalErrorHandler);

export default app;
