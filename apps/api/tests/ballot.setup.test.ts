import { prisma } from "../src/lib/prisma";
import { electionService } from "../src/services/election.service";
import { authService } from "../src/services/auth.service";
import { voterService } from "../src/services/voter.service";
import { ballotService } from "../src/services/ballot.service";
import { tallyService } from "../src/services/tally.service";
import { ElectionStatus } from "@prisma/client";

const TEST_TAG = `ballot-setup-${Date.now()}`;

// Every step here is a round trip to the hosted Supabase instance
jest.setTimeout(180000);

let officerId: string;
let electionId: string;

const window_ = {
  startTime: new Date(Date.now() - 60 * 60 * 1000),
  endTime: new Date(Date.now() + 60 * 60 * 1000),
};

async function registerStudent(local: string) {
  return authService.register({
    firstName: "Setup",
    lastName: local,
    schoolId: `2099-${Math.floor(10000 + Math.random() * 89999)}`,
    email: `${local}.${TEST_TAG}@seait.edu.ph`,
    department: "College of Information and Communication Technology",
    yearLevel: "2nd Year",
    password: "TestPass12345",
  });
}

beforeAll(async () => {
  const officer = await prisma.user.create({
    data: {
      schoolId: `2099-3${Math.floor(1000 + Math.random() * 8999)}`,
      email: `officer.${TEST_TAG}@seait.edu.ph`,
      passwordHash: "not-a-real-hash",
      firstName: "Setup",
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
    // Secondary elections created inside individual tests
    await prisma.election.deleteMany({ where: { title: { contains: TEST_TAG } } });
    await prisma.user.deleteMany({ where: { email: { contains: TEST_TAG } } });
  } catch {
    // best-effort cleanup
  }
  await prisma.$disconnect();
});

describe("ElectionService ballot setup", () => {
  it(
    "creates an election together with its positions and candidates",
    async () => {
      const election = await electionService.createElection(
        {
          title: `Ballot Setup Test Election ${TEST_TAG}`,
          description: "Temporary election for the ballot setup suite.",
          academicYear: "2099-2099",
          semester: "Test",
          ...window_,
          positions: [
            {
              title: "President",
              maxChoices: 1,
              isRequired: true,
              candidates: [
                { fullName: "Ada Candidate", studentId: "2099-10001", platform: "Platform alpha" },
                { fullName: "Bob Candidate", studentId: "2099-10002", platform: "Platform beta" },
              ],
            },
            {
              title: "Secretary",
              maxChoices: 1,
              isRequired: false,
              candidates: [
                { fullName: "Cy Candidate", studentId: "2099-10003", platform: "Platform gamma" },
              ],
            },
          ],
        },
        officerId
      );

      electionId = election.id;
      expect(election.status).toBe(ElectionStatus.DRAFT);
      expect(election.positions).toHaveLength(2);
      expect(election.positions[0].orderIndex).toBe(1);
      expect(election.positions[0].candidates).toHaveLength(2);
      expect(election.positions[1].candidates).toHaveLength(1);
      // Candidates must be linked to their own position, not floated loose
      expect(election.positions[1].candidates[0].positionId).toBe(election.positions[1].id);
    },
    60000
  );

  it("rejects a position belonging to a different election", async () => {
    const other = await electionService.createElection(
      {
        title: `Foreign Election ${TEST_TAG}`,
        description: "Holds a position that must not be reusable elsewhere.",
        academicYear: "2099-2099",
        semester: "Test",
        ...window_,
      },
      officerId
    );
    const foreignPosition = await electionService.createPosition(
      other.id,
      { title: "Foreign Position" },
      officerId
    );

    await expect(
      electionService.createCandidate(
        electionId,
        {
          positionId: foreignPosition.id,
          fullName: "Wrong Election",
          studentId: "2099-19999",
          platform: "Should never be created",
        },
        officerId
      )
    ).rejects.toMatchObject({ statusCode: 404, code: "POSITION_NOT_FOUND" });

    await expect(
      electionService.updatePosition(electionId, foreignPosition.id, { title: "Hijacked" }, officerId)
    ).rejects.toMatchObject({ statusCode: 404, code: "POSITION_NOT_FOUND" });

    await prisma.election.delete({ where: { id: other.id } });
  }, 60000);

  it("adds, edits and removes candidates while the ballot is a draft", async () => {
    const president = (await electionService.getElectionById(electionId)).positions[0];

    const created = await electionService.createCandidate(
      electionId,
      {
        positionId: president.id,
        fullName: "Temp Candidate",
        studentId: "2099-10099",
        platform: "Temporary platform text",
      },
      officerId
    );
    expect(created.id).toBeDefined();

    const renamed = await electionService.updateCandidate(
      electionId,
      created.id,
      { fullName: "Renamed Candidate", partyList: "New Party" },
      officerId
    );
    expect(renamed.fullName).toBe("Renamed Candidate");
    expect(renamed.partyList).toBe("New Party");

    const deleted = await electionService.deleteCandidate(electionId, created.id, officerId);
    expect(deleted.deleted).toBe(true);

    const refreshed = await electionService.getElectionById(electionId);
    expect(refreshed.positions[0].candidates).toHaveLength(2);
  });

  it("edits and removes positions, keeping ballot order intact", async () => {
    const position = await electionService.createPosition(
      electionId,
      { title: "Treasurer", maxChoices: 1, isRequired: false },
      officerId
    );
    expect(position.orderIndex).toBe(3);

    const updated = await electionService.updatePosition(
      electionId,
      position.id,
      { title: "Chief Treasurer", maxChoices: 2 },
      officerId
    );
    expect(updated.title).toBe("Chief Treasurer");
    expect(updated.maxChoices).toBe(2);

    const removed = await electionService.deletePosition(electionId, position.id, officerId);
    expect(removed.deleted).toBe(true);

    const refreshed = await electionService.getElectionById(electionId);
    expect(refreshed.positions).toHaveLength(2);
  });

  it("refuses to open polls when a position has no candidates", async () => {
    const lonely = await electionService.createPosition(
      electionId,
      { title: "Empty Position", maxChoices: 1 },
      officerId
    );

    await expect(
      electionService.transitionStatus(electionId, ElectionStatus.OPEN, officerId)
    ).rejects.toMatchObject({ statusCode: 400, code: "BALLOT_NOT_CONFIGURED" });

    await electionService.deletePosition(electionId, lonely.id, officerId);
  });

  it("refuses to open polls whose voting window already ended", async () => {
    const stale = await electionService.createElection(
      {
        title: `Expired Window Election ${TEST_TAG}`,
        description: "Window in the past.",
        academicYear: "2099-2099",
        semester: "Test",
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        positions: [
          {
            title: "President",
            candidates: [
              { fullName: "Past Candidate", studentId: "2099-10100", platform: "Past platform" },
            ],
          },
        ],
      },
      officerId
    );

    await expect(
      electionService.transitionStatus(stale.id, ElectionStatus.OPEN, officerId)
    ).rejects.toMatchObject({ statusCode: 400, code: "VOTING_WINDOW_EXPIRED" });

    await prisma.election.delete({ where: { id: stale.id } });
  });

  it("opens the polls and lets an approved student vote on the new ballot", async () => {
    await electionService.transitionStatus(electionId, ElectionStatus.OPEN, officerId);

    const student = await registerStudent("voter");
    const eligibility = await prisma.voterEligibility.findUnique({
      where: { electionId_userId: { electionId, userId: student.id } },
    });
    expect(eligibility?.status).toBe("PENDING");

    await voterService.reviewEligibility(electionId, eligibility!.id, "APPROVED", officerId);

    const election = await electionService.getElectionById(electionId);
    const [president, secretary] = election.positions;

    const receipt = await ballotService.castBallot({
      electionId,
      userId: student.id,
      selections: [
        { positionId: president.id, candidateId: president.candidates[0].id },
        { positionId: secretary.id, candidateId: secretary.candidates[0].id },
      ],
    });
    expect(receipt.receiptReference).toMatch(/^SEAIT-SC-\d{4}-[A-F0-9]{8}$/);
  }, 90000);

  it("freezes the ballot once a vote has been cast", async () => {
    const election = await electionService.getElectionById(electionId);
    const candidateId = election.positions[0].candidates[0].id;

    await expect(
      electionService.updateCandidate(
        electionId,
        candidateId,
        { fullName: "Too Late" },
        officerId
      )
    ).rejects.toMatchObject({ statusCode: 409, code: "BALLOT_LOCKED" });

    await expect(
      electionService.deleteCandidate(electionId, candidateId, officerId)
    ).rejects.toMatchObject({ statusCode: 409, code: "BALLOT_LOCKED" });

    await expect(
      electionService.deletePosition(electionId, election.positions[0].id, officerId)
    ).rejects.toMatchObject({ statusCode: 409, code: "BALLOT_LOCKED" });
  });

  it("seals the tally the moment polls close", async () => {
    await prisma.election.update({
      where: { id: electionId },
      data: { endTime: new Date(Date.now() - 1000) },
    });

    const closed = await electionService.transitionStatus(
      electionId,
      ElectionStatus.CLOSED,
      officerId
    );
    expect(closed.status).toBe(ElectionStatus.CLOSED);
    expect(closed.closedAt).toBeInstanceOf(Date);
    expect(closed.resultCommitmentHash).toMatch(/^0x[0-9a-f]{64}$/);

    const tally = await tallyService.computeTally(electionId);
    expect(tally.totalBallotsAccepted).toBe(1);
    expect(tally.resultCommitmentHash).toBe(closed.resultCommitmentHash);
    expect(
      tally.positions.find((p) => p.title === "President")?.candidates.some((c) => c.isWinner)
    ).toBe(true);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: electionId, action: "ELECTION_TALLY_SEALED" },
    });
    expect(audit).not.toBeNull();
  }, 60000);

  it("rescues a polls-that-never-ran election: editable and deletable while no ballot exists", async () => {
    const dud = await electionService.createElection(
      {
        title: `Ballot Rescue Test ${TEST_TAG}`,
        description: "Closed without ever receiving a single vote.",
        academicYear: "2099-2099",
        semester: "Test",
        ...window_,
        positions: [
          {
            title: "President",
            candidates: [
              { fullName: "Solo Candidate", studentId: "2099-10099", platform: "Platform solo" },
            ],
          },
        ],
      },
      officerId
    );

    await electionService.transitionStatus(dud.id, ElectionStatus.OPEN, officerId);
    await electionService.transitionStatus(dud.id, ElectionStatus.CLOSED, officerId);
    const closed = await electionService.getElectionById(dud.id);
    const sealedHash = closed.resultCommitmentHash as string;
    expect(sealedHash).toMatch(/^0x[0-9a-f]{64}$/);

    // No vote was ever cast, so COMELEC can still fix the roster
    const renamed = await electionService.updateCandidate(
      dud.id,
      closed.positions[0].candidates[0].id,
      { fullName: "Renamed Candidate" },
      officerId
    );
    expect(renamed.fullName).toBe("Renamed Candidate");

    // A rename does not move the commitment: it binds candidate ids to counts
    const afterRename = await electionService.getElectionById(dud.id);
    expect(afterRename.resultCommitmentHash).toBe(sealedHash);

    // Adding a candidate does, and the seal must follow the ballot it commits to
    await electionService.createCandidate(
      dud.id,
      {
        positionId: closed.positions[0].id,
        fullName: "Late Addition",
        studentId: "2099-10098",
        platform: "Added after the polls closed",
      },
      officerId
    );

    const after = await electionService.getElectionById(dud.id);
    expect(after.resultCommitmentHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(after.resultCommitmentHash).not.toBe(sealedHash);
    const tally = await tallyService.computeTally(dud.id);
    expect(tally.resultCommitmentHash).toBe(after.resultCommitmentHash);

    const removed = await electionService.deleteElection(dud.id, officerId);
    expect(removed.deleted).toBe(true);
    expect(await prisma.election.findUnique({ where: { id: dud.id } })).toBeNull();
  }, 120000);
});
