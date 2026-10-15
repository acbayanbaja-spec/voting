"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { fetchApi } from "../../../../lib/api";
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Printer,
  Cpu,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function StudentReceiptPage() {
  const params = useParams();
  const reference = params.id as string;
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if unavailable
    }

    async function loadReceipt() {
      try {
        const res = await fetchApi(`/receipts/${reference}`);
        if (res.success && res.data) {
          setReceipt(res.data);
        }
      } catch (err) {
        console.error("Failed to load receipt:", err);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Retrieving your verified receipt...</p>
      </div>
    );
  }

  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/verify` : "/verify";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Success Notification */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Ballot Successfully Cast!</h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Your cryptographic vote commitment has been recorded on the SEAIT election ledger.
        </p>
      </div>

      {/* Printable Receipt Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
              Official Voter Receipt
            </span>
            <h2 className="text-lg font-bold text-white">{receipt?.electionTitle}</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            {receipt?.blockchainStatus || "CONFIRMED"}
          </span>
        </div>

        {/* Reference Code Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
          <span className="text-xs text-slate-400 block mb-1">Your Verification Reference</span>
          <div className="flex items-center justify-center space-x-2">
            <span className="font-mono text-xl sm:text-2xl font-extrabold text-brand-300 tracking-wider">
              {receipt?.receiptReference}
            </span>
            <button
              onClick={copyToClipboard}
              title="Copy Reference"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* QR Code and Verification Info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="p-2.5 bg-white rounded-xl shadow-md flex-shrink-0">
            <QRCodeSVG value={receipt?.receiptReference || "SEAIT-VOTE"} size={110} />
          </div>
          <div className="space-y-1.5 text-xs text-center sm:text-left">
            <p className="font-semibold text-white">Independent Ledger Verification</p>
            <p className="text-slate-400 leading-relaxed">
              Scan this code or enter your reference on the Verification Portal to confirm your ballot's inclusion on the blockchain.
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center space-x-1 text-brand-400 hover:text-brand-300 font-semibold pt-1"
            >
              <span>Go to Verification Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Technical Ledger Proofs */}
        <div className="space-y-3 text-xs pt-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block text-[11px] mb-0.5">Ballot Commitment Hash (SHA-256)</span>
            <span className="font-mono text-indigo-300 text-[11px] break-all">
              {receipt?.ballotCommitmentHash}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block text-[11px] mb-0.5">Blockchain Transaction Hash</span>
            <span className="font-mono text-emerald-400 text-[11px] break-all">
              {receipt?.blockchainTxHash || "Recorded in local ledger; awaiting block mine"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px] mb-0.5">Submission Timestamp</span>
              <span className="text-slate-300 text-[11px]">
                {receipt?.submittedAt ? new Date(receipt.submittedAt).toLocaleString() : "N/A"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-500 block text-[11px] mb-0.5">Integrity Verification Code</span>
              <span className="font-mono text-slate-200 text-[11px] font-bold">
                {receipt?.verificationCode}
              </span>
            </div>
          </div>
        </div>

        {/* Privacy Assurance Notice */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
          <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Ballot Secrecy Guarantee:</strong> Candidate selections are never stored on receipts or public ledgers. Your choices remain strictly confidential.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <Link
            href="/student/dashboard"
            className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors text-center"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
