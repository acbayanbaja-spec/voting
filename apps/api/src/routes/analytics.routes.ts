import { Router } from "express";
import { analyticsService } from "../services/analytics.service";
import { authenticate, authorize } from "../middlewares/auth";
import { Role } from "@prisma/client";

export const analyticsRouter = Router();

// GET /:electionId/overview - Real-time election statistics
analyticsRouter.get(
  "/:electionId/overview",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const stats = await analyticsService.getElectionOverview(req.params.electionId);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
);
