# Online Voting Management System with Blockchain

**Institution:** South East Asian Institute of Technology, Inc. (SEAIT)  
**Academic Unit:** College of Information and Communication Technology  
**Subject:** IT 323: System Integration and Architecture 1  
**Target Organization:** Commission on Elections (COMELEC) & Supreme Student Council (SSC)  
**Researcher:** Shelley Fatima D. Abilo  

---

## 1. Project Overview & Mission

The **Online Voting Management System with Blockchain** is an enterprise-grade, privacy-preserving, and tamper-evident election platform developed for the Supreme Student Council general elections of the South East Asian Institute of Technology, Inc. (SEAIT).

It replaces traditional on-campus paper balloting with a secure web-based platform that enforces **strict ballot secrecy**, **immutable blockchain vote commitment recording**, **automated real-time tallying**, and **voter-verifiable receipts**.

---

## 2. Core Capabilities (Chapter 1 Scope)

1. **Online Voting (Blockchain-Secured):** Remote voting from any internet-connected device, eliminating precinct lines while verifying student enrollment.
2. **Automated Real-Time Vote Tallying:** Automatic calculation of candidate counts, percentages, undervotes, and tie detection upon election closure.
3. **Immutable Blockchain Vote Ledger:** Every accepted vote commitment is permanently sealed into an EVM smart contract (`VotingLedger.sol`).
4. **Voter-Verifiable Receipts:** Issues unique references (e.g. `SEAIT-SC-2026-8A3F9B2C`) and QR codes allowing independent ledger verification without exposing candidate choices.
5. **Encrypted, Decentralized Voter Database:** Architectural decoupling between student identity records and ballot submissions, safeguarding voter privacy under RA 10173.
6. **Real-Time Monitoring Dashboard:** Live participation and departmental turnout monitoring for COMELEC officers while protecting interim candidate counts.

---

## 3. Technology Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide icons, Recharts, Framer Motion.
- **Backend API:** Node.js, Express.js, TypeScript, Zod validation, Helmet, CORS, Express-Rate-Limit, Morgan, Bcrypt.
- **Database:** PostgreSQL (Supabase compatible) managed via Prisma ORM with versioned migrations and atomic transactions.
- **Blockchain:** Solidity `^0.8.20`, Hardhat EVM toolchain, ethers.js v6.
- **Testing:** Hardhat/Chai contract tests, Jest backend test suite.

---

## 4. Architecture & Monorepo Structure

```
votingsystem/
├── apps/
│   ├── web/                     # Next.js 14 Web Portal
│   │   ├── src/app/             # Public, Student, COMELEC, and Admin pages
│   │   ├── src/components/      # Navbar, Footer, and UI components
│   │   ├── src/context/         # AuthContext and session state
│   │   └── src/lib/             # Typed API client
│   └── api/                     # Express REST API
│       ├── prisma/              # Prisma schema & rich SEAIT seed data
│       ├── src/controllers/     # API request handlers
│       ├── src/services/        # Ballot, Tally, Election, & Blockchain services
│       ├── src/middlewares/     # Auth (RBAC), error handling, & validation
│       ├── src/utils/           # Cryptographic salting, hashing, & encryption
│       └── tests/               # Unit and integration test suite
├── blockchain/                  # EVM Smart Contracts
│   ├── contracts/               # VotingLedger.sol
│   ├── scripts/                 # Automated deployment scripts
│   └── test/                    # Hardhat unit tests
├── docs/                        # Architecture, DB schema, API, & privacy specs
├── .gitignore
├── package.json                 # Monorepo workspace configuration
└── README.md
```

---

## 5. Demonstration Test Accounts

The included seed script provisions verified test accounts across all roles:

| Role | School ID / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Student** | `2024-00123` / `shelley.abilo@seait.edu.ph` | `Student@12345` | Eligible voter, cast ballot, verify receipt |
| **Student** | `2024-00124` / `stephen.reyes@seait.edu.ph` | `Student@12345` | Eligible voter |
| **COMELEC Officer** | `comelec@seait.edu.ph` | `Comelec@12345` | Create elections, import CSV, monitor turnout, publish results |
| **System Admin** | `admin@seait.edu.ph` | `Admin@12345` | User accounts, security policies, system health |

*Quick-fill test buttons are conveniently available on the Sign In page.*

---

## 6. Getting Started

### 6.1 Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### 6.2 Installation
```bash
# Install all package dependencies
npm install
```

### 6.3 Smart Contract Compilation & Tests
```bash
cd blockchain
npx hardhat compile
npx hardhat test
```
*All 10 contract tests pass covering access control, duplicate prevention, and finalization.*

### 6.4 Backend Database Setup & Seeding
```bash
cd apps/api
# Generate Prisma client
npx prisma generate

# Push schema to PostgreSQL / Supabase
npx prisma db push

# Seed realistic SEAIT Student Council election & accounts
npx ts-node prisma/seed.ts
```

### 6.5 Running Locally
```bash
# Start backend API (Port 5000)
cd apps/api
npm run dev

# In a separate terminal, start frontend web portal (Port 3000)
cd apps/web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Cryptographic Privacy Design

1. **Decoupled Records:** `ballot_submissions` and `ballot_choices` contain **no student ID column**, preventing database queries from correlating voters with choices.
2. **High-Entropy Salting:** Each ballot is salted with a 256-bit secure random key before SHA-256 commitment hashing, preventing dictionary attacks on finite candidate combinations.
3. **AES-256-GCM Encryption:** Ballot payloads are encrypted with authenticated AES-256-GCM.
4. **Receipt-Freeness:** Receipts prove inclusion on the blockchain ledger without revealing candidate selections, ensuring coercion resistance.

---

## 8. Deployment Guides

- **Frontend (Vercel):** See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md#3-vercel-frontend-deployment).
- **Backend API (Render):** See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md#2-render-backend-api-deployment).
- **Database (Supabase PostgreSQL):** See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md#1-supabase-postgresql-configuration).

---

## 9. License & Institutional Attribution

Developed for the South East Asian Institute of Technology, Inc. (SEAIT), College of Information and Communication Technology. All rights reserved.
