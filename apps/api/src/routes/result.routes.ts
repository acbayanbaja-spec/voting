import { Router } from "express";
import jwt from "jsonwebtoken";
import { tallyService } from "../services/tally.service";
import { authenticate, authorize } from "../middlewares/auth";
import { config } from "../config";
import { Role, ElectionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const resultRouter = Router();

// GET /:electionId - Get results for an election
resultRouter.get("/:electionId", async (req, res, next) => {
  try {
    const election = await prisma.election.findUnique({
      where: { id: req.params.electionId },
      select: { status: true },
    });

    if (!election) {
      res.status(404).json({ success: false, error: { message: "Election not found." } });
      return;
    }

    // Only allow public viewing if PUBLISHED; unpublished tallies are restricted
    // to COMELEC officers and system administrators (verified, not just any token).
    if (election.status !== ElectionStatus.PUBLISHED) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(403).json({
          success: false,
          error: {
            code: "RESULTS_NOT_PUBLISHED",
            message: "Election results have not been officially published yet.",
          },
        });
        return;
      }

      // Verify the presented token actually belongs to an authorized officer
      try {
        const decoded = jwt.verify(
          authHeader.split(" ")[1],
          config.jwtSecret
        ) as { userId: string };
        const officer = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true, isActive: true },
        });
        if (!officer || !officer.isActive || (officer.role !== "COMELEC_OFFICER" && officer.role !== "SYSTEM_ADMIN")) {
          res.status(403).json({
            success: false,
            error: {
              code: "RESULTS_NOT_PUBLISHED",
              message: "Election results have not been officially published yet.",
            },
          });
          return;
        }
      } catch {
        res.status(403).json({
          success: false,
          error: {
            code: "RESULTS_NOT_PUBLISHED",
            message: "Election results have not been officially published yet.",
          },
        });
        return;
      }
    }

    const report = await tallyService.computeTally(req.params.electionId);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// POST /:electionId/publish - COMELEC officers finalize and publish official results
resultRouter.post(
  "/:electionId/publish",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const published = await tallyService.publishOfficialResults(
        req.params.electionId,
        req.user!.id
      );
      res.json({ success: true, data: published });
    } catch (err) {
      next(err);
    }
  }
);
