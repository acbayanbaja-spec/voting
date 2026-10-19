"use client";

import React, { useState } from "react";
import { fetchApi } from "../../lib/api";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Hash,
  AlertTriangle,
} from "lucide-react";

export default function VerifyReceiptPage() {
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetchApi("/receipts/verify", {
        method: "POST",
        body: JSON.stringify({ receiptReference: reference.trim().toUpperCase() }),
      });

      if (res.success) {
        setResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || "The verification service is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusMeta: Record<
    string,
    { label: string; tone: string; icon: React.ReactNode }
  > = {
    CONFIRMED_ON_CHAIN: {
      label: "Confirmed on blockchain",
      tone: "bg-leaf-50 text-leaf-700 border-leaf-200",
      icon: <CheckCircle2 className="w-7 h-7" />,
    },
    CONFIRMED_IN_DATABASE: {
      label: "Verified in system records",
      tone: "bg-brand-50 text-brand-700 border-brand-200",
      icon: <Database className="w-7 h-7" />,
    },
    PENDING: {
      label: "Recorded — awaiting blockchain confirmation",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="w-7 h-7" />,
    },
    INVALID: {
      label: "Integrity check failed",
      tone: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <XCircle className="w-7 h-7" />,
    },
    NOT_FOUND: {
      label: "No matching record",
      tone: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <XCircle className="w-7 h-7" />,
    },
  };

  const meta = result ? statusMeta[result.status] || statusMeta.NOT_FOUND : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-xs font-semibold mb-4">
          <ShieldCheck className="w-4 h-4" />
          <span>Voter Verification Page</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy">Verify a Ballot Receipt</h1>
        <p className="mt-3 text-sm text-navy-400 leading-relaxed">
          Enter the reference code from your voting receipt to confirm the ballot was recorded.
          Verification never reveals anyone&rsquo;s candidate choices.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="p-6 rounded-2xl bg-white border border-line shadow-sm mb-8">
        <form onSubmit={handleVerify} className="space-y-4">
          <label
            htmlFor="receipt-reference"
            className="block text-xs font-semibold uppercase tracking-wider text-navy-500"
          >
            Enter Verification Reference
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-300">
                <Hash className="w-4 h-4" />
              </div>
              <input
                id="receipt-reference"
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. SEAIT-SC-2026-8A3F9B2C"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-paper border border-line text-navy placeholder-navy-300 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:bg-white transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Verifying..." : "Verify Record"}</span>
            </button>
          </div>
          <p className="text-[11px] text-navy-400">
            The reference code is provided immediately after ballot submission and is also shown on
            your receipt in the Student Portal.
          </p>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3 mb-8"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Result Card */}
      {result && meta && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border shadow-sm ${
            result.verified ? "bg-white border-line" : "bg-white border-rose-200"
          }`}
          aria-live="polite"
        >
          <div className="flex items-start justify-between pb-6 border-b border-line gap-4 flex-wrap">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${meta.tone}`}>
                {meta.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">{meta.label}</h3>
                <p className="text-xs text-navy-400 mt-0.5 max-w-xl">{result.message}</p>
              </div>
            </div>
          </div>

          {result.status !== "NOT_FOUND" && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-paper border border-line">
                <span className="text-navy-400 block mb-1">Receipt Reference</span>
                <span className="font-mono text-navy-700 text-sm font-semibold">
                  {result.receiptReference}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-paper border border-line">
                <span className="text-navy-400 block mb-1">Election Title</span>
                <span className="text-navy-700 text-sm font-semibold">
                  {result.electionTitle}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-paper border border-line md:col-span-2">
                <span className="text-navy-400 block mb-1">Cryptographic Ballot Commitment Hash</span>
                <span className="font-mono text-brand-700 text-xs break-all">
                  {result.ballotCommitmentHash}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-paper border border-line md:col-span-2">
                <span className="text-navy-400 block mb-1">Blockchain Transaction Hash</span>
                <span className="font-mono text-leaf-700 text-xs break-all">
                  {result.blockchainTxHash ||
                    "No on-chain transaction recorded yet — blockchain confirmation pending."}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-paper border border-line">
                <span className="text-navy-400 block mb-1">Submission Timestamp</span>
                <span className="text-navy-600">
                  {result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "N/A"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-paper border border-line">
                <span className="text-navy-400 block mb-1">Ledger Status</span>
                <span className="inline-flex items-center space-x-1.5 text-navy-600 font-medium">
                  {result.status === "PENDING" ? (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-leaf-600" />
                  )}
                  <span>{result.blockchainStatus}</span>
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-line text-[11px] text-navy-400">
            Verification confirms that a ballot commitment was recorded for this reference. It does
            not reveal — and cannot be used to discover — anyone&rsquo;s candidate selections.
          </div>
        </div>
      )}
    </div>
  );
}
