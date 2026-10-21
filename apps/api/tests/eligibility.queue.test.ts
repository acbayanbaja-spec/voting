import { prisma } from "../src/lib/prisma";
import { authService } from "../src/services/auth.service";
import { voterService } from "../src/services/voter.service";
import { ballotService } from "../src/services/ballot.service";

const TEST_TAG = `elig-queue-${Date.now()}`;

let electionId: string;
let positionId: string;
let candidateId: string;
let officerId: string;

async function registerStudent(local: string) {
  return authService.register({
    firstName: "Queue",
    lastName: local,
    schoolId: `2099-${Math.floor(10000 + Math.random() * 89999)}`,
    email: `${local}.${TEST_TAG}@seait.edu.ph`,
    department: "College of Information and Communication Technology",
    yearLevel: "2nd Year",
    password: "TestPass12345",
  });
}

beforeAll(async () => {
  const election = await prisma.election.create({
    data: {
      title: `Approval Queue Test Election ${TEST_TAG}`,
      description: "Temporary OPEN election for the COMELEC approval-queue tests.",
      academicYear: "2099-2099",
      semester: "Test",
      status: "OPEN",
      startTime: new Date(Date.now() - 60 * 60 * 1000),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  electionId = election.id;

  const position = await prisma.position.create({
    data: {
      electionId,
      title: "Queue President",
      orderIndex: 0,
      maxChoices: 1,
      isRequired: true,
    },
  });
  positionId = position.id;

  const candidate = await prisma.candidate.create({
    data: {
      electionId,
      positionId,
      fullName: "Queue Candidate",
      studentId: "2099-99997",
      platform: "Test platform for approval-queue testing.",
    },
  });
  candidateId = candidate.id;

  const officer = await prisma.user.create({
    data: {
      schoolId: `2099-4${Math.floor(1000 + Math.random() * 8999)}`,
      email: `officer.${TEST_TAG}@seait.edu.ph`,
      passwordHash: "not-a-real-hash",
      firstName: "Queue",
      lastName: "Officer",
      department: "College of Information and Communication Technology",
      yearLevel: "4th Year",
      role: "COMELEC_OFFICER",
    },
  });
  officerId = officer.id;
}, 60000);

afterAll(async () => {
  try {
    // Guards: an undefined id would turn deleteMany into a full-table wipe
    if (electionId) {
      await prisma.election.deleteMany({ where: { id: electionId } });
    }
    await prisma.user.deleteMany({
      where: { email: { contains: TEST_TAG } },
    });
  } catch {
    // best-effort cleanup
  }
  await prisma.$disconnect();
});

describe("COMELEC eligibility approval queue", () => {
  it(
    "registration enrolls the student as PENDING for the open test election",
    async () => {
      const user = await registerStudent("pending");

      const eligibility = await prisma.voterEligibility.findUnique({
        where: { electionId_userId: { electionId, userId: user.id } },
      });

      expect(eligibility).not.toBeNull();
      expect(eligibility!.status).toBe("PENDING");
      expect(eligibility!.hasVoted).toBe(false);
    },
    30000
  );

  it(
    "a PENDING voter cannot cast a ballot",
    async () => {
      const user = await registerStudent("blocked");

      await expect(
        ballotService.castBallot({
          electionId,
          userId: user.id,
          selections: [{ positionId, candidateId }],
        })
      ).rejects.toMatchObject({ statusCode: 403, code: "VOTER_PENDING_APPROVAL" });
    },
    30000
  );

  it(
    "approval by a COMELEC officer unlocks voting for that voter",
    async () => {
      const user = await registerStudent("approved");

      const eligibility = await prisma.voterEligibility.findUnique({
        where: { electionId_userId: { electionId, userId: user.id } },
      });

      const reviewed = await voterService.reviewEligibility(
        electionId,
        eligibility!.id,
        "APPROVED",
        officerId
      );
      expect(reviewed.status).toBe("APPROVED");
      expect(reviewed.reviewedById).toBe(officerId);
      expect(reviewed.reviewedAt).not.toBeNull();

      const result = await ballotService.castBallot({
        electionId,
        userId: user.id,
        selections: [{ positionId, candidateId }],
      });
      expect(result.receiptReference).toMatch(/^SEAIT-SC-\d{4}-[A-F0-9]{8}$/);
    },
    90000
  );

  it(
    "a REJECTED voter is permanently blocked from casting",
    async () => {
      const user = await registerStudent("rejected");

      const eligibility = await prisma.voterEligibility.findUnique({
        where: { electionId_userId: { electionId, userId: user.id } },
      });

      await voterService.reviewEligibility(
        electionId,
        eligibility!.id,
        "REJECTED",
        officerId
      );

      await expect(
        ballotService.castBallot({
          electionId,
          userId: user.id,
          selections: [{ positionId, candidateId }],
        })
      ).rejects.toMatchObject({ statusCode: 403, code: "VOTER_REJECTED" });
    },
    30000
  );

  it(
    "an officer cannot change the decision after the voter has cast a ballot",
    async () => {
      const eligibility = await prisma.voterEligibility.findFirst({
        where: { electionId, hasVoted: true },
      });
      expect(eligibility).not.toBeNull();

      await expect(
        voterService.reviewEligibility(electionId, eligibility!.id, "REJECTED", officerId)
      ).rejects.toMatchObject({ statusCode: 409, code: "VOTER_ALREADY_VOTED" });
    },
    30000
  );

  it(
    "approve-all only promotes PENDING rows and reports the count",
    async () => {
      const { approvedCount } = await voterService.approveAllPending(electionId, officerId);

      // The "pending" voter from the first case is still PENDING in this election
      expect(approvedCount).toBeGreaterThanOrEqual(1);

      const stillPending = await prisma.voterEligibility.count({
        where: { electionId, status: "PENDING" },
      });
      expect(stillPending).toBe(0);

      // The rejected voter must not have been flipped
      const rejected = await prisma.voterEligibility.findFirst({
        where: { electionId, status: "REJECTED" },
      });
      expect(rejected).not.toBeNull();
    },
    30000
  );
});
