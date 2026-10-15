import { Router } from "express";
import { voterService } from "../services/voter.service";
import { authenticate, authorize } from "../middlewares/auth";
import { Role } from "@prisma/client";

export const voterRouter = Router();

// GET /:electionId - List eligible voters
voterRouter.get(
  "/:electionId",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string | undefined;

      const result = await voterService.getEligibleVoters(req.params.electionId, page, limit, search);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:electionId/import-csv - Bulk import eligible voters from CSV
voterRouter.post(
  "/:electionId/import-csv",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const { csvContent } = req.body;
      if (!csvContent || typeof csvContent !== "string") {
        res.status(400).json({
          success: false,
          error: { message: "csvContent string is required in request body." },
        });
        return;
      }

      const result = await voterService.importVotersFromCsv(
        req.params.electionId,
        csvContent,
        req.user!.id
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /:electionId/export-csv - Download sanitized voter roster
voterRouter.get(
  "/:electionId/export-csv",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const csv = await voterService.exportVoterRosterCsv(req.params.electionId);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="voters-${req.params.electionId}.csv"`
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);
