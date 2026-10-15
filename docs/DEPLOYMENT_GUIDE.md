# Production Deployment Guide

## Architecture Summary
- **Frontend (`apps/web`):** Vercel
- **Backend API (`apps/api`):** Render
- **Database:** Supabase (PostgreSQL with Connection Pooling)
- **Blockchain:** Local EVM development chain or Sepolia / Polygon testnet

---

## 1. Supabase PostgreSQL Configuration

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Navigate to **Project Settings > Database**.
3. Under **Connection String**:
   - For `DATABASE_URL`, select **Transaction pooler mode** (port 6543):
     ```
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
     ```
   - For `DIRECT_URL`, select **Direct mode** (port 5432):
     ```
     postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
     ```
4. Run migrations from local machine:
   ```bash
   npm run db:push
   npm run db:seed
   ```

---

## 2. Render Backend API Deployment

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository: `https://github.com/acbayanbaja-spec/voting`.
3. Configure service settings:
   - **Root Directory:** `apps/api`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/v1/health`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render default)
   - `DATABASE_URL`: Your Supabase pooler connection string
   - `DIRECT_URL`: Your Supabase direct connection string
   - `JWT_SECRET`: Random 32-byte hex secret
   - `ENCRYPTION_KEY`: Random 64-character hex AES key
   - `FRONTEND_ORIGIN`: Your production Vercel frontend URL (e.g. `https://seait-voting.vercel.app`)
   - `BLOCKCHAIN_RPC_URL`: Configured EVM node RPC endpoint
   - `BLOCKCHAIN_CHAIN_ID`: EVM Chain ID (e.g. 11155111 for Sepolia, or local)
   - `BLOCKCHAIN_CONTRACT_ADDRESS`: Deployed `VotingLedger` contract address
   - `BLOCKCHAIN_DEPLOYER_PRIVATE_KEY`: COMELEC relayer wallet private key

---

## 3. Vercel Frontend Deployment

1. Import your GitHub repository on [Vercel](https://vercel.com).
2. Configure project:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `apps/web`
   - **Build Command:** `next build`
   - **Output Directory:** `.next`
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render API URL, e.g. `https://seait-voting-api.onrender.com/api/v1`
4. Deploy the application.

---

## 4. Blockchain Smart Contract Deployment

1. To deploy the contract to a local or public testnet:
   ```bash
   cd blockchain
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network localhost
   ```
2. The deployment script outputs `deployed-contract.json` containing the deployed address and chain ID.
3. Update `BLOCKCHAIN_CONTRACT_ADDRESS` in Render environment variables.
