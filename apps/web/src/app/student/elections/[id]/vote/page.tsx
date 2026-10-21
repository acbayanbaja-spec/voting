"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import { fetchApi, Election, Position, Candidate } from "../../../../../lib/api";
import {
  Vote,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  AlertTriangle,
  Lock,
  ClipboardCheck,
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
  const [modalError, setModalError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

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
            setError(
              elig.data.status === "PENDING"
                ? "Your registration is awaiting COMELEC approval. You can cast your ballot as soon as an election officer verifies you against the voter roster."
                : elig.data.status === "REJECTED"
                  ? "COMELEC declined your registration for this election. Please contact the COMELEC committee for clarification."
                  : "You are not registered as an eligible voter for this election."
            );
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

  // Focus the confirm control when the review dialog opens
  useEffect(() => {
    if (showReviewModal) {
      setModalError(null);
      confirmButtonRef.current?.focus();
    }
  }, [showReviewModal]);

  // Handle Candidate Selection
  const toggleSelection = (positionId: string, candidateId: string, maxChoices: number) => {
    if (submitting) return;
    setSelections((prev) => {
      const current = prev[positionId] || [];
      if (current.includes(candidateId)) {
        return {
          ...prev,
          [positionId]: current.filter((id) => id !== candidateId),
        };
      } else {
        if (maxChoices === 1) {
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

  const handleCandidateKeyDown = (
    e: React.KeyboardEvent,
    positionId: string,
    candidateId: string,
    maxChoices: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSelection(positionId, candidateId, maxChoices);
    }
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

  const closeReviewModal = () => {
    if (submitting) return; // Do not abandon an in-flight submission
    setShowReviewModal(false);
    setModalError(null);
  };

  // Final Ballot Submission — triggered only by the explicit Confirm & Submit button
  const handleFinalSubmit = async () => {
    if (!election || submitting) return;
    setSubmitting(true);
    setModalError(null);

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
        // The server has durably accepted the ballot — redirect to the receipt.
        setShowReviewModal(false);
        router.push(`/student/receipts/${res.data.receiptReference}?celebrate=1`);
      } else {
        setModalError("The server did not confirm your ballot. Please try again.");
      }
    } catch (err: any) {
      if (err?.status === 409 || err?.code === "DUPLICATE_VOTE_ATTEMPT" || err?.code === "CONCURRENT_VOTE_COLLISION") {
        // A ballot was already accepted for this account. The database is the
        // authority: look up the recorded receipt instead of allowing a retry.
        try {
          const elig = await fetchApi(`/ballots/eligibility/${electionId}`);
          if (elig.success && elig.data?.hasVoted && elig.data.receiptReference) {
            setShowReviewModal(false);
            router.push(`/student/receipts/${elig.data.receiptReference}`);
            return;
          }
        } catch {
          // Fall through to the generic duplicate message
        }
        setModalError(
          "A ballot has already been recorded for your account in this election. Open My Elections to view your receipt."
        );
        return;
      }

      if (err instanceof TypeError || /failed to fetch|network/i.test(err?.message || "")) {
        // Network failure: the outcome is uncertain. The server may or may not
        // have accepted the ballot — check My Elections before submitting again.
        setModalError(
          "The connection was interrupted, so we could not confirm whether your ballot was recorded. Do not submit again — open My Elections to check your status first."
        );
        return;
      }

      setModalError(err.message || "Failed to submit ballot. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-navy-400 text-sm">Preparing official digital ballot...</p>
      </div>
    );
  }

  if (error && !election) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-2xl bg-white border border-line shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy">Ballot Inaccessible</h2>
          <p className="text-sm text-navy-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const votingWindowEnd = election?.endTime ? new Date(election.endTime).toLocaleString() : "";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Progress Indicator */}
      <ol className="flex items-center justify-center gap-2 sm:gap-4 mb-8 text-[11px] sm:text-xs font-semibold">
        {["Sign In", "Select Candidates", "Review Ballot", "Confirmation"].map((step, i) => (
          <li key={step} className="flex items-center gap-2 sm:gap-4">
            <span
              className={`flex items-center space-x-1.5 ${
                i <= (showReviewModal ? 2 : 1) ? "text-brand-600" : "text-navy-300"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  i <= (showReviewModal ? 2 : 1)
                    ? "bg-brand-600 border-brand-600 text-white"
                    : "bg-white border-line text-navy-300"
                }`}
              >
                {i === 0 ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </span>
            {i < 3 && <span className="w-6 sm:w-10 h-px bg-line-strong" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-line shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5 flex-wrap">
              <span className="text-xs font-semibold text-brand-600">
                Official Digital Ballot • A.Y. {election?.academicYear}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-leaf-50 text-leaf-700 border border-leaf-200">
                OPEN
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-navy">{election?.title}</h1>
            <p className="text-sm text-navy-400 mt-1.5 max-w-2xl leading-relaxed">{election?.description}</p>
            {votingWindowEnd && (
              <p className="text-xs text-navy-400 mt-1">Voting closes: {votingWindowEnd}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-navy-500 font-medium bg-paper px-3.5 py-2 rounded-xl border border-line">
            <Lock className="w-4 h-4 text-brand-600" />
            <span>Selections stay private</span>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3 mb-8"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Positions and Candidate Cards */}
      <div className="space-y-10">
        {election?.positions?.map((position) => {
          const selectedForPos = selections[position.id] || [];

          return (
            <section key={position.id} className="space-y-4" aria-label={position.title}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-navy flex items-center space-x-2 flex-wrap">
                    <span>{position.title}</span>
                    {position.isRequired && (
                      <span className="text-amber-600 text-xs font-semibold">Required</span>
                    )}
                  </h2>
                  <p className="text-xs text-navy-400 mt-0.5">{position.description}</p>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full bg-paper text-navy-500 font-medium border border-line w-fit"
                  aria-live="polite"
                >
                  Select {position.maxChoices === 1 ? "1 candidate" : `up to ${position.maxChoices}`} •{" "}
                  {selectedForPos.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {position.candidates.map((cand) => {
                  const isSelected = selectedForPos.includes(cand.id);

                  return (
                    <div
                      key={cand.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`Select ${cand.fullName}${cand.partyList ? `, ${cand.partyList}` : ""} for ${position.title}`}
                      onClick={() => toggleSelection(position.id, cand.id, position.maxChoices)}
                      onKeyDown={(e) =>
                        handleCandidateKeyDown(e, position.id, cand.id, position.maxChoices)
                      }
                      className={`p-5 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                        isSelected
                          ? "bg-brand-50 border-brand-600 ring-1 ring-brand-600"
                          : "bg-white border-line hover:border-brand-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 rounded-xl bg-paper overflow-hidden flex-shrink-0 relative border border-line">
                            {cand.photoUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={cand.photoUrl}
                                alt={cand.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-navy-300">
                                <User className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-navy">{cand.fullName}</h3>
                            <p className="text-xs text-brand-600 font-semibold mt-0.5">
                              {cand.partyList || "Independent"}
                            </p>
                            <p className="text-[11px] text-navy-400">ID: {cand.studentId}</p>
                          </div>
                        </div>

                        {/* Selection Checkbox */}
                        <div
                          aria-hidden="true"
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected
                              ? "bg-brand-600 text-white"
                              : "border border-line-strong bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-line text-xs text-navy-500 leading-relaxed">
                        {cand.platform}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Review Button Bar */}
      <div className="mt-12 sticky bottom-6 z-20">
        <div className="p-4 rounded-2xl bg-white border border-line shadow-lg flex items-center justify-between gap-4">
          <div className="text-xs text-navy-400 hidden sm:block">
            <span>Check every position carefully before reviewing your final ballot.</span>
          </div>

          <button
            type="button"
            onClick={handleReview}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Review &amp; Submit Ballot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Review Modal Dialog */}
      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeReviewModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
            className="max-w-lg w-full bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 border border-brand-100">
                <Vote className="w-6 h-6" />
              </div>
              <h3 id="review-dialog-title" className="text-xl font-bold text-navy">
                Review Your Ballot Selections
              </h3>
              <p className="text-xs text-navy-400 mt-1.5">
                Please verify your choices below before final submission.
              </p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {election?.positions?.map((pos) => {
                const candIds = selections[pos.id] || [];
                const chosenCandidates = pos.candidates.filter((c) => candIds.includes(c.id));

                return (
                  <div key={pos.id} className="p-3 rounded-xl bg-paper border border-line text-xs">
                    <span className="text-navy-400 font-semibold block mb-1">{pos.title}:</span>
                    {chosenCandidates.length > 0 ? (
                      chosenCandidates.map((c) => (
                        <div key={c.id} className="font-bold text-navy">
                          • {c.fullName} ({c.partyList || "Independent"})
                        </div>
                      ))
                    ) : (
                      <span className="text-amber-600">Abstained / No selection</span>
                    )}
                  </div>
                );
              })}
            </div>

            {modalError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Final submission:</strong> once you confirm, your ballot is sealed and
                recorded. You cannot modify or re-submit your vote.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={closeReviewModal}
                className="flex-1 py-3 rounded-xl bg-paper hover:bg-paper-dark border border-line text-navy-600 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Edit</span>
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-3 rounded-xl bg-leaf-600 hover:bg-leaf-700 focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:ring-offset-2 disabled:opacity-60 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Recording ballot…</span>
                  </>
                ) : (
                  <span>Confirm &amp; Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
