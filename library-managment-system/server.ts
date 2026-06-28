import "dotenv/config";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import app from "./src/express";
import { prisma } from "./src/config/db";
import { logger } from "./src/utils/logger";
import { seedDatabase } from "./src/utils/seeder";

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  // 0. Seed database if unpopulated
  await seedDatabase();

  // 1. Integrates Vite dev server middleware in non-production mode
  if (process.env.NODE_ENV !== "production") {
    logger.info("Starting development server. Mounting Vite middleware...");
    
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Mount Vite dev server middleware at the end of the Express application pipelines,
    // so API routes (/api/*) are matched first, and everything else falls back to Vite/React!
    app.use(vite.middlewares);
  } else {
    // 2. Serves static files and indices from /dist in production mode
    logger.info("Starting production server. Serving static compiled assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    // Fallback route inside production to route SPA navigation back to index.html
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 4. Start the Express http server listening on host 0.0.0.0 and port 3000
  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    logger.info(`[Server]: Full-stack engine running on http://localhost:${PORT}`);
  });

  // 5. Setup graceful shutdown triggers to prevent orphan processes
  process.on("unhandledRejection", (err: any) => {
    logger.error("Unhandled Promise Rejection caught at process-level", err);
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (err: any) => {
    logger.error("Uncaught System Exception caught at process-level", err);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM shutdown command received. Closing connections gracefully...");
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("Prisma disconnected. Server shut down successfully.");
      process.exit(0);
    });
  });
}

bootstrap().catch((error) => {
  logger.error("Fatal exception during server boot synchronization", error);
  process.exit(1);
});
