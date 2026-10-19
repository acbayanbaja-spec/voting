"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { fetchApi } from "../../../../lib/api";
import {
  CheckCircle2,
  Copy,
  Check,
  Clock,
  Printer,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function StudentReceiptPage() {
  const params = useParams();
  const reference = params.id as string;
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const res = await fetchApi(`/receipts/${reference}`);
        if (res.success && res.data) {
          setReceipt(res.data);
        } else {
          setFailed(true);
        }
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [reference]);

  const copyToClipboard = () => {
    if (receipt?.receiptReference) {
      navigator.clipboard.writeText(receipt.receiptReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-navy-400 text-sm">Retrieving your receipt...</p>
      </div>
    );
  }

  if (failed || !receipt) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-white border border-line shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy">Receipt Unavailable</h2>
          <p className="text-sm text-navy-400 mt-2">
            We could not load this receipt. Please check the reference code or visit My Elections
            to find your receipt.
          </p>
          <Link
            href="/student/dashboard"
            className="mt-6 inline-flex px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isConfirmed = receipt.blockchainStatus === "CONFIRMED";
  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/verify` : "/verify";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      {/* Success Notification */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center mx-auto mb-4 border border-leaf-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy">Ballot Successfully Cast</h1>
        <p className="mt-2 text-xs sm:text-sm text-navy-400 max-w-md mx-auto leading-relaxed">
          Your ballot has been accepted and recorded. Keep the reference below — it lets you verify
          your ballot was counted without revealing your choices.
        </p>
      </div>

      {/* Printable Receipt Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-line shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line gap-3 flex-wrap">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
              Official Voter Receipt
            </span>
            <h2 className="text-lg font-bold text-navy">{receipt.electionTitle}</h2>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1.5 ${
              isConfirmed
                ? "bg-leaf-50 text-leaf-700 border border-leaf-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {isConfirmed ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            <span>{isConfirmed ? "Confirmed on ledger" : "Awaiting blockchain confirmation"}</span>
          </span>
        </div>

        {/* Reference Code Box */}
        <div className="p-4 rounded-2xl bg-paper border border-line text-center">
          <span className="text-xs text-navy-400 block mb-1">Your Verification Reference</span>
          <div className="flex items-center justify-center space-x-2 flex-wrap">
            <span className="font-mono text-lg sm:text-xl font-bold text-brand-700 tracking-wider">
              {receipt.receiptReference}
            </span>
            <button
              onClick={copyToClipboard}
              title="Copy Reference"
              aria-label="Copy reference code"
              className="p-1.5 rounded-lg bg-white hover:bg-paper-dark text-navy-500 border border-line transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-leaf-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <p className="text-[11px] text-leaf-600 mt-1.5" role="status">
              Copied to clipboard
            </p>
          )}
        </div>

        {/* QR Code and Verification Info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-paper border border-line">
          <div className="p-2.5 bg-white rounded-xl border border-line flex-shrink-0">
            <QRCodeSVG value={receipt.receiptReference || "SEAIT-VOTE"} size={110} />
          </div>
          <div className="space-y-1.5 text-xs text-center sm:text-left">
            <p className="font-semibold text-navy">Independent verification</p>
            <p className="text-navy-400 leading-relaxed">
              Scan this code or enter your reference on the Verification page to confirm your
              ballot is recorded on the election ledger.
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-700 font-semibold pt-1"
            >
              <span>Go to Verification Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Technical Ledger Proofs */}
        <div className="space-y-3 text-xs pt-2">
          <div className="p-3 rounded-xl bg-paper border border-line">
            <span className="text-navy-400 block text-[11px] mb-0.5">
              Ballot Commitment Hash (SHA-256)
            </span>
            <span className="font-mono text-brand-700 text-[11px] break-all">
              {receipt.ballotCommitmentHash}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-paper border border-line">
            <span className="text-navy-400 block text-[11px] mb-0.5">
              Blockchain Transaction Hash
            </span>
            <span className="font-mono text-leaf-700 text-[11px] break-all">
              {receipt.blockchainTxHash ||
                "No on-chain transaction yet — recorded in the system ledger; blockchain confirmation pending."}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-paper border border-line">
              <span className="text-navy-400 block text-[11px] mb-0.5">Submission Timestamp</span>
              <span className="text-navy-600 text-[11px]">
                {receipt.submittedAt ? new Date(receipt.submittedAt).toLocaleString() : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-paper border border-line">
              <span className="text-navy-400 block text-[11px] mb-0.5">
                Integrity Verification Code
              </span>
              <span className="font-mono text-navy-700 text-[11px] font-bold">
                {receipt.verificationCode}
              </span>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="p-3.5 rounded-xl bg-paper border border-line text-[11px] text-navy-400 flex items-start space-x-2 leading-relaxed">
          <Lock className="w-4 h-4 text-leaf-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-navy-500">Ballot secrecy:</strong> candidate selections are
            never stored on receipts or public ledgers. Your choices remain confidential.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 px-4 rounded-xl bg-paper hover:bg-paper-dark border border-line text-navy-600 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <Link
            href="/student/dashboard"
            className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors text-center flex items-center justify-center"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
