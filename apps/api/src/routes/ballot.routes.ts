import { Router } from "express";
import { z } from "zod";
import { ballotService } from "../services/ballot.service";
import { authenticate, authorize } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validation";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const ballotRouter = Router();

const castBallotSchema = {
  body: z.object({
    electionId: z.string().min(1, "Election ID is required"),
    selections: z
      .array(
        z.object({
          positionId: z.string().min(1, "Position ID is required"),
          candidateId: z.string().min(1, "Candidate ID is required"),
        })
      )
      .min(1, "At least one candidate selection is required"),
  }),
};

// POST /cast - Cast a secure ballot
ballotRouter.post(
  "/cast",
  authenticate,
  authorize([Role.STUDENT]),
  validateRequest(castBallotSchema),
  async (req, res, next) => {
    try {
      const { electionId, selections } = req.body;
      const result = await ballotService.castBallot({
        electionId,
        userId: req.user!.id,
        selections,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /eligibility/:electionId - Check current user's eligibility and vote status
ballotRouter.get(
  "/eligibility/:electionId",
  authenticate,
  async (req, res, next) => {
    try {
      const eligibility = await prisma.voterEligibility.findUnique({
        where: {
          electionId_userId: {
            electionId: req.params.electionId,
            userId: req.user!.id,
          },
        },
      });

      res.json({
        success: true,
        data: {
          isEligible: !!eligibility,
          hasVoted: eligibility ? eligibility.hasVoted : false,
          votedAt: eligibility?.votedAt || null,
          receiptReference: eligibility?.receiptReference || null,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
