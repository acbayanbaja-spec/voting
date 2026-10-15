import { prisma } from "../lib/prisma";
import {
  generateSalt,
  generateCommitmentHash,
  generateReceiptReference,
  generateVerificationCode,
  encryptBallot,
} from "../utils/crypto";
import { blockchainService } from "./blockchain.service";
import { logger } from "../utils/logger";
import { ElectionStatus, BlockchainStatus } from "@prisma/client";

export interface BallotSelection {
  positionId: string;
  candidateId: string;
}

export interface CastBallotInput {
  electionId: string;
  userId: string;
  selections: BallotSelection[];
}

export interface CastBallotResponse {
  receiptReference: string;
  verificationCode: string;
  ballotCommitmentHash: string;
  blockchainTxHash: string;
  blockchainStatus: BlockchainStatus;
  submittedAt: string;
}

export class BallotService {
  async castBallot(input: CastBallotInput): Promise<CastBallotResponse> {
    const { electionId, userId, selections } = input;

    // 1. Validate Election
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        positions: {
          include: {
            candidates: true,
          },
        },
      },
    });

    if (!election) {
      const err: any = new Error("Election not found.");
      err.statusCode = 404;
      err.code = "ELECTION_NOT_FOUND";
      throw err;
    }

    if (election.status !== ElectionStatus.OPEN) {
      const err: any = new Error(
        `Voting is not permitted. Current election status is ${election.status}.`
      );
      err.statusCode = 400;
      err.code = "ELECTION_NOT_OPEN";
      throw err;
    }

    const now = new Date();
    if (now < election.startTime || now > election.endTime) {
      const err: any = new Error("Current time is outside the authorized voting window.");
      err.statusCode = 400;
      err.code = "OUTSIDE_VOTING_WINDOW";
      throw err;
    }

    // 2. Validate Voter Eligibility and Duplicate Prevention
    const eligibility = await prisma.voterEligibility.findUnique({
      where: {
        electionId_userId: {
          electionId,
          userId,
        },
      },
    });

    if (!eligibility) {
      const err: any = new Error("You are not registered as an eligible voter for this election.");
      err.statusCode = 403;
      err.code = "VOTER_NOT_ELIGIBLE";
      throw err;
    }

    if (eligibility.hasVoted) {
      const err: any = new Error(
        "A ballot has already been cast and recorded for your account in this election."
      );
      err.statusCode = 409;
      err.code = "DUPLICATE_VOTE_ATTEMPT";
      throw err;
    }

    // 3. Validate Position Rules and Selections
    const positionMap = new Map(election.positions.map((p) => [p.id, p]));
    const candidateMap = new Map();
    election.positions.forEach((p) => {
      p.candidates.forEach((c) => candidateMap.set(c.id, { candidate: c, positionId: p.id }));
    });

    const choicesByPosition = new Map<string, string[]>();
    for (const sel of selections) {
      const pos = positionMap.get(sel.positionId);
      if (!pos) {
        const err: any = new Error(`Invalid position ID: ${sel.positionId}`);
        err.statusCode = 400;
        err.code = "INVALID_POSITION";
        throw err;
      }

      const candInfo = candidateMap.get(sel.candidateId);
      if (!candInfo || candInfo.positionId !== sel.positionId) {
        const err: any = new Error(
          `Candidate ${sel.candidateId} does not belong to position ${pos.title}.`
        );
        err.statusCode = 400;
        err.code = "INVALID_CANDIDATE";
        throw err;
      }

      const existing = choicesByPosition.get(sel.positionId) || [];
      if (existing.includes(sel.candidateId)) {
        const err: any = new Error(`Candidate selected multiple times for position ${pos.title}.`);
        err.statusCode = 400;
        err.code = "DUPLICATE_CANDIDATE_SELECTION";
        throw err;
      }

      existing.push(sel.candidateId);
      choicesByPosition.set(sel.positionId, existing);
    }

    // Check limits per position
    for (const pos of election.positions) {
      const count = (choicesByPosition.get(pos.id) || []).length;
      if (pos.isRequired && count === 0) {
        const err: any = new Error(`Selection is required for position: ${pos.title}.`);
        err.statusCode = 400;
        err.code = "MISSING_REQUIRED_POSITION";
        throw err;
      }
      if (count > pos.maxChoices) {
        const err: any = new Error(
          `Exceeded maximum choices for ${pos.title}. Allowed: ${pos.maxChoices}, selected: ${count}.`
        );
        err.statusCode = 400;
        err.code = "CHOICE_LIMIT_EXCEEDED";
        throw err;
      }
    }

    // 4. Generate Cryptographic Artifacts
    const salt = generateSalt();
    const commitmentHash = generateCommitmentHash(electionId, selections, salt);
    const receiptReference = generateReceiptReference();
    const verificationCode = generateVerificationCode(receiptReference, commitmentHash);

    // Encrypt sensitive ballot with AES-256-GCM
    const encryptedBallot = encryptBallot({
      electionId,
      selections,
      salt,
      timestamp: now.toISOString(),
    });

    // 5. Submit to Blockchain Ledger
    let blockchainResult = await blockchainService.recordVoteCommitment(
      electionId,
      commitmentHash,
      receiptReference
    );

    const blockchainStatus =
      blockchainResult.status === "CONFIRMED"
        ? BlockchainStatus.CONFIRMED
        : BlockchainStatus.PENDING;

    // 6. Atomic Database Transaction with Strict Privacy Separation
    const submissionResult = await prisma.$transaction(async (tx) => {
      // Re-verify eligibility within transaction lock
      const lockedEligibility = await tx.voterEligibility.findUnique({
        where: {
          electionId_userId: {
            electionId,
            userId,
          },
        },
      });

      if (!lockedEligibility || lockedEligibility.hasVoted) {
        const err: any = new Error("Vote collision detected. A ballot was already accepted.");
        err.statusCode = 409;
        err.code = "CONCURRENT_VOTE_COLLISION";
        throw err;
      }

      // Mark voter as hasVoted. Store receiptReference so student can re-view their receipt.
      // NOTE: candidate selections are NOT linked to this record!
      await tx.voterEligibility.update({
        where: { id: lockedEligibility.id },
        data: {
          hasVoted: true,
          votedAt: now,
          receiptReference,
        },
      });

      // Create BallotSubmission without userId foreign key
      const submission = await tx.ballotSubmission.create({
        data: {
          electionId,
          ballotCommitmentHash: commitmentHash,
          receiptReference,
          encryptedBallot,
          blockchainTxHash: blockchainResult.txHash,
          blockchainStatus,
          blockNumber: blockchainResult.blockNumber,
          submittedAt: now,
          choices: {
            create: selections.map((s) => ({
              positionId: s.positionId,
              candidateId: s.candidateId,
            })),
          },
        },
      });

      // Create Receipt
      await tx.receipt.create({
        data: {
          receiptReference,
          electionId,
          ballotCommitmentHash: commitmentHash,
          blockchainTxHash: blockchainResult.txHash,
          blockchainStatus,
          blockNumber: blockchainResult.blockNumber,
          verificationCode,
          createdAt: now,
        },
      });

      // Audit Log (records only non-identifying transaction metadata)
      await tx.auditLog.create({
        data: {
          userId,
          action: "BALLOT_CAST",
          entity: "Election",
          entityId: electionId,
          details: JSON.stringify({
            receiptReference,
            blockchainTxHash: blockchainResult.txHash,
            blockchainStatus,
          }),
        },
      });

      return submission;
    });

    logger.info(`Ballot successfully cast. Receipt: ${receiptReference}, Tx: ${blockchainResult.txHash}`);

    return {
      receiptReference,
      verificationCode,
      ballotCommitmentHash: commitmentHash,
      blockchainTxHash: blockchainResult.txHash,
      blockchainStatus,
      submittedAt: submissionResult.submittedAt.toISOString(),
    };
  }
}

export const ballotService = new BallotService();
