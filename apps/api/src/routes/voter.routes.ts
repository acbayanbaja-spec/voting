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
      const status = req.query.status as string | undefined;

      const result = await voterService.getEligibleVoters(
        req.params.electionId,
        page,
        limit,
        search,
        status
      );
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

// PATCH /:electionId/eligibility/:eligibilityId - Approve or reject one voter
voterRouter.patch(
  "/:electionId/eligibility/:eligibilityId",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const { decision } = req.body;
      if (decision !== "APPROVED" && decision !== "REJECTED") {
        res.status(400).json({
          success: false,
          error: { message: "decision must be APPROVED or REJECTED." },
        });
        return;
      }

      const updated = await voterService.reviewEligibility(
        req.params.electionId,
        req.params.eligibilityId,
        decision,
        req.user!.id
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:electionId/approve-all - Approve every pending voter in the queue
voterRouter.post(
  "/:electionId/approve-all",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const result = await voterService.approveAllPending(req.params.electionId, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:electionId/enroll-all - Add every registered student as approved voter
voterRouter.post(
  "/:electionId/enroll-all",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const result = await voterService.enrollAllStudents(req.params.electionId, req.user!.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);
