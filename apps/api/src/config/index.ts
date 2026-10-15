import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

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
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres.cyscfyujtufkwldrflth:128088100011marga@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require",
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
