const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingLedger Smart Contract - SEAIT Student Council", function () {
  let votingLedger;
  let owner, comelecOfficer, student, unauthorizedUser;
  let sampleElectionId;

  beforeEach(async function () {
    [owner, comelecOfficer, student, unauthorizedUser] = await ethers.getSigners();

    const VotingLedgerFactory = await ethers.getContractFactory("VotingLedger");
    votingLedger = await VotingLedgerFactory.deploy();
    await votingLedger.waitForDeployment();

    // Authorize comelecOfficer
    await votingLedger.setComelecOfficer(comelecOfficer.address, true);

    sampleElectionId = ethers.keccak256(ethers.toUtf8Bytes("SEAIT-SC-2026-ELECTION"));
  });

  describe("Access Control", function () {
    it("should set deployer as owner and authorized COMELEC officer", async function () {
      expect(await votingLedger.owner()).to.equal(owner.address);
      expect(await votingLedger.authorizedComelecOfficers(owner.address)).to.be.true;
    });

    it("should allow owner to authorize and revoke COMELEC officers", async function () {
      const newOfficer = student.address;
      await expect(votingLedger.setComelecOfficer(newOfficer, true))
        .to.emit(votingLedger, "ComelecOfficerAuthorized")
        .withArgs(newOfficer, owner.address);

      expect(await votingLedger.authorizedComelecOfficers(newOfficer)).to.be.true;

      await expect(votingLedger.setComelecOfficer(newOfficer, false))
        .to.emit(votingLedger, "ComelecOfficerRevoked")
        .withArgs(newOfficer, owner.address);

      expect(await votingLedger.authorizedComelecOfficers(newOfficer)).to.be.false;
    });

    it("should reject non-owner attempts to authorize COMELEC officers", async function () {
      await expect(
        votingLedger.connect(unauthorizedUser).setComelecOfficer(student.address, true)
      ).to.be.revertedWithCustomError(votingLedger, "OnlyOwner");
    });
  });

  describe("Election Lifecycle", function () {
    it("should register a new election successfully", async function () {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now + 100;
      const endTime = now + 86400;

      await expect(
        votingLedger
          .connect(comelecOfficer)
          .registerElection(sampleElectionId, "SEAIT Supreme Student Council 2026", startTime, endTime)
      )
        .to.emit(votingLedger, "ElectionRegistered");

      const election = await votingLedger.getElection(sampleElectionId);
      expect(election.title).to.equal("SEAIT Supreme Student Council 2026");
      expect(election.state).to.equal(1); // REGISTERED
      expect(election.totalVotes).to.equal(0);
    });

    it("should revert if election already registered", async function () {
      const now = Math.floor(Date.now() / 1000);
      await votingLedger.connect(comelecOfficer).registerElection(
        sampleElectionId,
        "SEAIT Election",
        now + 100,
        now + 500
      );

      await expect(
        votingLedger.connect(comelecOfficer).registerElection(
          sampleElectionId,
          "Duplicate Election",
          now + 100,
          now + 500
        )
      ).to.be.revertedWithCustomError(votingLedger, "ElectionAlreadyExists");
    });

    it("should transition state from REGISTERED -> OPEN -> CLOSED -> FINALIZED", async function () {
      const now = Math.floor(Date.now() / 1000);
      await votingLedger.connect(comelecOfficer).registerElection(
        sampleElectionId,
        "SEAIT Election",
        now + 10,
        now + 1000
      );

      // Open
      await expect(votingLedger.connect(comelecOfficer).openElection(sampleElectionId))
        .to.emit(votingLedger, "ElectionStateChanged")
        .withArgs(sampleElectionId, 1, 2, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      let el = await votingLedger.getElection(sampleElectionId);
      expect(el.state).to.equal(2); // OPEN

      // Close
      await expect(votingLedger.connect(comelecOfficer).closeElection(sampleElectionId))
        .to.emit(votingLedger, "ElectionStateChanged");

      el = await votingLedger.getElection(sampleElectionId);
      expect(el.state).to.equal(3); // CLOSED

      // Finalize
      const resultsHash = ethers.keccak256(ethers.toUtf8Bytes("OFFICIAL_TALLY_SUMMARY"));
      await expect(votingLedger.connect(comelecOfficer).finalizeElection(sampleElectionId, resultsHash, 0))
        .to.emit(votingLedger, "ElectionFinalized")
        .withArgs(sampleElectionId, resultsHash, 0, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));

      el = await votingLedger.getElection(sampleElectionId);
      expect(el.state).to.equal(4); // FINALIZED
      expect(el.resultsCommitmentHash).to.equal(resultsHash);
    });
  });

  describe("Vote Commitment Recording & Verifiability", function () {
    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      await votingLedger.connect(comelecOfficer).registerElection(
        sampleElectionId,
        "SEAIT SC 2026",
        now,
        now + 86400
      );
      await votingLedger.connect(comelecOfficer).openElection(sampleElectionId);
    });

    it("should record a valid vote commitment and emit event", async function () {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("voter-secret-salt-and-ballot-1"));
      const receiptRef = "SEAIT-2026-VOTE-0001";

      await expect(
        votingLedger.connect(comelecOfficer).recordVoteCommitment(sampleElectionId, commitment, receiptRef)
      )
        .to.emit(votingLedger, "VoteCommitmentRecorded")
        .withArgs(sampleElectionId, commitment, receiptRef, (await ethers.provider.getBlock("latest")).timestamp + 1, (await ethers.provider.getBlock("latest")).number + 1, 1);

      expect(await votingLedger.getTotalVotesRecorded(sampleElectionId)).to.equal(1);

      // Verify receipt lookup
      const receiptVerification = await votingLedger.verifyReceipt(sampleElectionId, receiptRef);
      expect(receiptVerification.exists).to.be.true;
      expect(receiptVerification.commitmentHash).to.equal(commitment);
      expect(receiptVerification.voteIndex).to.equal(1);

      // Verify commitment lookup
      const commitmentVerification = await votingLedger.verifyCommitment(sampleElectionId, commitment);
      expect(commitmentVerification.exists).to.be.true;
      expect(commitmentVerification.receiptReference).to.equal(receiptRef);
    });

    it("should prevent duplicate commitment hashes", async function () {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("voter-secret-salt-and-ballot-duplicate"));
      await votingLedger.connect(comelecOfficer).recordVoteCommitment(sampleElectionId, commitment, "REF-1");

      await expect(
        votingLedger.connect(comelecOfficer).recordVoteCommitment(sampleElectionId, commitment, "REF-2")
      ).to.be.revertedWithCustomError(votingLedger, "DuplicateCommitmentHash");
    });

    it("should prevent duplicate receipt references", async function () {
      const commitment1 = ethers.keccak256(ethers.toUtf8Bytes("voter-1"));
      const commitment2 = ethers.keccak256(ethers.toUtf8Bytes("voter-2"));
      const receiptRef = "SAME-REF-123";

      await votingLedger.connect(comelecOfficer).recordVoteCommitment(sampleElectionId, commitment1, receiptRef);

      await expect(
        votingLedger.connect(comelecOfficer).recordVoteCommitment(sampleElectionId, commitment2, receiptRef)
      ).to.be.revertedWithCustomError(votingLedger, "DuplicateReceiptReference");
    });

    it("should reject unauthorized callers from recording commitments", async function () {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("unauthorized-vote"));
      await expect(
        votingLedger.connect(unauthorizedUser).recordVoteCommitment(sampleElectionId, commitment, "REF-FAIL")
      ).to.be.revertedWithCustomError(votingLedger, "OnlyAuthorizedComelec");
    });
  });
});
