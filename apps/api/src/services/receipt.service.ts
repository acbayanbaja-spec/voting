import { prisma } from "../lib/prisma";
import { blockchainService } from "./blockchain.service";
import { generateVerificationCode } from "../utils/crypto";

export interface VerificationResult {
  verified: boolean;
  receiptReference: string;
  electionId: string;
  electionTitle: string;
  submittedAt: string;
  ballotCommitmentHash: string;
  blockchainTxHash: string | null;
  blockchainStatus: string;
  verificationCodeValid: boolean;
  onChainVerification: {
    verifiedOnChain: boolean;
    blockNumber?: number;
    timestamp?: number;
  };
  message: string;
}

export class ReceiptService {
  async getReceiptByReference(reference: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { receiptReference: reference },
      include: {
        election: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!receipt) {
      const err: any = new Error("Receipt not found for reference: " + reference);
      err.statusCode = 404;
      err.code = "RECEIPT_NOT_FOUND";
      throw err;
    }

    return receipt;
  }

  async verifyReceipt(reference: string): Promise<VerificationResult> {
    const receipt = await prisma.receipt.findUnique({
      where: { receiptReference: reference },
      include: {
        election: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!receipt) {
      return {
        verified: false,
        receiptReference: reference,
        electionId: "",
        electionTitle: "",
        submittedAt: "",
        ballotCommitmentHash: "",
        blockchainTxHash: null,
        blockchainStatus: "NOT_FOUND",
        verificationCodeValid: false,
        onChainVerification: {
          verifiedOnChain: false,
        },
        message: "No recorded vote matches this receipt reference.",
      };
    }

    // Verify cryptographic HMAC verification code
    const expectedCode = generateVerificationCode(
      receipt.receiptReference,
      receipt.ballotCommitmentHash
    );
    const verificationCodeValid = receipt.verificationCode === expectedCode;

    // Verify against on-chain smart contract ledger if connected
    const onChain = await blockchainService.verifyReceiptOnChain(
      receipt.electionId,
      receipt.receiptReference
    );

    const verified = verificationCodeValid && (onChain.exists || receipt.blockchainStatus !== "FAILED");

    let message = "Receipt successfully verified against immutable ledger records.";
    if (!verificationCodeValid) {
      message = "Integrity check failed: Verification code does not match commitment hash.";
    } else if (onChain.exists) {
      message = "Cryptographically verified on smart contract ledger and local database.";
    }

    return {
      verified,
      receiptReference: receipt.receiptReference,
      electionId: receipt.electionId,
      electionTitle: receipt.election.title,
      submittedAt: receipt.createdAt.toISOString(),
      ballotCommitmentHash: receipt.ballotCommitmentHash,
      blockchainTxHash: receipt.blockchainTxHash,
      blockchainStatus: receipt.blockchainStatus,
      verificationCodeValid,
      onChainVerification: {
        verifiedOnChain: onChain.exists,
        blockNumber: onChain.blockNumber,
        timestamp: onChain.timestamp,
      },
      message,
    };
  }
}

export const receiptService = new ReceiptService();
