"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "../../../lib/api";
import {
  BarChart3,
  Award,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Users,
  Vote,
  AlertCircle,
  Hash,
} from "lucide-react";

export default function ElectionResultsPage() {
  const params = useParams();
  const electionId = params.id as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const res = await fetchApi(`/results/${electionId}`);
        if (res.success && res.data) {
          setReport(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load election results.");
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [electionId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-navy-400 text-sm">Computing and verifying official tally...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-white border border-line shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy">Results Pending Publication</h2>
          <p className="text-sm text-navy-400 mt-2">
            {error || "Official election results have not yet been certified and published by COMELEC."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-white border border-line shadow-sm mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold mb-3">
              <Award className="w-4 h-4" />
              <span>Official Certified Results Snapshot</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
              {report.electionTitle}
            </h1>
            <p className="text-xs sm:text-sm text-navy-400 mt-2">
              Published on {report.publishedAt ? new Date(report.publishedAt).toLocaleString() : "Official Certification"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-paper border border-line">
              <span className="text-[11px] text-navy-400 block">Eligible Voters</span>
              <span className="text-lg font-bold text-navy">{report.totalEligibleVoters}</span>
            </div>
            <div className="p-3 rounded-xl bg-paper border border-line">
              <span className="text-[11px] text-navy-400 block">Ballots Cast</span>
              <span className="text-lg font-bold text-brand-600">{report.totalBallotsAccepted}</span>
            </div>
            <div className="p-3 rounded-xl bg-paper border border-line">
              <span className="text-[11px] text-navy-400 block">Turnout</span>
              <span className="text-lg font-bold text-leaf-600">{report.turnoutPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Proof Card */}
        <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2 text-navy-500">
            <Cpu className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <span>Results Ledger Commitment Hash:</span>
            <span className="font-mono text-brand-700 bg-paper px-2 py-0.5 rounded border border-line text-[11px]">
              {report.resultCommitmentHash}
            </span>
          </div>
          <span className="text-leaf-600 flex items-center space-x-1 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Sealed &amp; Verifiable</span>
          </span>
        </div>
      </div>

      {/* Results Per Position */}
      <div className="space-y-10">
        {report.positions.map((pos: any) => (
          <div key={pos.positionId} className="p-6 sm:p-8 rounded-2xl bg-white border border-line shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-line">
              <div>
                <h3 className="text-xl font-bold text-navy flex items-center space-x-2">
                  <span>{pos.title}</span>
                  {pos.isTie && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      TIE DETECTED
                    </span>
                  )}
                </h3>
                <p className="text-xs text-navy-400 mt-1">
                  Total Votes Cast: {pos.totalVotesCastInPosition} • Undervotes/Abstentions: {pos.undervoteCount}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {pos.candidates.map((cand: any) => (
                <div
                  key={cand.candidateId}
                  className={`p-4 rounded-xl border transition-colors ${
                    cand.isWinner
                      ? "bg-leaf-50 border-leaf-200"
                      : "bg-paper border-line"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs text-navy-500 border border-line">
                        #{cand.rank}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-navy text-sm">{cand.fullName}</span>
                          {cand.isWinner && (
                            <span className="px-2 py-0.5 rounded bg-leaf-50 text-leaf-700 border border-leaf-200 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                              <Award className="w-3 h-3" />
                              <span>PROCLAIMED WINNER</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-navy-400">{cand.partyList || "Independent"}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-navy">
                        {cand.voteCount} {cand.voteCount === 1 ? "vote" : "votes"}
                      </span>
                      <span className="text-xs text-navy-400 block">{cand.percentage}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-line rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ${
                        cand.isWinner ? "bg-leaf-600" : "bg-brand-600"
                      }`}
                      style={{ width: `${cand.percentage}%` }}
                    />
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
