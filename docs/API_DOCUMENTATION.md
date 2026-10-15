# Backend REST API Specification

## Base URL
`/api/v1`

All responses follow a consistent standard JSON wrapper:
```json
{
  "success": true,
  "data": { ... }
}
```
Or upon error:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### 1.1 `POST /auth/login`
Authenticates a user with School ID or Email and password.
- **Rate Limit:** 20 requests per 15 minutes.
- **Request Body:**
  ```json
  {
    "identifier": "2024-00123",
    "password": "Student@12345"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "u1000...",
        "schoolId": "2024-00123",
        "email": "shelley.abilo@seait.edu.ph",
        "firstName": "Shelley Fatima",
        "lastName": "Abilo",
        "role": "STUDENT",
        "department": "College of Information and Communication Technology",
        "yearLevel": "3rd Year"
      }
    }
  }
  ```

### 1.2 `GET /auth/me`
Returns the currently authenticated user's profile.
- **Header:** `Authorization: Bearer <token>`
- **Success Response (200 OK):** User object.

---

## 2. Election Endpoints (`/api/v1/elections`)

### 2.1 `GET /elections`
List elections with optional status and search filtering.
- **Query Params:** `status` (Enum), `search` (String).

### 2.2 `GET /elections/:id`
Retrieves single election details, including positions, candidates, and counts.

### 2.3 `POST /elections`
Creates a new election (COMELEC Officer / System Admin only).
- **Request Body:**
  ```json
  {
    "title": "SEAIT Supreme Student Council General Election 2026-2027",
    "description": "Annual institutional election...",
    "academicYear": "2026-2027",
    "semester": "1st Semester",
    "startTime": "2026-10-15T08:00:00Z",
    "endTime": "2026-10-20T17:00:00Z"
  }
  ```

### 2.4 `PATCH /elections/:id/status`
Enforces valid state machine transitions:
`DRAFT -> SCHEDULED -> OPEN -> CLOSED -> UNDER_REVIEW -> PUBLISHED`.
- **Request Body:** `{ "status": "OPEN", "reason": "Authorized opening" }`

---

## 3. Ballot Endpoints (`/api/v1/ballots`)

### 3.1 `GET /ballots/eligibility/:electionId`
Checks voter eligibility and voting status for the authenticated student.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "isEligible": true,
      "hasVoted": false,
      "votedAt": null,
      "receiptReference": null
    }
  }
  ```

### 3.2 `POST /ballots/cast`
Casts a secure, atomic ballot.
- **Permission:** `STUDENT` role only.
- **Validation:** Enforces election is OPEN, within time window, student is eligible, has not voted, and candidate selections satisfy position rules.
- **Request Body:**
  ```json
  {
    "electionId": "e1000...",
    "selections": [
      { "positionId": "pos-pres", "candidateId": "cand-pres-1" },
      { "positionId": "pos-vp", "candidateId": "cand-vp-1" }
    ]
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "receiptReference": "SEAIT-SC-2026-8A3F9B2C",
      "verificationCode": "B4E7A291C083",
      "ballotCommitmentHash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      "blockchainTxHash": "0x9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
      "blockchainStatus": "CONFIRMED",
      "submittedAt": "2026-10-15T09:00:00.000Z"
    }
  }
  ```

---

## 4. Receipt & Verification Endpoints (`/api/v1/receipts`)

### 4.1 `GET /receipts/:reference`
Public metadata lookup for a receipt (without exposing voter choices).

### 4.2 `POST /receipts/verify`
Independently verifies receipt reference against database records and smart contract ledger.
- **Request Body:** `{ "receiptReference": "SEAIT-SC-2026-8A3F9B2C" }`

---

## 5. Results & Tally Endpoints (`/api/v1/results`)

### 5.1 `GET /results/:electionId`
Computes or retrieves official election results report.

### 5.2 `POST /results/:electionId/publish`
Finalizes tally, computes canonical SHA-256 results commitment, transitions election status to `PUBLISHED`, and seals root hash onto smart contract ledger.
- **Permission:** `COMELEC_OFFICER` / `SYSTEM_ADMIN`.

---

## 6. Real-Time Analytics (`/api/v1/analytics`)

### 6.1 `GET /analytics/:electionId/overview`
Real-time turnout percentage, total eligible, accepted ballots, remaining voters, departmental participation, and transaction health metrics.

---

## 7. System Health Endpoint (`/api/v1/health`)

### 7.1 `GET /health`
Returns system status, PostgreSQL connection status, EVM network connectivity, and node memory statistics.
