import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

const DEFAULT_SUPABASE_URL =
  "postgresql://postgres.cyscfyujtufkwldrflth:128088100011marga@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";

export function sanitizeDatabaseUrl(raw?: string): string {
  if (!raw) return DEFAULT_SUPABASE_URL;

  let cleaned = String(raw).trim();

  // Strip leading and trailing quotes (both double and single)
  while (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Strip accidental "DATABASE_URL=" prefix if user pasted the entire env line
  if (cleaned.startsWith("DATABASE_URL=")) {
    cleaned = cleaned.substring("DATABASE_URL=".length).trim();
    while (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
    }
  }

  // If URL does not start with postgresql:// or postgres://, fallback to safe URL
  if (!cleaned.startsWith("postgresql://") && !cleaned.startsWith("postgres://")) {
    return DEFAULT_SUPABASE_URL;
  }

  // Ensure sslmode=require for cloud PostgreSQL
  const isLocal = /localhost|127\.0\.0\.1/.test(cleaned);
  if (!isLocal && !cleaned.includes("sslmode=")) {
    cleaned += (cleaned.includes("?") ? "&" : "?") + "sslmode=require";
  }

  return cleaned;
}

// Sanitize process.env.DATABASE_URL immediately so Prisma's schema validator sees valid protocol
process.env.DATABASE_URL = sanitizeDatabaseUrl(process.env.DATABASE_URL);

export interface AppConfig {
  env: string;
  port: number;
  databaseUrl: string;
  directUrl?: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  encryptionKey: string;
  frontendOrigin: string;
  blockchain: {
    rpcUrl: string;
    chainId: number;
    contractAddress: string;
    deployerPrivateKey?: string;
  };
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
  jwtSecret: process.env.JWT_SECRET || "seait-voting-system-super-secret-jwt-key-change-in-production-2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  encryptionKey: process.env.ENCRYPTION_KEY || "e8c9b3a1f4d2e7c6b5a493827104fba2e8c9b3a1f4d2e7c6b5a493827104fba2",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  blockchain: {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
    chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || "31337", 10),
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    deployerPrivateKey: process.env.BLOCKCHAIN_DEPLOYER_PRIVATE_KEY,
  },
};
