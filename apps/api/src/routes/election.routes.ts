import { Router } from "express";
import { z } from "zod";
import { electionService } from "../services/election.service";
import { authenticate, authorize } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validation";
import { ElectionStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const electionRouter = Router();

// GET all elections
electionRouter.get("/", async (req, res, next) => {
  try {
    const status = req.query.status as ElectionStatus | undefined;
    const search = req.query.search as string | undefined;
    const elections = await electionService.getElections({ status, search });
    res.json({ success: true, data: elections });
  } catch (err) {
    next(err);
  }
});

// GET single election details
electionRouter.get("/:id", async (req, res, next) => {
  try {
    const election = await electionService.getElectionById(req.params.id);
    res.json({ success: true, data: election });
  } catch (err) {
    next(err);
  }
});

// CREATE election (COMELEC, ADMIN)
const createElectionSchema = {
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(5),
    academicYear: z.string().min(4),
    semester: z.string().min(3),
    startTime: z.string().transform((str) => new Date(str)),
    endTime: z.string().transform((str) => new Date(str)),
  }),
};

electionRouter.post(
  "/",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(createElectionSchema),
  async (req, res, next) => {
    try {
      const created = await electionService.createElection(req.body, req.user!.id);
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE election (COMELEC, ADMIN)
const updateElectionSchema = {
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(5).optional(),
    academicYear: z.string().min(4).optional(),
    semester: z.string().min(3).optional(),
    startTime: z.string().transform((str) => new Date(str)).optional(),
    endTime: z.string().transform((str) => new Date(str)).optional(),
  }),
};

electionRouter.put(
  "/:id",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(updateElectionSchema),
  async (req, res, next) => {
    try {
      const updated = await electionService.updateElection(req.params.id, req.body, req.user!.id);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// CHANGE election status (COMELEC, ADMIN)
const statusSchema = {
  body: z.object({
    status: z.nativeEnum(ElectionStatus),
    reason: z.string().optional(),
  }),
};

electionRouter.patch(
  "/:id/status",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(statusSchema),
  async (req, res, next) => {
    try {
      const updated = await electionService.transitionStatus(
        req.params.id,
        req.body.status,
        req.user!.id,
        req.body.reason
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// ADD Position to Election
const positionSchema = {
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    orderIndex: z.number().int().default(0),
    maxChoices: z.number().int().min(1).default(1),
    isRequired: z.boolean().default(true),
  }),
};

electionRouter.post(
  "/:id/positions",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(positionSchema),
  async (req, res, next) => {
    try {
      const position = await prisma.position.create({
        data: {
          electionId: req.params.id,
          ...req.body,
        },
      });
      res.status(201).json({ success: true, data: position });
    } catch (err) {
      next(err);
    }
  }
);

// ADD Candidate to Election
const candidateSchema = {
  body: z.object({
    positionId: z.string().min(1, "Position ID is required"),
    fullName: z.string().min(2),
    studentId: z.string().min(2),
    partyList: z.string().optional(),
    platform: z.string().min(5),
    photoUrl: z.string().url().optional().or(z.literal("")),
  }),
};

electionRouter.post(
  "/:id/candidates",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(candidateSchema),
  async (req, res, next) => {
    try {
      const candidate = await prisma.candidate.create({
        data: {
          electionId: req.params.id,
          ...req.body,
        },
      });
      res.status(201).json({ success: true, data: candidate });
    } catch (err) {
      next(err);
    }
  }
);
