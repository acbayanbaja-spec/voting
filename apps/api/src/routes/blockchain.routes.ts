import { Router } from "express";
import { blockchainService } from "../services/blockchain.service";
import { prisma } from "../lib/prisma";

export const blockchainRouter = Router();

// GET /status - Network connectivity and contract details
blockchainRouter.get("/status", async (req, res, next) => {
  try {
    const status = await blockchainService.getStatus();
    const totalTransactions = await prisma.ballotSubmission.count();
    const confirmedTransactions = await prisma.ballotSubmission.count({
      where: { blockchainStatus: "CONFIRMED" },
    });
    const pendingTransactions = await prisma.ballotSubmission.count({
      where: { blockchainStatus: "PENDING" },
    });

    res.json({
      success: true,
      data: {
        ...status,
        metrics: {
          totalTransactions,
          confirmedTransactions,
          pendingTransactions,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});
