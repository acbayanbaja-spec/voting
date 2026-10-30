import { prisma } from "../lib/prisma";
import { ElectionStatus, Position } from "@prisma/client";
import { logger } from "../utils/logger";
import { tallyService } from "./tally.service";
import { voterService } from "./voter.service";

export interface PositionInput {
  title: string;
  description?: string;
  orderIndex?: number;
  maxChoices?: number;
  isRequired?: boolean;
}

export interface CandidateInput {
  positionId: string;
  fullName: string;
  studentId: string;
  partyList?: string;
  platform: string;
  photoUrl?: string;
}

export interface CreateElectionInput {
  title: string;
  description: string;
  academicYear: string;
  semester: string;
  startTime: Date;
  endTime: Date;
  enrollAllStudents?: boolean;
  positions?: Array<PositionInput & { candidates?: Array<Omit<CandidateInput, "positionId">> }>;
}

/**
 * Results are official (PUBLISHED) or the election was called off (CANCELLED),
 * so the ballot may no longer be touched at all. Before that, COMELEC may edit
 * the ballot only while zero ballots have been cast: deleting a candidate once
 * votes exist would cascade away the BallotChoice rows printed on voter
 * receipts, so the first recorded vote freezes it.
 */
const BALLOT_FROZEN: ElectionStatus[] = [ElectionStatus.PUBLISHED, ElectionStatus.CANCELLED];

export interface UpdateElectionInput {
  title?: string;
  description?: string;
  academicYear?: string;
  semester?: string;
  startTime?: Date;
  endTime?: Date;
}

