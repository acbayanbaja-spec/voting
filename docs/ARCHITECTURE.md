# System Architecture Document

## Online Voting Management System with Blockchain
**Institution:** South East Asian Institute of Technology, Inc. (SEAIT)  
**Academic Unit:** College of Information and Communication Technology  
**Subject:** IT 323: System Integration and Architecture 1  
**Author:** Abilo, Shelley Fatima D.  

---

## 1. Architectural Overview

The Online Voting Management System with Blockchain is built with a decoupled, privacy-preserving hybrid architecture. It integrates a responsive Next.js frontend, an Express.js REST API backend, a PostgreSQL relational persistence layer (Supabase), and an EVM-compatible Solidity smart contract ledger.

```
                      +-----------------------------+
                      |         Student /           |
                      |  COMELEC / Administrator    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    Next.js 14 Web Portal    |
                      |      (Vercel Deployed)      |
                      +--------------+--------------+
                                     | HTTPS (REST API)
                                     v
                      +-----------------------------+
                      |    Node.js / Express API    |
                      |      (Render Deployed)      |
                      +-------+-------------+-------+
                              |             |
           Database Queries   |             |  Cryptographic Commitments
           & Atomic Tx        |             |  & Finalization Proofs
                              v             v
       +-------------------------+     +--------------------------+
       |   Supabase PostgreSQL   |     |    EVM Smart Contract    |
       |    (Encrypted Data,     |     |   VotingLedger.sol       |
       |  Strict Privacy Split)  |     |   (Immutable Commitments)|
       +-------------------------+     +--------------------------+
```

---

## 2. Core Subsystems

### 2.1 Web Portal (`apps/web`)
- **Framework:** Next.js 14 with React 18, TypeScript, and App Router.
- **Styling:** Tailwind CSS using SEAIT midnight navy foundation (`#0b1528`, `#050b18`) and accessible emerald, indigo, and amber states.
- **Data Visualizations:** Recharts for departmental participation charts and turnout progress.
- **Client Integrity:** Independent receipt verification portal with QR code generation.

### 2.2 Backend REST API (`apps/api`)
- **Runtime:** Node.js with TypeScript and Express.js.
- **Validation:** Strict runtime schema parsing using Zod.
- **Security:** Helmet HTTP security headers, CORS origin restrictions, rate limiters (general and auth-specific), and request correlation IDs (`x-request-id`).
- **Database Access:** Prisma ORM with versioned PostgreSQL migrations.

### 2.3 Smart Contract Vote Ledger (`blockchain/`)
- **Smart Contract:** `VotingLedger.sol` (Solidity ^0.8.20).
- **Toolchain:** Hardhat EVM development suite with ethers.js.
- **Responsibilities:**
  1. Election registration and lifecycle gating (`REGISTERED -> OPEN -> CLOSED -> FINALIZED`).
  2. Append-only vote commitment recording (`recordVoteCommitment`).
  3. Duplicate commitment and duplicate receipt prevention.
  4. Finalization sealing with Merkle/SHA-256 results commitment hash (`finalizeElection`).
  5. Independent on-chain verification queries (`verifyReceipt`, `verifyCommitment`).

---

## 3. Input-Process-Output (IPO) Alignment

In direct accordance with the Chapter 1 IPO model:

| Input | Process | Output |
| :--- | :--- | :--- |
| Login credentials | Voter authentication and eligibility verification | Verified session & eligible ballot access |
| Submitted votes | Selection validation, random salting & encryption | AES-256-GCM encrypted ballot payload |
| Tallied vote data | Real-time counting & tie detection | Real-time counts & published results |
| Recorded vote entry | Blockchain commitment submission | Immutable transaction on distributed ledger |
| Voter & candidate data | Role assignment & CSV import | Protected PostgreSQL database records |
| Live voting activity | Aggregation by department & hour | Real-time COMELEC monitoring dashboard |
