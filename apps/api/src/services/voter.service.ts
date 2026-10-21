import { prisma } from "../lib/prisma";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { hashPassword } from "../utils/crypto";
import { EligibilityStatus, Role } from "@prisma/client";

export interface CsvImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; error: string; data?: any }>;
}

export class VoterService {
  async getEligibleVoters(
    electionId: string,
    page = 1,
    limit = 50,
    search?: string,
    status?: string
  ) {
    const skip = (page - 1) * limit;
    const where: any = { electionId };

    if (status && status !== "ALL") {
      where.status = status as EligibilityStatus;
    }

    if (search) {
      where.user = {
        OR: [
          { schoolId: { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [total, voters] = await Promise.all([
      prisma.voterEligibility.count({ where }),
      prisma.voterEligibility.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              schoolId: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
              yearLevel: true,
            },
          },
        },
      }),
    ]);

    return {
      voters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async importVotersFromCsv(
    electionId: string,
    csvContent: string,
    officerUserId: string
  ): Promise<CsvImportResult> {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      const err: any = new Error("Election not found.");
      err.statusCode = 404;
      err.code = "ELECTION_NOT_FOUND";
      throw err;
    }

    let records: any[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError: any) {
      const err: any = new Error(`CSV parsing error: ${parseError.message}`);
      err.statusCode = 400;
      err.code = "INVALID_CSV_FORMAT";
      throw err;
    }

    const errors: Array<{ row: number; error: string; data?: any }> = [];
    let importedCount = 0;
    let skippedCount = 0;

    const defaultPasswordHash = await hashPassword("Student@12345");

    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 2; // Row number 1 is header
      const row = records[i];

      const schoolId = row.schoolId || row["School ID"] || row["studentId"];
      const email = row.email || row["Email"] || row["emailAddress"];
      const firstName = row.firstName || row["First Name"] || row["first_name"];
      const lastName = row.lastName || row["Last Name"] || row["last_name"];
      const department = row.department || row["Department"] || "College of Information and Communication Technology";
      const yearLevel = row.yearLevel || row["Year Level"] || "1st Year";

      if (!schoolId || !email || !firstName || !lastName) {
        errors.push({
          row: rowNum,
          error: "Missing required fields: schoolId, email, firstName, or lastName.",
          data: row,
        });
        skippedCount++;
        continue;
      }

      try {
        // Upsert student user
        const user = await prisma.user.upsert({
          where: { schoolId },
          update: {
            department,
            yearLevel,
          },
          create: {
            schoolId,
            email,
            firstName,
            lastName,
            department,
            yearLevel,
            passwordHash: defaultPasswordHash,
            role: Role.STUDENT,
          },
        });

        // Register voter eligibility
        await prisma.voterEligibility.upsert({
          where: {
            electionId_userId: {
              electionId,
              userId: user.id,
            },
          },
          update: {},
          create: {
            electionId,
            userId: user.id,
          },
        });

        importedCount++;
      } catch (rowErr: any) {
        errors.push({
          row: rowNum,
          error: rowErr.message,
          data: row,
        });
        skippedCount++;
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "VOTERS_IMPORTED_CSV",
        entity: "Election",
        entityId: electionId,
        details: JSON.stringify({
          totalRows: records.length,
          importedCount,
          skippedCount,
          errorCount: errors.length,
        }),
      },
    });

    return {
      totalRows: records.length,
      importedCount,
      skippedCount,
      errors,
    };
  }

  /**
   * Generates sanitized CSV report protecting against CSV injection (formula injection).
   */
  async exportVoterRosterCsv(electionId: string): Promise<string> {
    const voters = await prisma.voterEligibility.findMany({
      where: { electionId },
      include: {
        user: true,
      },
      orderBy: { user: { lastName: "asc" } },
    });

    const sanitize = (val: string | null | undefined): string => {
      if (!val) return "";
      const str = String(val);
      // Neutralize formula injection risk
      if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
        return `'${str}`;
      }
      return str;
    };

    const data = voters.map((v) => ({
      "School ID": sanitize(v.user.schoolId),
      "Last Name": sanitize(v.user.lastName),
      "First Name": sanitize(v.user.firstName),
      Department: sanitize(v.user.department),
      "Year Level": sanitize(v.user.yearLevel),
      "Has Voted": v.hasVoted ? "YES" : "NO",
      "Voted At": v.votedAt ? v.votedAt.toISOString() : "N/A",
      "Receipt Reference": sanitize(v.receiptReference),
    }));

    return stringify(data, { header: true });
  }

  async reviewEligibility(
    electionId: string,
    eligibilityId: string,
    decision: "APPROVED" | "REJECTED",
    officerUserId: string
  ) {
    const eligibility = await prisma.voterEligibility.findFirst({
      where: { id: eligibilityId, electionId },
      include: { user: { select: { schoolId: true, firstName: true, lastName: true } } },
    });

    if (!eligibility) {
      const err: any = new Error("Voter record not found in this election roster.");
      err.statusCode = 404;
      err.code = "ELIGIBILITY_NOT_FOUND";
      throw err;
    }

    if (eligibility.hasVoted) {
      const err: any = new Error("This voter has already cast a ballot; the decision is final.");
      err.statusCode = 409;
      err.code = "VOTER_ALREADY_VOTED";
      throw err;
    }

    const updated = await prisma.voterEligibility.update({
      where: { id: eligibilityId },
      data: { status: decision, reviewedById: officerUserId, reviewedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: decision === "APPROVED" ? "VOTER_APPROVED" : "VOTER_REJECTED",
        entity: "VoterEligibility",
        entityId: eligibilityId,
        details: JSON.stringify({
          electionId,
          schoolId: eligibility.user.schoolId,
          name: `${eligibility.user.firstName} ${eligibility.user.lastName}`,
        }),
      },
    });

    return updated;
  }

  async approveAllPending(electionId: string, officerUserId: string) {
    const result = await prisma.voterEligibility.updateMany({
      where: { electionId, status: "PENDING" },
      data: { status: "APPROVED", reviewedById: officerUserId, reviewedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "VOTERS_APPROVED_ALL_PENDING",
        entity: "Election",
        entityId: electionId,
        details: JSON.stringify({ approvedCount: result.count }),
      },
    });

    return { approvedCount: result.count };
  }

  async enrollAllStudents(electionId: string, officerUserId: string) {
    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) {
      const err: any = new Error("Election not found.");
      err.statusCode = 404;
      err.code = "ELECTION_NOT_FOUND";
      throw err;
    }

    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT, isActive: true },
      select: { id: true },
    });

    const result = await prisma.voterEligibility.createMany({
      data: students.map((s) => ({
        electionId,
        userId: s.id,
        status: EligibilityStatus.APPROVED,
        reviewedById: officerUserId,
        reviewedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    await prisma.auditLog.create({
      data: {
        userId: officerUserId,
        action: "VOTERS_ENROLLED_ALL_STUDENTS",
        entity: "Election",
        entityId: electionId,
        details: JSON.stringify({ enrolledCount: result.count }),
      },
    });

    return { enrolledCount: result.count };
  }
}

export const voterService = new VoterService();