export class ElectionService {
  async getElections(filter?: { status?: ElectionStatus; search?: string }) {
    const where: any = {};
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.search) {
      where.OR = [
        { title: { contains: filter.search, mode: "insensitive" } },
        { description: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    return prisma.election.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            positions: true,
            candidates: true,
            voterEligibilities: true,
            ballotSubmissions: true,
          },
        },
      },
    });
  }

  async getElectionById(id: string) {
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        positions: {
          orderBy: { orderIndex: "asc" },
          include: {
            candidates: {
              orderBy: { fullName: "asc" },
            },
          },
        },
        _count: {
          select: {
            voterEligibilities: true,
            ballotSubmissions: true,
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

    return election;
  }

  async createElection(input: CreateElectionInput, officerUserId: string) {
    if (input.startTime >= input.endTime) {
      const err: any = new Error("Election start time must be before end time.");
      err.statusCode = 400;
      err.code = "INVALID_TIME_WINDOW";
      throw err;
    }

    const created = await prisma.election.create({
      data: {
        title: input.title,
        description: input.description,
        academicYear: input.academicYear,
        semester: input.semester,
        startTime: input.startTime,
        endTime: input.endTime,
        status: ElectionStatus.DRAFT,
      },
    });

    // Candidate rows carry their own election relation next to positionId, so the
    // ballot is assembled after the election id exists rather than in one nested write.
    if (input.positions && input.positions.length > 0) {
      await Promise.all(
        input.positions.map((position, index) =>
          prisma.position.create({
            data: {
              electionId: created.id,
              title: position.title,
              description: position.description,
              orderIndex: position.orderIndex ?? index + 1,
              maxChoices: position.maxChoices ?? 1,
              isRequired: position.isRequired ?? true,
            },
          }).then((positionRow) =>
            position.candidates && position.candidates.length > 0
              ? prisma.candidate.createMany({
                  data: position.candidates.map((candidate) => ({
                    electionId: created.id,
                    positionId: positionRow.id,
                    fullName: candidate.fullName,
                    studentId: candidate.studentId,
                    partyList: candidate.partyList,
                    platform: candidate.platform,
                    photoUrl: candidate.photoUrl || null,
                  })),
                })
              : Promise.resolve(undefined)
          )
        )
      );
    }

    // A poll that nobody is on the roster for looks identical to a broken system
    // from a student's phone, so COMELEC can hand the whole active student body a
    // ballot in the same action that creates it. Later registrants still land in
    // the approval queue instead of being silently auto-added.
    if (input.enrollAllStudents) {
      await voterService.enrollAllStudents(created.id, officerUserId);
    }

    const election = await this.getElectionById(created.id);

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "ELECTION_CREATED",
        entity: "Election",
        entityId: election.id,
        details: JSON.stringify({
          title: input.title,
          academicYear: input.academicYear,
          positions: election.positions.length,
          candidates: election.positions.reduce(
            (sum: number, p: { candidates: unknown[] }) => sum + p.candidates.length,
            0
          ),
        }),
      },
    });

    return election;
  }

  async updateElection(id: string, input: UpdateElectionInput, officerUserId: string) {
    const existing = await this.getElectionById(id);

    if (existing.status === ElectionStatus.PUBLISHED || existing.status === ElectionStatus.CLOSED) {
      const err: any = new Error("Cannot modify an election that is already closed or published.");
      err.statusCode = 400;
      err.code = "ELECTION_LOCKED";
      throw err;
    }

    const updated = await prisma.election.update({
      where: { id },
      data: input,
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "ELECTION_UPDATED",
        entity: "Election",
        entityId: id,
        details: JSON.stringify(input),
      },
    });

    return updated;
  }

  async transitionStatus(
    id: string,
    newStatus: ElectionStatus,
    officerUserId: string,
    reason?: string
  ) {
    const election = await this.getElectionById(id);
    const validTransitions: Record<ElectionStatus, ElectionStatus[]> = {
      [ElectionStatus.DRAFT]: [ElectionStatus.SCHEDULED, ElectionStatus.OPEN, ElectionStatus.CANCELLED],
      [ElectionStatus.SCHEDULED]: [ElectionStatus.OPEN, ElectionStatus.CANCELLED],
      [ElectionStatus.OPEN]: [ElectionStatus.CLOSED, ElectionStatus.CANCELLED],
      [ElectionStatus.CLOSED]: [ElectionStatus.UNDER_REVIEW, ElectionStatus.CANCELLED],
      [ElectionStatus.UNDER_REVIEW]: [ElectionStatus.PUBLISHED, ElectionStatus.CANCELLED],
      [ElectionStatus.PUBLISHED]: [],
      [ElectionStatus.CANCELLED]: [],
    };

    if (!validTransitions[election.status].includes(newStatus)) {
      const err: any = new Error(
        `Invalid election state transition from ${election.status} to ${newStatus}.`
      );
      err.statusCode = 400;
      err.code = "INVALID_STATE_TRANSITION";
      throw err;
    }

    if (newStatus === ElectionStatus.OPEN) {
      if (election.positions.length === 0) {
        const err: any = new Error(
          "Add at least one position and candidate before opening the polls."
        );
        err.statusCode = 400;
        err.code = "BALLOT_NOT_CONFIGURED";
        throw err;
      }
      const unpopulated = election.positions.filter((p) => p.candidates.length === 0);
      if (unpopulated.length > 0) {
        const err: any = new Error(
          `These positions have no candidates yet: ${unpopulated
            .map((p) => p.title)
            .join(", ")}. Add candidates or remove the positions before opening the polls.`
        );
        err.statusCode = 400;
        err.code = "BALLOT_NOT_CONFIGURED";
        throw err;
      }
      if (election.endTime.getTime() <= Date.now()) {
        const err: any = new Error(
          "The voting window for this election has already ended. Update the schedule before opening the polls."
        );
        err.statusCode = 400;
        err.code = "VOTING_WINDOW_EXPIRED";
        throw err;
      }
    }

    const data: any = { status: newStatus };
    if (newStatus === ElectionStatus.CLOSED) {
      data.closedAt = new Date();
      // Seal the tally the moment polls close, so officers see certified
      // numbers without waiting for manual publication.
      try {
        const tally = await tallyService.computeTally(id);
        data.resultCommitmentHash = tally.resultCommitmentHash;
      } catch (err: any) {
        logger.warn(`Tally seal skipped for election ${id}: ${err.message}`);
      }
    }

    const updated = await prisma.election.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: `ELECTION_STATUS_${newStatus}`,
        entity: "Election",
        entityId: id,
        details: JSON.stringify({ previousStatus: election.status, newStatus, reason }),
      },
    });

    if (data.resultCommitmentHash) {
      await prisma.auditLog.create({
        data: {
          userId: officerUserId,
          action: "ELECTION_TALLY_SEALED",
          entity: "Election",
          entityId: id,
          details: JSON.stringify({ resultCommitmentHash: data.resultCommitmentHash }),
        },
      });
    }

    return updated;
  }

  async deleteElection(id: string, officerUserId: string) {
    const election = await this.getElectionById(id);

    if (election.status === ElectionStatus.PUBLISHED) {
      const err: any = new Error(
        "Published results are the official record and cannot be deleted. Keep the election instead of removing it."
      );
      err.statusCode = 409;
      err.code = "ELECTION_NOT_DELETABLE";
      throw err;
    }

    if (election._count.ballotSubmissions > 0) {
      const err: any = new Error(
        "This election already holds recorded ballots and cannot be deleted."
      );
      err.statusCode = 409;
      err.code = "ELECTION_HAS_BALLOTS";
      throw err;
    }

    await prisma.election.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "ELECTION_DELETED",
        entity: "Election",
        entityId: id,
        details: JSON.stringify({ title: election.title, status: election.status }),
      },
    });

    return { deleted: true, id };
  }

  // ---------------------------------------------------------------------------
  // Ballot setup: positions and candidates
  // ---------------------------------------------------------------------------

  private assertBallotEditable(election: {
    id: string;
    status: ElectionStatus;
    _count?: { ballotSubmissions?: number };
  }) {
    if (BALLOT_FROZEN.includes(election.status)) {
      const err: any = new Error(
        `The ballot is frozen because this election is ${election.status}.`
      );
      err.statusCode = 409;
      err.code = "BALLOT_LOCKED";
      throw err;
    }

    const cast = election._count?.ballotSubmissions ?? 0;
    if (cast > 0) {
      const err: any = new Error(
        `The ballot is frozen because ${cast} ballot${cast === 1 ? " has" : "s have"} already been cast in this election.`
      );
      err.statusCode = 409;
      err.code = "BALLOT_LOCKED";
      throw err;
    }
  }

  /**
   * The seal written when polls close binds results to the ballot, so editing
   * the ballot afterwards must re-derive it. Best-effort, like the close seal.
   */
  private async resealTally(electionId: string) {
    try {
      const tally = await tallyService.computeTally(electionId);
      await prisma.election.update({
        where: { id: electionId },
        data: { resultCommitmentHash: tally.resultCommitmentHash },
      });
    } catch (err: any) {
      logger.warn(`Tally re-seal skipped for election ${electionId}: ${err.message}`);
    }
  }

  private async getOwnedPosition(electionId: string, positionId: string): Promise<Position> {
    const position = await prisma.position.findUnique({ where: { id: positionId } });
    if (!position || position.electionId !== electionId) {
      const err: any = new Error("Position not found in this election.");
      err.statusCode = 404;
      err.code = "POSITION_NOT_FOUND";
      throw err;
    }
    return position;
  }

  async createPosition(electionId: string, input: PositionInput, officerUserId: string) {
    const election = await this.getElectionById(electionId);
    this.assertBallotEditable(election);

    const position = await prisma.position.create({
      data: {
        electionId,
        title: input.title,
        description: input.description,
        orderIndex: input.orderIndex ?? election.positions.length + 1,
        maxChoices: input.maxChoices ?? 1,
        isRequired: input.isRequired ?? true,
      },
      include: { candidates: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "POSITION_CREATED",
        entity: "Position",
        entityId: position.id,
        details: JSON.stringify({ electionId, title: position.title }),
      },
    });

    if (election.resultCommitmentHash) await this.resealTally(electionId);

    return position;
  }

  async updatePosition(
    electionId: string,
    positionId: string,
    input: Partial<PositionInput>,
    officerUserId: string
  ) {
    const election = await this.getElectionById(electionId);
    this.assertBallotEditable(election);
    await this.getOwnedPosition(electionId, positionId);

    const position = await prisma.position.update({
      where: { id: positionId },
      data: input,
      include: { candidates: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "POSITION_UPDATED",
        entity: "Position",
        entityId: positionId,
        details: JSON.stringify({ electionId, ...input }),
      },
    });

    if (election.resultCommitmentHash) await this.resealTally(electionId);

    return position;
  }

  async deletePosition(electionId: string, positionId: string, officerUserId: string) {
    const election = await this.getElectionById(electionId);
    this.assertBallotEditable(election);
    const position = await this.getOwnedPosition(electionId, positionId);

    if (election.status === ElectionStatus.OPEN && election.positions.length === 1) {
      const err: any = new Error(
        "The polls are open, so the ballot must keep at least one position with a candidate."
      );
      err.statusCode = 409;
      err.code = "BALLOT_NOT_CONFIGURED";
      throw err;
    }

    const recordedVotes = await prisma.ballotChoice.count({ where: { positionId } });
    if (recordedVotes > 0) {
      const err: any = new Error(
        "This position already has recorded votes and cannot be removed."
      );
      err.statusCode = 409;
      err.code = "POSITION_HAS_BALLOTS";
      throw err;
    }

    await prisma.position.delete({ where: { id: positionId } });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "POSITION_DELETED",
        entity: "Position",
        entityId: positionId,
        details: JSON.stringify({ electionId, title: position.title }),
      },
    });

    if (election.resultCommitmentHash) await this.resealTally(electionId);

    return { deleted: true, id: positionId };
  }

  async createCandidate(electionId: string, input: CandidateInput, officerUserId: string) {
    const election = await this.getElectionById(electionId);
    this.assertBallotEditable(election);
    await this.getOwnedPosition(electionId, input.positionId);

    const candidate = await prisma.candidate.create({
      data: {
        electionId,
        positionId: input.positionId,
        fullName: input.fullName,
        studentId: input.studentId,
        partyList: input.partyList?.trim() || null,
        platform: input.platform,
        photoUrl: input.photoUrl || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "CANDIDATE_CREATED",
        entity: "Candidate",
        entityId: candidate.id,
        details: JSON.stringify({
          electionId,
          positionId: input.positionId,
          fullName: candidate.fullName,
        }),
      },
    });

    if (election.resultCommitmentHash) await this.resealTally(electionId);

    return candidate;
  }

  async updateCandidate(
    electionId: string,
    candidateId: string,
    input: Partial<CandidateInput>,
    officerUserId: string
  ) {
    const election = await this.getElectionById(electionId);
    this.assertBallotEditable(election);

    const existing = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!existing || existing.electionId !== electionId) {
      const err: any = new Error("Candidate not found in this election.");
      err.statusCode = 404;
      err.code = "CANDIDATE_NOT_FOUND";
      throw err;
    }

    if (input.positionId) await this.getOwnedPosition(electionId, input.positionId);

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        ...(input.positionId ? { positionId: input.positionId } : {}),
        ...(input.fullName ? { fullName: input.fullName } : {}),
        ...(input.studentId ? { studentId: input.studentId } : {}),
        ...(input.platform ? { platform: input.platform } : {}),
        // partyList and photoUrl are optional: an empty string clears them
        ...(input.partyList !== undefined ? { partyList: input.partyList || null } : {}),
        ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl || null } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "CANDIDATE_UPDATED",
        entity: "Candidate",
        entityId: candidateId,
        details: JSON.stringify({ electionId, ...input }),
      },
    });

    if (election.resultCommitmentHash) await this.resealTally(electionId);

    return candidate;
  }

  async deleteCandidate(electionId: string, candidateId: string, officerUserId: string) {
    const election = await this.getElectionById(electionId);
    this.assertBallotEditable(election);

    const existing = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!existing || existing.electionId !== electionId) {
      const err: any = new Error("Candidate not found in this election.");
      err.statusCode = 404;
      err.code = "CANDIDATE_NOT_FOUND";
      throw err;
    }

    if (election.status === ElectionStatus.OPEN) {
      const owningPosition = election.positions.find((p) => p.id === existing.positionId);
      if (owningPosition && owningPosition.candidates.length === 1) {
        const err: any = new Error(
          `The polls are open and ${existing.fullName} is the only candidate for ${owningPosition.title}, so they cannot be removed.`
        );
        err.statusCode = 409;
        err.code = "BALLOT_NOT_CONFIGURED";
        throw err;
      }
    }

    const recordedVotes = await prisma.ballotChoice.count({ where: { candidateId } });
    if (recordedVotes > 0) {
      const err: any = new Error(
        "This candidate already has recorded votes and cannot be removed."
      );
      err.statusCode = 409;
      err.code = "CANDIDATE_HAS_BALLOTS";
      throw err;
    }

    await prisma.candidate.delete({ where: { id: candidateId } });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "CANDIDATE_DELETED",
        entity: "Candidate",
        entityId: candidateId,
        details: JSON.stringify({
          electionId,
          positionId: existing.positionId,
          fullName: existing.fullName,
        }),
      },
    });

    return { deleted: true, id: candidateId };
  }
}

export const electionService = new ElectionService();
