# Database Schema & Relational Architecture

## PostgreSQL Database (Supabase) via Prisma ORM

This document specifies the database schema for the **Online Voting Management System with Blockchain** for the South East Asian Institute of Technology, Inc. (SEAIT).

---

## 1. Privacy Architecture & Architectural Separation

A fundamental requirement of ballot privacy (Section 13) is that **voter identity records must never be linked to candidate choices**.

In this schema:
1. `User` holds registered student profiles and authentication hashes.
2. `VoterEligibility` tracks whether a student has already voted (`hasVoted: Boolean`, `votedAt: DateTime`), but **does not contain candidate choices**.
3. `BallotSubmission` stores the encrypted ballot payload and blockchain commitment hash, but **contains NO `userId` foreign key**.
4. Even if an administrator queries `ballot_submissions` and `ballot_choices`, there is no relational key linking any specific row to an individual student account.

---

## 2. Entity Specifications

### 2.1 `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Internal user ID |
| `schoolId` | String | Unique, Indexed | Institutional ID (e.g. `2024-00123`) |
| `email` | String | Unique | Institutional email |
| `passwordHash` | String | Not Null | Bcrypt hash with 10 salt rounds |
| `firstName` | String | Not Null | Given name |
| `lastName` | String | Not Null | Surname |
| `role` | Enum | `STUDENT`, `COMELEC_OFFICER`, `SYSTEM_ADMIN` | RBAC role |
| `department` | String | Not Null | Academic department (e.g. CICT) |
| `yearLevel` | String | Not Null | Year level (e.g. `3rd Year`) |
| `isActive` | Boolean | Default `true` | Account active state |
| `createdAt` | DateTime | Default `now()` | Registration timestamp |

### 2.2 `elections`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Unique election identifier |
| `title` | String | Not Null | Election title |
| `description` | Text | Not Null | Election guidelines & rules |
| `academicYear` | String | Not Null | e.g. `2026-2027` |
| `semester` | String | Not Null | e.g. `1st Semester` |
| `status` | Enum | `DRAFT`, `SCHEDULED`, `OPEN`, `CLOSED`, `UNDER_REVIEW`, `PUBLISHED`, `CANCELLED` | Lifecycle state |
| `startTime` | DateTime | Not Null | Authorized voting opening time |
| `endTime` | DateTime | Not Null | Authorized voting closing time |
| `onChainElectionId`| String | Unique, Nullable | Bytes32 hex identifier on smart contract |
| `resultCommitmentHash`| String | Nullable | SHA-256 results Merkle root |
| `resultsPublishedAt`| DateTime | Nullable | Official publication timestamp |

### 2.3 `positions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Position identifier |
| `electionId` | UUID | Foreign Key -> `elections(id)` | Associated election |
| `title` | String | Not Null | Position name (e.g. `President`) |
| `description` | Text | Nullable | Position responsibilities |
| `orderIndex` | Integer| Default `0` | Display ordering |
| `maxChoices` | Integer| Default `1` | Max candidates selectable |
| `isRequired` | Boolean| Default `true` | Must voter select a choice |

### 2.4 `candidates`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Candidate identifier |
| `electionId` | UUID | Foreign Key -> `elections(id)` | Associated election |
| `positionId` | UUID | Foreign Key -> `positions(id)` | Position running for |
| `fullName` | String | Not Null | Certified candidate name |
| `studentId` | String | Not Null | Institutional student ID |
| `partyList` | String | Nullable | Party coalition name |
| `platform` | Text | Not Null | Candidate platform statements |
| `photoUrl` | String | Nullable | Authorized portrait photograph |

### 2.5 `voter_eligibilities`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Record identifier |
| `electionId` | UUID | Foreign Key -> `elections(id)` | Associated election |
| `userId` | UUID | Foreign Key -> `users(id)` | Associated student |
| `hasVoted` | Boolean| Default `false` | Prevent duplicate balloting |
| `votedAt` | DateTime| Nullable | Timestamp when vote was accepted |
| `receiptReference`| String | Nullable, Indexed | Reference for receipt lookup |
| **Unique Constraint** | `(electionId, userId)` | Prevents duplicate voter registration |

### 2.6 `ballot_submissions` (Strict Privacy Decoupled)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Internal submission ID |
| `electionId` | UUID | Foreign Key -> `elections(id)` | Associated election |
| `ballotCommitmentHash`| String | Unique | Cryptographic commitment hash |
| `receiptReference`| String | Unique, Indexed | Human-readable verification reference |
| `encryptedBallot` | Text | Not Null | AES-256-GCM encrypted choices + salt |
| `blockchainTxHash`| String | Nullable | On-chain EVM transaction hash |
| `blockchainStatus`| Enum | `PENDING`, `CONFIRMED`, `FAILED` | Ledger confirmation state |
| `blockNumber` | Integer| Nullable | Mined block number |
| `submittedAt` | DateTime| Default `now()` | Timestamp of acceptance |

### 2.7 `ballot_choices`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Choice identifier |
| `submissionId` | UUID | Foreign Key -> `ballot_submissions(id)` | Parent submission |
| `positionId` | UUID | Foreign Key -> `positions(id)` | Position voted on |
| `candidateId` | UUID | Foreign Key -> `candidates(id)` | Candidate selected |

### 2.8 `receipts`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Record ID |
| `receiptReference`| String | Unique | Human-readable reference (`SEAIT-SC-YYYY-XXXX`) |
| `electionId` | UUID | Foreign Key -> `elections(id)` | Associated election |
| `ballotCommitmentHash`| String | Not Null | High-entropy SHA-256 commitment hash |
| `blockchainTxHash`| String | Nullable | Ledger transaction hash |
| `blockchainStatus`| Enum | `PENDING`, `CONFIRMED`, `FAILED` | Confirmation status |
| `verificationCode`| String | Not Null | HMAC-SHA256 integrity verification code |
| `createdAt` | DateTime| Default `now()` | Issuance timestamp |

### 2.9 `election_results`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Result snapshot ID |
| `electionId` | UUID | Foreign Key -> `elections(id)` | Associated election |
| `positionId` | UUID | Foreign Key -> `positions(id)` | Position |
| `candidateId` | UUID | Foreign Key -> `candidates(id)` | Candidate |
| `voteCount` | Integer| Default `0` | Certified total votes |
| `rank` | Integer| Default `1` | Ranking in position |
| `isWinner` | Boolean| Default `false` | Proclaimed winner flag |

### 2.10 `audit_logs`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Log identifier |
| `userId` | UUID | Nullable, Foreign Key -> `users(id)` | Initiating user |
| `action` | String | Not Null | e.g. `BALLOT_CAST`, `RESULTS_PUBLISHED` |
| `entity` | String | Not Null | Target entity |
| `entityId` | String | Nullable | Target entity ID |
| `details` | Text | Nullable | JSON stringified metadata |
| `ipAddress` | String | Nullable | Client IP |
| `userAgent` | String | Nullable | Client browser agent |
| `createdAt` | DateTime| Default `now()` | Log timestamp |
