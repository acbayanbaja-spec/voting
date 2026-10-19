import { prisma } from "../lib/prisma";
import { blockchainService } from "./blockchain.service";
import { generateVerificationCode } from "../utils/crypto";

export interface VerificationResult {
  verified: boolean;
  /** CONFIRMED_ON_CHAIN | CONFIRMED_IN_DATABASE | PENDING | NOT_FOUND | INVALID */
  status: string;
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
        status: "NOT_FOUND",
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

    // Honest status determination:
    // - CONFIRMED_ON_CHAIN: integrity check passed AND found on the smart contract.
    // - CONFIRMED_IN_DATABASE: integrity check passed against the system's records.
    // - PENDING: recorded but blockchain confirmation still outstanding.
    // - INVALID: the stored record failed the integrity check.
    let status: string;
    let verified: boolean;
    let message: string;

    if (!verificationCodeValid) {
      status = "INVALID";
      verified = false;
      message =
        "Integrity check failed: the verification code does not match this receipt's commitment hash. Report this to the COMELEC committee.";
    } else if (onChain.exists) {
      status = "CONFIRMED_ON_CHAIN";
      verified = true;
      message =
        "Verified: this receipt's commitment is recorded on the blockchain ledger and matches the system database.";
    } else if (receipt.blockchainStatus === "PENDING") {
      status = "PENDING";
      verified = true;
      message =
        "Recorded: the ballot is accepted and stored in the system ledger. Blockchain confirmation is still pending, so no on-chain record is available yet.";
    } else {
      status = "CONFIRMED_IN_DATABASE";
      verified = true;
      message =
        "Verified against the system's election records. An on-chain record could not be located for this receipt.";
    }

    return {
      verified,
      status,
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
