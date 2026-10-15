import crypto from "crypto";
import bcrypt from "bcryptjs";
import { config } from "../config";

const SALT_ROUNDS = 10;
const ALGORITHM = "aes-256-gcm";

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plaintext password with a bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a cryptographically secure random hex salt.
 */
export function generateSalt(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Generates a human-readable, unique receipt reference for voter verification.
 * Format: SEAIT-YYYY-[RANDOM_8_CHARS_UPPERCASE]
 */
export function generateReceiptReference(prefix: string = "SEAIT-SC"): string {
  const year = new Date().getFullYear();
  const randomBytes = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${year}-${randomBytes}`;
}

/**
 * Generates a SHA-256/Keccak-256 commitment hash of voter selections and cryptographic salt.
 * Ensures the ballot choices cannot be inferred while being permanently verifiable.
 */
export function generateCommitmentHash(
  electionId: string,
  selections: Array<{ positionId: string; candidateId: string }>,
  salt: string
): string {
  // Sort selections deterministically to ensure canonical hash representation
  const canonicalSelections = [...selections].sort((a, b) =>
    a.positionId === b.positionId
      ? a.candidateId.localeCompare(b.candidateId)
      : a.positionId.localeCompare(b.positionId)
  );

  const payload = JSON.stringify({
    electionId,
    selections: canonicalSelections,
    salt,
  });

  return "0x" + crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Generates a verifiable HMAC verification code for a given receipt reference.
 */
export function generateVerificationCode(receiptRef: string, commitmentHash: string): string {
  return crypto
    .createHmac("sha256", config.encryptionKey)
    .update(`${receiptRef}:${commitmentHash}`)
    .digest("hex")
    .substring(0, 12)
    .toUpperCase();
}

/**
 * Encrypts sensitive ballot payload using AES-256-GCM.
 */
export function encryptBallot(data: any): string {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(config.encryptionKey.substring(0, 64), "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return JSON.stringify({
    iv: iv.toString("hex"),
    authTag,
    encryptedData: encrypted,
  });
}

/**
 * Decrypts an encrypted ballot payload using AES-256-GCM.
 */
export function decryptBallot(cipherPayload: string): any {
  const { iv, authTag, encryptedData } = JSON.parse(cipherPayload);
  const key = Buffer.from(config.encryptionKey.substring(0, 64), "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

/**
 * Generates an aggregated SHA-256 hash of final election results for blockchain sealing.
 */
export function generateResultsCommitmentHash(
  electionId: string,
  results: Array<{ positionId: string; candidateId: string; voteCount: number }>
): string {
  const canonicalResults = [...results].sort((a, b) =>
    a.positionId === b.positionId
      ? a.candidateId.localeCompare(b.candidateId)
      : a.positionId.localeCompare(b.positionId)
  );

  const payload = JSON.stringify({
    electionId,
    results: canonicalResults,
  });

  return "0x" + crypto.createHash("sha256").update(payload).digest("hex");
}
