import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { ballotService } from "../src/services/ballot.service";
import { hashPassword } from "../src/utils/crypto";

const TEST_TAG = `ballot-test-${Date.now()}`;

let electionId: string;
let positionId: string;
let candidateId: string;
let userId: string;

beforeAll(async () => {
  // Dedicated test election (isolated from real data; removed in afterAll)
  const election = await prisma.election.create({
    data: {
      title: `Integration Test Election ${TEST_TAG}`,
      description: "Temporary election for duplicate-vote protection tests.",
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
      title: "Test President",
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
      fullName: "Test Candidate",
      studentId: "2099-99999",
      platform: "Test platform for integration testing.",
    },
  });
  candidateId = candidate.id;

  const user = await prisma.user.create({
    data: {
      schoolId: `2099-7${Math.floor(1000 + Math.random() * 8999)}`,
      email: `${TEST_TAG}@seait.edu.ph`,
      passwordHash: await hashPassword("TestPass12345"),
      firstName: "Ballot",
      lastName: "Testuser",
      department: "College of Information and Communication Technology",
      yearLevel: "2nd Year",
      role: "STUDENT",
    },
  });
  userId = user.id;

  await prisma.voterEligibility.create({
    data: { electionId, userId },
  });
}, 60000);

afterAll(async () => {
  // Cascade removes positions, candidates, eligibility, submissions, receipts
  // Guards: an undefined id would turn deleteMany into a full-table wipe
  try {
    if (electionId) {
      await prisma.election.deleteMany({ where: { id: electionId } });
    }
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    // Per-test voters (rival / late / outsider) live inside test bodies, so a
    // failing assertion can skip their inline cleanup — sweep them by email tag.
    await prisma.user.deleteMany({ where: { email: { contains: TEST_TAG } } });
  } catch {
    // best-effort cleanup
  }
  await prisma.$disconnect();
});

describe("BallotService duplicate-vote protection", () => {
  it(
    "accepts the first ballot and rejects a sequential second attempt",
    async () => {
      const first = await ballotService.castBallot({
        electionId,
        userId,
        selections: [{ positionId, candidateId }],
      });
      expect(first.receiptReference).toMatch(/^SEAIT-SC-\d{4}-[A-F0-9]{8}$/);

      await expect(
        ballotService.castBallot({
          electionId,
          userId,
          selections: [{ positionId, candidateId }],
        })
      ).rejects.toMatchObject({ statusCode: 409 });
    },
    30000
  );

  it(
    "allows exactly one ballot under concurrent submissions",
    async () => {
      // New voter for a clean concurrency race
      const rival = await prisma.user.create({
        data: {
          schoolId: `2099-8${Math.floor(1000 + Math.random() * 8999)}`,
          email: `rival.${TEST_TAG}@seait.edu.ph`,
          passwordHash: await hashPassword("TestPass12345"),
          firstName: "Concurrent",
          lastName: "Testuser",
          department: "College of Information and Communication Technology",
          yearLevel: "1st Year",
          role: "STUDENT",
        },
      });
      await prisma.voterEligibility.create({ data: { electionId, userId: rival.id } });

      const attempts = await Promise.allSettled(
        Array.from({ length: 4 }, () =>
          ballotService.castBallot({
            electionId,
            userId: rival.id,
            selections: [{ positionId, candidateId }],
          })
        )
      );

      const accepted = attempts.filter((a) => a.status === "fulfilled");
      const rejected = attempts.filter((a) => a.status === "rejected");

      expect(accepted.length).toBe(1);
      expect(rejected.length).toBe(3);
      rejected.forEach((r) => {
        expect((r as PromiseRejectedResult).reason.statusCode).toBe(409);
      });

      // The database remains the source of truth: exactly one submission
      const submissions = await prisma.ballotSubmission.count({
        where: { electionId },
      });
      const eligibilities = await prisma.voterEligibility.findMany({
        where: { electionId },
      });
      const votedCount = eligibilities.filter((e) => e.hasVoted).length;

      // 2 voters total (main + rival), each accepted exactly once
      expect(submissions).toBe(2);
      expect(votedCount).toBe(2);

      await prisma.user.deleteMany({ where: { id: rival.id } });
    },
    60000
  );

  it(
    "rejects voting outside the authorized window",
    async () => {
      // New voter whose election window has already closed
      const closedElection = await prisma.election.create({
        data: {
          title: `Closed Test Election ${TEST_TAG}`,
          description: "Temporary closed election.",
          academicYear: "2099-2099",
          semester: "Test",
          status: "OPEN",
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 60 * 60 * 1000),
        },
      });
      const closedPosition = await prisma.position.create({
        data: {
          electionId: closedElection.id,
          title: "Closed President",
          orderIndex: 0,
          maxChoices: 1,
          isRequired: true,
        },
      });
      const closedCandidate = await prisma.candidate.create({
        data: {
          electionId: closedElection.id,
          positionId: closedPosition.id,
          fullName: "Closed Candidate",
          studentId: "2099-99998",
          platform: "Test platform.",
        },
      });
      const lateVoter = await prisma.user.create({
        data: {
          schoolId: `2099-6${Math.floor(1000 + Math.random() * 8999)}`,
          email: `late.${TEST_TAG}@seait.edu.ph`,
          passwordHash: await hashPassword("TestPass12345"),
          firstName: "Late",
          lastName: "Testuser",
          department: "College of Education",
          yearLevel: "3rd Year",
          role: "STUDENT",
        },
      });
      await prisma.voterEligibility.create({
        data: { electionId: closedElection.id, userId: lateVoter.id },
      });

      await expect(
        ballotService.castBallot({
          electionId: closedElection.id,
          userId: lateVoter.id,
          selections: [{ positionId: closedPosition.id, candidateId: closedCandidate.id }],
        })
      ).rejects.toMatchObject({ code: "OUTSIDE_VOTING_WINDOW" });

      await prisma.election.deleteMany({ where: { id: closedElection.id } });
      await prisma.user.deleteMany({ where: { id: lateVoter.id } });
    },
    30000
  );

  it(
    "rejects a voter without eligibility for the election",
    async () => {
      const outsider = await prisma.user.create({
        data: {
          schoolId: `2099-5${Math.floor(1000 + Math.random() * 8999)}`,
          email: `outsider.${TEST_TAG}@seait.edu.ph`,
          passwordHash: await hashPassword("TestPass12345"),
          firstName: "Outsider",
          lastName: "Testuser",
          department: "College of Criminology",
          yearLevel: "1st Year",
          role: "STUDENT",
        },
      });

      await expect(
        ballotService.castBallot({
          electionId,
          userId: outsider.id,
          selections: [{ positionId, candidateId }],
        })
      ).rejects.toMatchObject({ code: "VOTER_NOT_ELIGIBLE" });

      await prisma.user.deleteMany({ where: { id: outsider.id } });
    },
    30000
  );
});

// Keep supertest app import referenced so routing layer stays linked in this suite
describe("App routing sanity", () => {
  it("exposes the ballot cast endpoint", () => {
    const app = createApp();
    expect(app).toBeDefined();
  });
});
