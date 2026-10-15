import { prisma } from "../lib/prisma";
import { ElectionStatus } from "@prisma/client";
import { logger } from "../utils/logger";

export interface CreateElectionInput {
  title: string;
  description: string;
  academicYear: string;
  semester: string;
  startTime: Date;
  endTime: Date;
}

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

    const election = await prisma.election.create({
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

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "ELECTION_CREATED",
        entity: "Election",
        entityId: election.id,
        details: JSON.stringify({ title: input.title, academicYear: input.academicYear }),
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

    const data: any = { status: newStatus };
    if (newStatus === ElectionStatus.CLOSED) {
      data.closedAt = new Date();
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

    return updated;
  }
}

export const electionService = new ElectionService();
