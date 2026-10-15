import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { config } from "./config";
import { errorHandler } from "./middlewares/error";

// Route imports
import { authRouter } from "./routes/auth.routes";
import { electionRouter } from "./routes/election.routes";
import { ballotRouter } from "./routes/ballot.routes";
import { receiptRouter } from "./routes/receipt.routes";
import { resultRouter } from "./routes/result.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { voterRouter } from "./routes/voter.routes";
import { announcementRouter } from "./routes/announcement.routes";
import { blockchainRouter } from "./routes/blockchain.routes";
import { auditRouter } from "./routes/audit.routes";
import { healthRouter } from "./routes/health.routes";
import { userRouter } from "./routes/user.routes";

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS setup
  const allowedOrigins = [
    config.frontendOrigin,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
    })
  );

  // 3. Request Correlation ID
  app.use((req: Request, res: Response, next: NextFunction) => {
    const correlationId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
    res.setHeader("x-request-id", correlationId);
    next();
  });

  // 4. Rate Limiting (100 req/min general, stricter for login)
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please slow down and try again.",
      },
    },
  });
  app.use("/api/", generalLimiter);

  // Stricter rate limiting for authentication
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts
    message: {
      success: false,
      error: {
        code: "AUTH_RATE_LIMIT",
        message: "Too many login attempts. Please wait 15 minutes before trying again.",
      },
    },
  });
  app.use("/api/v1/auth/login", authLimiter);

  // 5. Body Parsers with payload size limits
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // 6. Request Logging
  if (config.env !== "test") {
    app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));
  }

  // 7. Mount API Routes
  const apiPrefix = "/api/v1";
  app.use(`${apiPrefix}/auth`, authRouter);
  app.use(`${apiPrefix}/users`, userRouter);
  app.use(`${apiPrefix}/elections`, electionRouter);
  app.use(`${apiPrefix}/ballots`, ballotRouter);
  app.use(`${apiPrefix}/receipts`, receiptRouter);
  app.use(`${apiPrefix}/results`, resultRouter);
  app.use(`${apiPrefix}/analytics`, analyticsRouter);
  app.use(`${apiPrefix}/voters`, voterRouter);
  app.use(`${apiPrefix}/announcements`, announcementRouter);
  app.use(`${apiPrefix}/blockchain`, blockchainRouter);
  app.use(`${apiPrefix}/audit-logs`, auditRouter);
  app.use(`${apiPrefix}/health`, healthRouter);

  // Root welcome / doc endpoint
  app.get("/", (req: Request, res: Response) => {
    res.json({
      name: "SEAIT Online Voting Management System API",
      institution: "South East Asian Institute of Technology, Inc.",
      version: "1.0.0",
      documentation: "/api/docs",
      healthCheck: "/api/v1/health",
    });
  });

  // 8. 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.originalUrl} not found.`,
      },
    });
  });

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
