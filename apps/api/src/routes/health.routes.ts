import { Router } from "express";
import { prisma } from "../lib/prisma";
import { blockchainService } from "../services/blockchain.service";

export const healthRouter = Router();

// GET / - System health check
healthRouter.get("/", async (req, res) => {
  let dbStatus = "UP";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "DOWN";
  }

  const blockchainStatus = await blockchainService.getStatus();

  const healthData = {
    service: "seait-voting-api",
    status: dbStatus === "UP" ? "HEALTHY" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      engine: "PostgreSQL",
    },
    blockchain: {
      connected: blockchainStatus.connected,
      networkChainId: blockchainStatus.chainId,
      contractAddress: blockchainStatus.contractAddress,
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  };

  const statusCode = dbStatus === "UP" ? 200 : 503;
  res.status(statusCode).json(healthData);
});
