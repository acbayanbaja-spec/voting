import { Router } from "express";
import { z } from "zod";
import { electionService } from "../services/election.service";
import { authenticate, authorize } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validation";
import { ElectionStatus, Role } from "@prisma/client";

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
    // Optional one-shot ballot setup so an election is never opened empty
    positions: z
      .array(
        z.object({
          title: z.string().min(2),
          description: z.string().optional(),
          orderIndex: z.number().int().min(0).optional(),
          maxChoices: z.number().int().min(1).default(1),
          isRequired: z.boolean().default(true),
          candidates: z
            .array(
              z.object({
                fullName: z.string().min(2),
                studentId: z.string().min(2),
                partyList: z.string().optional(),
                platform: z.string().min(5),
                photoUrl: z.string().url().optional().or(z.literal("")),
              })
            )
            .optional(),
        })
      )
      .optional(),
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

// DELETE election (COMELEC, ADMIN) — drafts and cancelled polls only
electionRouter.delete(
  "/:id",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const result = await electionService.deleteElection(req.params.id, req.user!.id);
      res.json({ success: true, data: result });
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
    orderIndex: z.number().int().min(0).optional(),
    maxChoices: z.number().int().min(1).default(1),
    isRequired: z.boolean().default(true),
  }),
};

const positionUpdateSchema = {
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    orderIndex: z.number().int().min(0).optional(),
    maxChoices: z.number().int().min(1).optional(),
    isRequired: z.boolean().optional(),
  }),
};

electionRouter.post(
  "/:id/positions",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(positionSchema),
  async (req, res, next) => {
    try {
      const position = await electionService.createPosition(
        req.params.id,
        req.body,
        req.user!.id
      );
      res.status(201).json({ success: true, data: position });
    } catch (err) {
      next(err);
    }
  }
);

electionRouter.patch(
  "/:id/positions/:positionId",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(positionUpdateSchema),
  async (req, res, next) => {
    try {
      const position = await electionService.updatePosition(
        req.params.id,
        req.params.positionId,
        req.body,
        req.user!.id
      );
      res.json({ success: true, data: position });
    } catch (err) {
      next(err);
    }
  }
);

electionRouter.delete(
  "/:id/positions/:positionId",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const result = await electionService.deletePosition(
        req.params.id,
        req.params.positionId,
        req.user!.id
      );
      res.json({ success: true, data: result });
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

const candidateUpdateSchema = {
  body: z.object({
    positionId: z.string().min(1).optional(),
    fullName: z.string().min(2).optional(),
    studentId: z.string().min(2).optional(),
    partyList: z.string().optional(),
    platform: z.string().min(5).optional(),
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
      const candidate = await electionService.createCandidate(
        req.params.id,
        req.body,
        req.user!.id
      );
      res.status(201).json({ success: true, data: candidate });
    } catch (err) {
      next(err);
    }
  }
);

electionRouter.patch(
  "/:id/candidates/:candidateId",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  validateRequest(candidateUpdateSchema),
  async (req, res, next) => {
    try {
      const candidate = await electionService.updateCandidate(
        req.params.id,
        req.params.candidateId,
        req.body,
        req.user!.id
      );
      res.json({ success: true, data: candidate });
    } catch (err) {
      next(err);
    }
  }
);

electionRouter.delete(
  "/:id/candidates/:candidateId",
  authenticate,
  authorize([Role.COMELEC_OFFICER, Role.SYSTEM_ADMIN]),
  async (req, res, next) => {
    try {
      const result = await electionService.deleteCandidate(
        req.params.id,
        req.params.candidateId,
        req.user!.id
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);
