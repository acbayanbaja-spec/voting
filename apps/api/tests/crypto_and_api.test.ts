import request from "supertest";
import { createApp } from "../src/app";
import {
  generateSalt,
  generateCommitmentHash,
  generateReceiptReference,
  generateVerificationCode,
  encryptBallot,
  decryptBallot,
  hashPassword,
  comparePassword,
} from "../src/utils/crypto";

describe("Cryptography & Privacy Tests", () => {
  it("should securely hash and compare passwords", async () => {
    const raw = "SecureStudentPass2026!";
    const hash = await hashPassword(raw);

    expect(hash).not.toEqual(raw);
    expect(await comparePassword(raw, hash)).toBe(true);
    expect(await comparePassword("WrongPassword", hash)).toBe(false);
  });

  it("should generate deterministic commitment hash for given selections and salt", () => {
    const salt = generateSalt();
    const selections = [
      { positionId: "pos-1", candidateId: "cand-1" },
      { positionId: "pos-2", candidateId: "cand-2" },
    ];

    const hash1 = generateCommitmentHash("election-1", selections, salt);
    const hash2 = generateCommitmentHash("election-1", selections, salt);

    expect(hash1).toEqual(hash2);
    expect(hash1.startsWith("0x")).toBe(true);

    // Order independence (canonical sorting)
    const reversed = [
      { positionId: "pos-2", candidateId: "cand-2" },
      { positionId: "pos-1", candidateId: "cand-1" },
    ];
    const hashReversed = generateCommitmentHash("election-1", reversed, salt);
    expect(hash1).toEqual(hashReversed);
  });

  it("should encrypt and decrypt ballot choices accurately using AES-256-GCM", () => {
    const originalPayload = {
      electionId: "el-123",
      choices: [{ pos: "President", cand: "Christian Dave Morales" }],
      secretSalt: "random-entropy-999",
    };

    const cipher = encryptBallot(originalPayload);
    expect(typeof cipher).toBe("string");
    expect(cipher).not.toContain("Christian Dave Morales");

    const decrypted = decryptBallot(cipher);
    expect(decrypted).toEqual(originalPayload);
  });

  it("should generate distinct human-readable receipt references", () => {
    const ref1 = generateReceiptReference();
    const ref2 = generateReceiptReference();

    expect(ref1).toMatch(/^SEAIT-SC-\d{4}-[A-F0-9]{8}$/);
    expect(ref2).toMatch(/^SEAIT-SC-\d{4}-[A-F0-9]{8}$/);
    expect(ref1).not.toEqual(ref2);
  });

  it("should verify HMAC verification codes reliably", () => {
    const ref = "SEAIT-SC-2026-ABCD1234";
    const commitment = "0x1234567890abcdef";
    const code = generateVerificationCode(ref, commitment);

    expect(code.length).toBe(12);
    expect(code).toEqual(generateVerificationCode(ref, commitment));
    expect(code).not.toEqual(generateVerificationCode(ref, "0xdifferenthash"));
  });
});

describe("API Security & Routing Tests", () => {
  const app = createApp();

  it("GET / should return SEAIT API institutional info", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.institution).toContain("South East Asian Institute of Technology");
    expect(res.body.healthCheck).toBe("/api/v1/health");
  });

  it("GET /api/v1/health should respond with service status", async () => {
    const res = await request(app).get("/api/v1/health");
    // Depending on DB connection availability, status is 200 (healthy) or 503 (degraded)
    expect([200, 503]).toContain(res.status);
    expect(res.body.service).toBe("seait-voting-api");
    expect(res.body).toHaveProperty("database");
    expect(res.body).toHaveProperty("blockchain");
  });

  it("POST /api/v1/auth/login should validate missing fields with 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/v1/non-existent-route should return 404", async () => {
    const res = await request(app).get("/api/v1/non-existent-route");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
