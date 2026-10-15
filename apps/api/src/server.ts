import "./config"; // Load and sanitize environment variables first
import { createApp } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { prisma } from "./lib/prisma";

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`=======================================================`);
  logger.info(`SEAIT Online Voting System API Server`);
  logger.info(`Institution: South East Asian Institute of Technology, Inc.`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Listening on port: ${config.port}`);
  logger.info(`API Base URL: http://localhost:${config.port}/api/v1`);
  logger.info(`=======================================================`);
});

// Graceful shutdown handling for Render and container environments
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await prisma.$disconnect();
      logger.info("Database connection closed.");
      process.exit(0);
    } catch (err: any) {
      logger.error("Error during database disconnection:", err);
      process.exit(1);
    }
  });

  // Force exit after 10s timeout
  setTimeout(() => {
    logger.error("Forceful shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
