"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import { fetchApi, Election, Position, Candidate } from "../../../../../lib/api";
import {
  Vote,
  ShieldCheck,
  Check,
  AlertCircle,
  ArrowRight,
  User,
  FileText,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function BallotVotingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isStudent, isLoading } = useAuth();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/auth/login");
      return;
    }

    async function loadElection() {
      try {
        // Verify eligibility first
        const elig = await fetchApi(`/ballots/eligibility/${electionId}`);
        if (elig.success && elig.data) {
          if (!elig.data.isEligible) {
            setError("You are not registered as an eligible voter for this election.");
            setLoading(false);
            return;
          }
          if (elig.data.hasVoted) {
            router.push(`/student/receipts/${elig.data.receiptReference}`);
            return;
          }
        }

        const res = await fetchApi(`/elections/${electionId}`);
        if (res.success && res.data) {
          setElection(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load election ballot.");
      } finally {
        setLoading(false);
      }
    }

    if (user && isStudent) {
      loadElection();
    }
  }, [user, isStudent, isLoading, electionId, router]);

  // Handle Candidate Selection
  const toggleSelection = (positionId: string, candidateId: string, maxChoices: number) => {
    setSelections((prev) => {
      const current = prev[positionId] || [];
      if (current.includes(candidateId)) {
        // Deselect
        return {
          ...prev,
          [positionId]: current.filter((id) => id !== candidateId),
        };
      } else {
        if (maxChoices === 1) {
          // Replace selection
          return {
            ...prev,
            [positionId]: [candidateId],
          };
        } else {
          if (current.length < maxChoices) {
            return {
              ...prev,
              [positionId]: [...current, candidateId],
            };
          }
          return prev;
        }
      }
    });
  };

  // Validate Ballot before review modal
  const handleReview = () => {
    setError(null);
    if (!election || !election.positions) return;

    for (const pos of election.positions) {
      const selected = selections[pos.id] || [];
      if (pos.isRequired && selected.length === 0) {
        setError(`Please select a candidate for the required position: ${pos.title}.`);
        return;
      }
    }

    setShowReviewModal(true);
  };

  // Final Ballot Submission
  const handleFinalSubmit = async () => {
    if (!election) return;
    setSubmitting(true);
    setError(null);

    try {
      const flatSelections: Array<{ positionId: string; candidateId: string }> = [];
      Object.entries(selections).forEach(([posId, candIds]) => {
        candIds.forEach((candId) => {
          flatSelections.push({ positionId: posId, candidateId: candId });
        });
      });

      const res = await fetchApi("/ballots/cast", {
        method: "POST",
        body: JSON.stringify({
          electionId: election.id,
          selections: flatSelections,
        }),
      });

      if (res.success && res.data) {
        setShowReviewModal(false);
        router.push(`/student/receipts/${res.data.receiptReference}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit ballot. Please try again.");
      setShowReviewModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Preparing official digital ballot...</p>
      </div>
    );
  }

  if (error && !election) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">Ballot Inaccessible</h2>
          <p className="text-sm text-slate-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-xs font-semibold text-brand-400 font-mono">
                OFFICIAL DIGITAL BALLOT • A.Y. {election?.academicYear}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{election?.title}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{election?.description}</p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
            <Lock className="w-4 h-4" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-3 mb-8">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Positions and Candidate Cards */}
      <div className="space-y-12">
        {election?.positions?.map((position) => {
          const selectedForPos = selections[position.id] || [];

          return (
            <div key={position.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>{position.title}</span>
                    {position.isRequired && (
                      <span className="text-rose-400 text-xs font-semibold">*Required</span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{position.description}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                  Select {position.maxChoices === 1 ? "1 Candidate" : `up to ${position.maxChoices}`} (Selected: {selectedForPos.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {position.candidates.map((cand) => {
                  const isSelected = selectedForPos.includes(cand.id);

                  return (
                    <div
                      key={cand.id}
                      onClick={() =>
                        toggleSelection(position.id, cand.id, position.maxChoices)
                      }
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-brand-950/40 border-brand-500 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500"
                          : "bg-slate-900 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 relative border border-slate-700">
                            {cand.photoUrl ? (
                              <img
                                src={cand.photoUrl}
                                alt={cand.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <User className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-white">{cand.fullName}</h3>
                            <p className="text-xs text-brand-400 font-semibold mt-0.5">
                              {cand.partyList || "Independent"}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">ID: {cand.studentId}</p>
                          </div>
                        </div>

                        {/* Selection Checkbox */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-brand-600 text-white"
                              : "border border-slate-700 bg-slate-950"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 italic">
                        "{cand.platform}"
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Button Bar */}
      <div className="mt-12 sticky bottom-6 z-20">
        <div className="p-4 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur shadow-2xl flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            <span>Confirm all selections before reviewing final ballot.</span>
          </div>

          <button
            type="button"
            onClick={handleReview}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-600/25 flex items-center justify-center space-x-2"
          >
            <span>Review & Submit Ballot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review Modal Dialog */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto mb-3 border border-brand-500/20">
                <Vote className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Review Your Ballot Selections</h3>
              <p className="text-xs text-slate-400 mt-1">
                Please verify your choices below before generating your immutable blockchain commitment.
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {election?.positions?.map((pos) => {
                const candIds = selections[pos.id] || [];
                const chosenCandidates = pos.candidates.filter((c) => candIds.includes(c.id));

                return (
                  <div key={pos.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold block mb-1">{pos.title}:</span>
                    {chosenCandidates.length > 0 ? (
                      chosenCandidates.map((c) => (
                        <div key={c.id} className="font-bold text-white">
                          • {c.fullName} ({c.partyList || "Independent"})
                        </div>
                      ))
                    ) : (
                      <span className="text-amber-400 italic">Abstained / No selection</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Permanent Submission Notice:</strong> Once confirmed, your ballot choices are sealed on the immutable ledger. You cannot modify or re-submit your vote.
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20"
              >
                {submitting ? <span>Committing Vote...</span> : <span>Confirm & Submit</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
