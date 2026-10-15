// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VotingLedger
 * @author South East Asian Institute of Technology, Inc. (SEAIT) CICT
 * @notice Immutable, privacy-preserving blockchain vote ledger for Student Council elections.
 * @dev Stores only cryptographic vote commitments and verifiable receipts.
 *      Never stores student identities, student IDs, or plaintext candidate selections.
 */
contract VotingLedger {
    // --- Custom Errors ---
    error OnlyOwner();
    error OnlyAuthorizedComelec();
    error ElectionAlreadyExists(bytes32 electionId);
    error ElectionNotFound(bytes32 electionId);
    error InvalidElectionState(bytes32 electionId, ElectionState current, ElectionState expected);
    error InvalidTimeWindow(uint256 startTime, uint256 endTime);
    error VotingPeriodNotActive(uint256 currentTime, uint256 startTime, uint256 endTime);
    error DuplicateCommitmentHash(bytes32 commitmentHash);
    error DuplicateReceiptReference(string receiptReference);
    error InvalidCommitmentHash();
    error EmptyReceiptReference();
    error ElectionAlreadyFinalized(bytes32 electionId);
    error TallyMismatch(uint256 recordedVotes, uint256 reportedVotes);

    // --- Enums & Structs ---
    enum ElectionState {
        NON_EXISTENT,
        REGISTERED,
        OPEN,
        CLOSED,
        FINALIZED,
        CANCELLED
    }

    struct Election {
        bytes32 electionId;
        string title;
        uint256 startTime;
        uint256 endTime;
        ElectionState state;
        bytes32 resultsCommitmentHash;
        uint256 totalVotes;
        uint256 registeredAt;
        uint256 closedAt;
        uint256 finalizedAt;
    }

    struct VoteRecord {
        bytes32 commitmentHash;
        string receiptReference;
        uint256 timestamp;
        uint256 blockNumber;
        uint256 voteIndex;
    }

    // --- State Variables ---
    address public owner;
    mapping(address => bool) public authorizedComelecOfficers;

    // Election mappings
    mapping(bytes32 => Election) private elections;
    bytes32[] private electionIds;

    // Election vote commitments: electionId => commitmentHash => VoteRecord
    mapping(bytes32 => mapping(bytes32 => VoteRecord)) private voteCommitments;
    // Election receipt references: electionId => receiptReference => bytes32 commitmentHash
    mapping(bytes32 => mapping(string => bytes32)) private receiptToCommitment;
    // List of commitment hashes per election for auditability
    mapping(bytes32 => bytes32[]) private electionCommitmentList;

    // --- Events ---
    event ElectionRegistered(
        bytes32 indexed electionId,
        string title,
        uint256 startTime,
        uint256 endTime,
        address indexed registeredBy,
        uint256 timestamp
    );

    event ElectionStateChanged(
        bytes32 indexed electionId,
        ElectionState previousState,
        ElectionState newState,
        uint256 timestamp
    );

    event VoteCommitmentRecorded(
        bytes32 indexed electionId,
        bytes32 indexed commitmentHash,
        string receiptReference,
        uint256 timestamp,
        uint256 blockNumber,
        uint256 voteIndex
    );

    event ElectionFinalized(
        bytes32 indexed electionId,
        bytes32 indexed resultsCommitmentHash,
        uint256 totalVotes,
        uint256 timestamp
    );

    event ComelecOfficerAuthorized(address indexed officer, address indexed authorizedBy);
    event ComelecOfficerRevoked(address indexed officer, address indexed revokedBy);

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyComelec() {
        if (msg.sender != owner && !authorizedComelecOfficers[msg.sender]) {
            revert OnlyAuthorizedComelec();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedComelecOfficers[msg.sender] = true;
    }

    // --- Access Control Management ---
    function setComelecOfficer(address officer, bool authorized) external onlyOwner {
        require(officer != address(0), "Invalid officer address");
        authorizedComelecOfficers[officer] = authorized;
        if (authorized) {
            emit ComelecOfficerAuthorized(officer, msg.sender);
        } else {
            emit ComelecOfficerRevoked(officer, msg.sender);
        }
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
        authorizedComelecOfficers[newOwner] = true;
    }

    // --- Election Lifecycle ---

    /**
     * @notice Registers a new Student Council election on-chain.
     */
    function registerElection(
        bytes32 electionId,
        string calldata title,
        uint256 startTime,
        uint256 endTime
    ) external onlyComelec {
        if (elections[electionId].state != ElectionState.NON_EXISTENT) {
            revert ElectionAlreadyExists(electionId);
        }
        if (startTime >= endTime) {
            revert InvalidTimeWindow(startTime, endTime);
        }

        elections[electionId] = Election({
            electionId: electionId,
            title: title,
            startTime: startTime,
            endTime: endTime,
            state: ElectionState.REGISTERED,
            resultsCommitmentHash: bytes32(0),
            totalVotes: 0,
            registeredAt: block.timestamp,
            closedAt: 0,
            finalizedAt: 0
        });

        electionIds.push(electionId);

        emit ElectionRegistered(
            electionId,
            title,
            startTime,
            endTime,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Explicitly opens an election for voting.
     */
    function openElection(bytes32 electionId) external onlyComelec {
        Election storage el = elections[electionId];
        if (el.state == ElectionState.NON_EXISTENT) revert ElectionNotFound(electionId);
        if (el.state != ElectionState.REGISTERED) {
            revert InvalidElectionState(electionId, el.state, ElectionState.REGISTERED);
        }

        el.state = ElectionState.OPEN;
        emit ElectionStateChanged(electionId, ElectionState.REGISTERED, ElectionState.OPEN, block.timestamp);
    }

    /**
     * @notice Closes an election, disallowing any further votes.
     */
    function closeElection(bytes32 electionId) external onlyComelec {
        Election storage el = elections[electionId];
        if (el.state == ElectionState.NON_EXISTENT) revert ElectionNotFound(electionId);
        if (el.state != ElectionState.OPEN) {
            revert InvalidElectionState(electionId, el.state, ElectionState.OPEN);
        }

        el.state = ElectionState.CLOSED;
        el.closedAt = block.timestamp;
        emit ElectionStateChanged(electionId, ElectionState.OPEN, ElectionState.CLOSED, block.timestamp);
    }

    // --- Vote Recording ---

    /**
     * @notice Records a privacy-preserving cryptographic vote commitment and receipt reference.
     * @dev Does NOT store any student identifier or plaintext choices.
     *      Verifies that the commitment hash is unique and the election is active.
     */
    function recordVoteCommitment(
        bytes32 electionId,
        bytes32 commitmentHash,
        string calldata receiptReference
    ) external onlyComelec returns (uint256 voteIndex) {
        Election storage el = elections[electionId];
        if (el.state == ElectionState.NON_EXISTENT) revert ElectionNotFound(electionId);
        if (el.state != ElectionState.OPEN) {
            revert InvalidElectionState(electionId, el.state, ElectionState.OPEN);
        }

        if (commitmentHash == bytes32(0)) revert InvalidCommitmentHash();
        if (bytes(receiptReference).length == 0) revert EmptyReceiptReference();

        // Check duplicates
        if (voteCommitments[electionId][commitmentHash].commitmentHash != bytes32(0)) {
            revert DuplicateCommitmentHash(commitmentHash);
        }
        if (receiptToCommitment[electionId][receiptReference] != bytes32(0)) {
            revert DuplicateReceiptReference(receiptReference);
        }

        voteIndex = electionCommitmentList[electionId].length + 1;

        VoteRecord memory record = VoteRecord({
            commitmentHash: commitmentHash,
            receiptReference: receiptReference,
            timestamp: block.timestamp,
            blockNumber: block.number,
            voteIndex: voteIndex
        });

        voteCommitments[electionId][commitmentHash] = record;
        receiptToCommitment[electionId][receiptReference] = commitmentHash;
        electionCommitmentList[electionId].push(commitmentHash);

        el.totalVotes += 1;

        emit VoteCommitmentRecorded(
            electionId,
            commitmentHash,
            receiptReference,
            block.timestamp,
            block.number,
            voteIndex
        );

        return voteIndex;
    }

    // --- Election Finalization & Verifiable Results ---

    /**
     * @notice Finalizes an election by sealing the verifiable results commitment hash.
     * @param electionId The election identifier.
     * @param resultsCommitmentHash Merkle root or SHA-256 hash of all reconciled final candidate tallies.
     * @param totalVotes The audited total count of accepted votes.
     */
    function finalizeElection(
        bytes32 electionId,
        bytes32 resultsCommitmentHash,
        uint256 totalVotes
    ) external onlyComelec {
        Election storage el = elections[electionId];
        if (el.state == ElectionState.NON_EXISTENT) revert ElectionNotFound(electionId);
        if (el.state != ElectionState.CLOSED) {
            revert InvalidElectionState(electionId, el.state, ElectionState.CLOSED);
        }
        if (el.totalVotes != totalVotes) {
            revert TallyMismatch(el.totalVotes, totalVotes);
        }

        el.state = ElectionState.FINALIZED;
        el.resultsCommitmentHash = resultsCommitmentHash;
        el.finalizedAt = block.timestamp;

        emit ElectionFinalized(electionId, resultsCommitmentHash, totalVotes, block.timestamp);
    }

    // --- Verification & Read Queries ---

    function getElection(bytes32 electionId) external view returns (Election memory) {
        if (elections[electionId].state == ElectionState.NON_EXISTENT) {
            revert ElectionNotFound(electionId);
        }
        return elections[electionId];
    }

    function getAllElectionIds() external view returns (bytes32[] memory) {
        return electionIds;
    }

    function getTotalVotesRecorded(bytes32 electionId) external view returns (uint256) {
        return electionCommitmentList[electionId].length;
    }

    function verifyCommitment(
        bytes32 electionId,
        bytes32 commitmentHash
    ) external view returns (
        bool exists,
        string memory receiptReference,
        uint256 timestamp,
        uint256 blockNumber,
        uint256 voteIndex
    ) {
        VoteRecord memory record = voteCommitments[electionId][commitmentHash];
        if (record.commitmentHash != bytes32(0)) {
            return (
                true,
                record.receiptReference,
                record.timestamp,
                record.blockNumber,
                record.voteIndex
            );
        }
        return (false, "", 0, 0, 0);
    }

    function verifyReceipt(
        bytes32 electionId,
        string calldata receiptReference
    ) external view returns (
        bool exists,
        bytes32 commitmentHash,
        uint256 timestamp,
        uint256 blockNumber,
        uint256 voteIndex
    ) {
        bytes32 hash = receiptToCommitment[electionId][receiptReference];
        if (hash == bytes32(0)) {
            return (false, bytes32(0), 0, 0, 0);
        }
        VoteRecord memory record = voteCommitments[electionId][hash];
        return (
            true,
            hash,
            record.timestamp,
            record.blockNumber,
            record.voteIndex
        );
    }
}
