"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "../../../../lib/api";
import {
  BarChart3,
  Award,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from "lucide-react";

export default function ComelecTallyPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [tally, setTally] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTally = async () => {
    try {
      const res = await fetchApi(`/results/${electionId}`);
      if (res.success && res.data) {
        setTally(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load election tally.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTally();
  }, [electionId]);

  const handlePublish = async () => {
    if (
      !confirm(
        "Are you sure you want to certify and publish these election results? This action will seal the results commitment on the blockchain and make them publicly accessible to all students."
      )
    ) {
      return;
    }

    setPublishing(true);
    try {
      const res = await fetchApi(`/results/${electionId}/publish`, {
        method: "POST",
      });

      if (res.success) {
        alert("Official election results certified and published successfully!");
        loadTally();
      }
    } catch (err: any) {
      alert(`Publication error: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Computing and reconciling tally...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Audit & Finalization
            </span>
            <span className="text-xs text-slate-500 font-mono">Status: {tally?.status}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Tally Reconciliation & Publication
          </h1>
          <p className="text-xs text-slate-400">{tally?.electionTitle}</p>
        </div>

        <div className="flex items-center space-x-3">
          {tally?.status !== "PUBLISHED" ? (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{publishing ? "Publishing on Chain..." : "Certify & Publish Results"}</span>
            </button>
          ) : (
            <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>OFFICIALLY PUBLISHED</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Total Registered</span>
          <p className="text-2xl font-extrabold text-white mt-1">{tally?.totalEligibleVoters}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Ballots Accepted</span>
          <p className="text-2xl font-extrabold text-brand-400 mt-1">{tally?.totalBallotsAccepted}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Turnout Rate</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{tally?.turnoutPercentage}%</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400">Positions Audited</span>
          <p className="text-2xl font-extrabold text-indigo-400 mt-1">{tally?.positions?.length || 0}</p>
        </div>
      </div>

      {/* Commitment Hash Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-brand-400" />
          <span className="text-slate-400">Results Commitment Hash:</span>
          <span className="font-mono text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {tally?.resultCommitmentHash}
          </span>
        </div>
        <span className="text-slate-500 text-[11px]">Derived via SHA-256 canonical tally encoding</span>
      </div>

      {/* Positions Breakdown */}
      <div className="space-y-8">
        {tally?.positions?.map((pos: any) => (
          <div key={pos.positionId} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>{pos.title}</span>
                {pos.isTie && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    TIE DETECTED
                  </span>
                )}
              </h3>
              <span className="text-xs text-slate-400">
                Votes: {pos.totalVotesCastInPosition} • Undervotes: {pos.undervoteCount}
              </span>
            </div>

            <div className="space-y-3">
              {pos.candidates.map((cand: any) => (
                <div
                  key={cand.candidateId}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                    cand.isWinner
                      ? "bg-slate-950 border-emerald-500/40"
                      : "bg-slate-950/40 border-slate-800"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                      #{cand.rank}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{cand.fullName}</span>
                        {cand.isWinner && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            WINNER
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{cand.partyList || "Independent"}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-white">{cand.voteCount} votes</span>
                    <span className="text-slate-400 text-[11px] block">{cand.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
