import { Router } from "express";
import { z } from "zod";
import { receiptService } from "../services/receipt.service";
import { validateRequest } from "../middlewares/validation";

export const receiptRouter = Router();

// GET /:reference - Fetch public receipt metadata
receiptRouter.get("/:reference", async (req, res, next) => {
  try {
    const receipt = await receiptService.getReceiptByReference(req.params.reference);
    res.json({
      success: true,
      data: {
        receiptReference: receipt.receiptReference,
        electionTitle: receipt.election.title,
        submittedAt: receipt.createdAt.toISOString(),
        ballotCommitmentHash: receipt.ballotCommitmentHash,
        blockchainTxHash: receipt.blockchainTxHash,
        blockchainStatus: receipt.blockchainStatus,
        verificationCode: receipt.verificationCode,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /verify - Independently verify a receipt
const verifySchema = {
  body: z.object({
    receiptReference: z.string().min(5, "Receipt reference is required"),
  }),
};

receiptRouter.post("/verify", validateRequest(verifySchema), async (req, res, next) => {
  try {
    const verification = await receiptService.verifyReceipt(req.body.receiptReference);
    res.json({
      success: true,
      data: verification,
    });
  } catch (err) {
    next(err);
  }
});
