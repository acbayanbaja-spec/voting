"use client";

import React, { useState } from "react";
import { fetchApi } from "../../lib/api";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Hash,
  AlertTriangle,
  ExternalLink,
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
      setError(err.message || "Failed to query receipt verification records.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-4">
          <ShieldCheck className="w-4 h-4" />
          <span>Independent Voter Verification Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          Verify Blockchain Ballot Receipt
        </h1>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          Confirm that your cast ballot is permanently and immutably recorded on the SEAIT election ledger without exposing your confidential candidate choices.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-8">
        <form onSubmit={handleVerify} className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Enter Verification Reference
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. SEAIT-SC-2026-8A3F9B2C"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-md shadow-brand-600/25"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Verifying..." : "Verify Record"}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Note: The reference code is provided immediately after ballot submission and can also be retrieved in the Student Portal.
          </p>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-3 mb-8">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Result Card */}
      {result && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border shadow-2xl transition-all ${
            result.verified
              ? "bg-slate-900 border-emerald-500/40"
              : "bg-slate-900 border-rose-500/40"
          }`}
        >
          <div className="flex items-start justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  result.verified
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {result.verified ? (
                  <CheckCircle2 className="w-7 h-7" />
                ) : (
                  <XCircle className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {result.verified ? "Ballot Verified on Ledger" : "Verification Failed"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{result.message}</p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                result.verified
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              {result.verified ? "CONFIRMED VALID" : "UNVERIFIED"}
            </span>
          </div>

          {result.verified && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block mb-1">Receipt Reference</span>
                <span className="font-mono text-slate-200 text-sm font-semibold">
                  {result.receiptReference}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block mb-1">Election Title</span>
                <span className="text-slate-200 text-sm font-semibold">
                  {result.electionTitle}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 md:col-span-2">
                <span className="text-slate-500 block mb-1">Cryptographic Ballot Commitment Hash</span>
                <span className="font-mono text-indigo-300 text-xs break-all">
                  {result.ballotCommitmentHash}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 md:col-span-2">
                <span className="text-slate-500 block mb-1">Blockchain Transaction Hash</span>
                <span className="font-mono text-emerald-400 text-xs break-all">
                  {result.blockchainTxHash || "Recorded in local ledger; awaiting block mine"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block mb-1">Submission Timestamp</span>
                <span className="text-slate-300">
                  {new Date(result.submittedAt).toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-500 block mb-1">Ledger Confirmation Status</span>
                <span className="inline-flex items-center space-x-1.5 text-emerald-400 font-medium">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{result.blockchainStatus}</span>
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Proof of recording under SEAIT COMELEC guidelines.</span>
            <span>Zero-Knowledge Ballot Integrity</span>
          </div>
        </div>
      )}
    </div>
  );
}
