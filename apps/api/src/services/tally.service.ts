import { prisma } from "../lib/prisma";
import { generateResultsCommitmentHash } from "../utils/crypto";
import { blockchainService } from "./blockchain.service";
import { logger } from "../utils/logger";
import { ElectionStatus } from "@prisma/client";

export interface CandidateTally {
  candidateId: string;
  fullName: string;
  partyList: string | null;
  photoUrl: string | null;
  voteCount: number;
  percentage: number;
  rank: number;
  isWinner: boolean;
}

export interface PositionTally {
  positionId: string;
  title: string;
  orderIndex: number;
  maxChoices: number;
  totalVotesCastInPosition: number;
  undervoteCount: number;
  candidates: CandidateTally[];
  isTie: boolean;
}

export interface ElectionTallyReport {
  electionId: string;
  electionTitle: string;
  status: ElectionStatus;
  totalEligibleVoters: number;
  totalBallotsAccepted: number;
  turnoutPercentage: number;
  positions: PositionTally[];
  resultCommitmentHash: string;
  blockchainTxHash?: string | null;
  publishedAt?: string | null;
  generatedAt: string;
}

export class TallyService {
  /**
   * Computes the complete tally and reconciliation report for an election.
   * Can be previewed by COMELEC officers when UNDER_REVIEW, and public when PUBLISHED.
   */
  async computeTally(electionId: string): Promise<ElectionTallyReport> {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        positions: {
          orderBy: { orderIndex: "asc" },
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

    // Total eligible voters
    const totalEligibleVoters = await prisma.voterEligibility.count({
      where: { electionId },
    });

    // Total accepted ballots
    const totalBallotsAccepted = await prisma.ballotSubmission.count({
      where: { electionId },
    });

    const turnoutPercentage =
      totalEligibleVoters > 0
        ? parseFloat(((totalBallotsAccepted / totalEligibleVoters) * 100).toFixed(2))
        : 0;

    // Fetch all choices cast in this election
    const allChoices = await prisma.ballotChoice.findMany({
      where: {
        submission: {
          electionId,
        },
      },
    });

    // Count votes per candidate
    const candidateVoteCounts = new Map<string, number>();
    for (const choice of allChoices) {
      candidateVoteCounts.set(
        choice.candidateId,
        (candidateVoteCounts.get(choice.candidateId) || 0) + 1
      );
    }

    const flatResultsForCommitment: Array<{
      positionId: string;
      candidateId: string;
      voteCount: number;
    }> = [];

    const positionsTally: PositionTally[] = [];

    for (const pos of election.positions) {
      let totalVotesInPosition = 0;
      const candidatesTally: CandidateTally[] = [];

      for (const cand of pos.candidates) {
        const votes = candidateVoteCounts.get(cand.id) || 0;
        totalVotesInPosition += votes;

        flatResultsForCommitment.push({
          positionId: pos.id,
          candidateId: cand.id,
          voteCount: votes,
        });

        candidatesTally.push({
          candidateId: cand.id,
          fullName: cand.fullName,
          partyList: cand.partyList,
          photoUrl: cand.photoUrl,
          voteCount: votes,
          percentage: 0, // calculated below
          rank: 1,
          isWinner: false,
        });
      }

      // Sort candidates descending by votes
      candidatesTally.sort((a, b) => b.voteCount - a.voteCount);

      // Assign percentages and rank
      candidatesTally.forEach((c, idx) => {
        c.percentage =
          totalVotesInPosition > 0
            ? parseFloat(((c.voteCount / totalVotesInPosition) * 100).toFixed(2))
            : 0;
        c.rank = idx + 1;
      });

      // Determine winners and check for ties
      let isTie = false;
      if (candidatesTally.length > 0 && totalVotesInPosition > 0) {
        const topVotes = candidatesTally[0].voteCount;
        const topCandidates = candidatesTally.filter((c) => c.voteCount === topVotes);

        if (topCandidates.length > pos.maxChoices) {
          isTie = true;
        } else {
          for (let i = 0; i < Math.min(pos.maxChoices, candidatesTally.length); i++) {
            if (candidatesTally[i].voteCount > 0) {
              candidatesTally[i].isWinner = true;
            }
          }
        }
      }

      const theoreticalMaxVotes = totalBallotsAccepted * pos.maxChoices;
      const undervoteCount = Math.max(0, theoreticalMaxVotes - totalVotesInPosition);

      positionsTally.push({
        positionId: pos.id,
        title: pos.title,
        orderIndex: pos.orderIndex,
        maxChoices: pos.maxChoices,
        totalVotesCastInPosition: totalVotesInPosition,
        undervoteCount,
        candidates: candidatesTally,
        isTie,
      });
    }

    // Generate cryptographic results commitment hash
    const resultCommitmentHash = generateResultsCommitmentHash(
      electionId,
      flatResultsForCommitment
    );

    return {
      electionId: election.id,
      electionTitle: election.title,
      status: election.status,
      totalEligibleVoters,
      totalBallotsAccepted,
      turnoutPercentage,
      positions: positionsTally,
      resultCommitmentHash,
      blockchainTxHash: election.resultCommitmentHash ? election.onChainElectionId : null,
      publishedAt: election.resultsPublishedAt ? election.resultsPublishedAt.toISOString() : null,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Finalizes the election and transitions status to PUBLISHED.
   * Commits results to PostgreSQL and to the blockchain contract.
   */
  async publishOfficialResults(electionId: string, officerUserId: string): Promise<ElectionTallyReport> {
    const report = await this.computeTally(electionId);

    // Save final snapshots to election_results table
    await prisma.$transaction(async (tx) => {
      // Clear any prior draft results
      await tx.electionResult.deleteMany({
        where: { electionId },
      });

      // Insert official finalized rows
      for (const pos of report.positions) {
        for (const cand of pos.candidates) {
          await tx.electionResult.create({
            data: {
              electionId,
              positionId: pos.positionId,
              candidateId: cand.candidateId,
              voteCount: cand.voteCount,
              rank: cand.rank,
              isWinner: cand.isWinner,
            },
          });
        }
      }

      // Update election status to PUBLISHED
      await tx.election.update({
        where: { id: electionId },
        data: {
          status: ElectionStatus.PUBLISHED,
          resultCommitmentHash: report.resultCommitmentHash,
          resultsPublishedAt: new Date(),
        },
      });

      // Record audit event
      await tx.auditLog.create({
        data: {
          userId: officerUserId,
          action: "RESULTS_PUBLISHED",
          entity: "Election",
          entityId: electionId,
          details: JSON.stringify({
            resultCommitmentHash: report.resultCommitmentHash,
            totalBallotsAccepted: report.totalBallotsAccepted,
            turnoutPercentage: report.turnoutPercentage,
          }),
        },
      });
    });

    // Finalize on-chain
    try {
      const onChainResult = await blockchainService.finalizeElectionOnChain(
        electionId,
        report.resultCommitmentHash,
        report.totalBallotsAccepted
      );
      if (onChainResult.success) {
        logger.info(`Results successfully sealed on blockchain: ${onChainResult.txHash}`);
      }
    } catch (err: any) {
      logger.warn(`Blockchain seal note: ${err.message}`);
    }

    return await this.computeTally(electionId);
  }
}

export const tallyService = new TallyService();
