"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi, Election, Position, Candidate } from "../../../../../lib/api";
import {
  ArrowLeft,
  ListChecks,
  Pencil,
  Plus,
  PlusCircle,
  Trash2,
  Users,
  AlertCircle,
  Lock,
  Unlock,
  Calendar,
} from "lucide-react";

const FROZEN_STATUSES = ["PUBLISHED", "CANCELLED"];

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block font-semibold text-navy-500 mb-1";

interface PositionForm {
  id?: string;
  title: string;
  description: string;
  orderIndex: number;
  maxChoices: number;
  isRequired: boolean;
}

interface CandidateForm {
  id?: string;
  positionId: string;
  fullName: string;
  studentId: string;
  partyList: string;
  platform: string;
  photoUrl: string;
}

export default function ComelecBallotSetupPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const [positionForm, setPositionForm] = useState<PositionForm | null>(null);
  const [candidateForm, setCandidateForm] = useState<CandidateForm | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedule, setSchedule] = useState({ startTime: "", endTime: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetchApi(`/elections/${electionId}`);
      if (res.success && res.data) {
        setElection(res.data);
        setDenied(false);
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) setDenied(true);
      setNotice(err.message || "Failed to load the ballot.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    load();
  }, [load]);

  const ballotsCast = election?._count?.ballotSubmissions ?? 0;
  const editable =
    !!election && !FROZEN_STATUSES.includes(election.status) && ballotsCast === 0;

  const runMutation = async (
    lockId: string,
    url: string,
    method: string,
    body: object,
    successText: string
  ) => {
    setBusy(lockId);
    setNotice(null);
    try {
      await fetchApi(url, { method, body: JSON.stringify(body) });
      setNotice(successText);
      await load();
      return true;
    } catch (err: any) {
      setNotice(err.message || "The change could not be saved.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const submitPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionForm) return;
    const payload = {
      title: positionForm.title.trim(),
      description: positionForm.description.trim() || undefined,
      orderIndex: Number(positionForm.orderIndex),
      maxChoices: Number(positionForm.maxChoices),
      isRequired: positionForm.isRequired,
    };
    const url = positionForm.id
      ? `/elections/${electionId}/positions/${positionForm.id}`
      : `/elections/${electionId}/positions`;
    const ok = await runMutation(
      "position",
      url,
      positionForm.id ? "PATCH" : "POST",
      payload,
      positionForm.id ? "Position updated." : "Position added to the ballot."
    );
    if (ok) setPositionForm(null);
  };

  const submitCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForm) return;
    const payload: Record<string, unknown> = {
      positionId: candidateForm.positionId,
      fullName: candidateForm.fullName.trim(),
      studentId: candidateForm.studentId.trim(),
      platform: candidateForm.platform.trim(),
      // Always sent: an empty value is how the officer clears these fields
      partyList: candidateForm.partyList.trim(),
      photoUrl: candidateForm.photoUrl.trim(),
    };
    const url = candidateForm.id
      ? `/elections/${electionId}/candidates/${candidateForm.id}`
      : `/elections/${electionId}/candidates`;
    const ok = await runMutation(
      "candidate",
      url,
      candidateForm.id ? "PATCH" : "POST",
      payload,
      candidateForm.id ? "Candidate updated." : "Candidate added to the ballot."
    );
    if (ok) setCandidateForm(null);
  };

  const removePosition = async (position: Position) => {
    if (
      !window.confirm(
        `Remove "${position.title}" and its ${position.candidates.length} candidate(s) from this ballot?`
      )
    )
      return;
    await runMutation(
      position.id,
      `/elections/${electionId}/positions/${position.id}`,
      "DELETE",
      {},
      `Position "${position.title}" removed.`
    );
  };

  const removeCandidate = async (candidate: Candidate) => {
    if (!window.confirm(`Remove candidate ${candidate.fullName}?`)) return;
    await runMutation(
      candidate.id,
      `/elections/${electionId}/candidates/${candidate.id}`,
      "DELETE",
      {},
      `${candidate.fullName} removed from the ballot.`
    );
  };

  const submitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await runMutation(
      "schedule",
      `/elections/${electionId}`,
      "PUT",
      {
        startTime: new Date(schedule.startTime).toISOString(),
        endTime: new Date(schedule.endTime).toISOString(),
      },
      "Voting window updated."
    );
    if (ok) setShowScheduleModal(false);
  };

  const openScheduleModal = () => {
    if (!election) return;
    setSchedule({
      startTime: new Date(election.startTime).toISOString().substring(0, 16),
      endTime: new Date(election.endTime).toISOString().substring(0, 16),
    });
    setShowScheduleModal(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
        <div className="h-24 rounded-2xl bg-white animate-pulse border border-line" />
        <div className="h-64 rounded-2xl bg-white animate-pulse border border-line" />
      </div>
    );
  }

  if (denied || !election) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="p-6 rounded-2xl bg-white border border-line">
          <h1 className="text-xl font-bold text-navy flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>COMELEC access required</span>
          </h1>
          <p className="text-xs text-navy-400 mt-2">
            {notice ||
              "Ballot setup is limited to signed-in COMELEC officers and administrators."}
          </p>
          <a
            href="/auth/login"
            className="inline-block mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const positions = (election.positions || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  const candidateTotal = positions.reduce((sum, p) => sum + p.candidates.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={() => router.push("/comelec/elections")}
        className="text-xs text-navy-400 hover:text-brand-600 flex items-center space-x-1.5 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg px-1 py-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to elections</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
            <span className="font-mono text-xs font-semibold text-brand-600">
              A.Y. {election.academicYear} • {election.semester}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-paper text-navy-500 font-bold border border-line">
              {election.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
            Ballot Setup
          </h1>
          <p className="text-xs text-navy-400 mt-1 max-w-2xl">{election.title}</p>
          <p className="text-[11px] text-navy-400 mt-2 font-mono">
            {positions.length} {positions.length === 1 ? "position" : "positions"} •{" "}
            {candidateTotal} {candidateTotal === 1 ? "candidate" : "candidates"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openScheduleModal}
            disabled={busy === "schedule"}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-paper text-navy-600 border border-line hover:border-brand-300 text-xs font-semibold flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </button>
          <button
            onClick={() =>
              setPositionForm({
                title: "",
                description: "",
                orderIndex: positions.length + 1,
                maxChoices: 1,
                isRequired: true,
              })
            }
            disabled={!editable || busy !== null}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Position</span>
          </button>
        </div>
      </div>

      <div
        className={`p-4 rounded-xl border text-xs flex items-center space-x-2 mb-6 ${
          editable
            ? "bg-leaf-50 border-leaf-200 text-leaf-700"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}
      >
        {editable ? (
          <>
            <Unlock className="w-4 h-4 flex-shrink-0" />
            <span>
              The ballot stays editable until the first vote is recorded, so you can still add,
              rename or remove positions and candidates. Polls open only once every position has at
              least one candidate.
            </span>
          </>
        ) : ballotsCast > 0 ? (
          <>
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>
              Ballot frozen: {ballotsCast} ballot{ballotsCast === 1 ? " has" : "s have"} already been
              cast in this election. Changing it now would break recorded votes, so positions and
              candidates can no longer be edited.
            </span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>
              Ballot frozen because this election is {election.status}. No ballot was ever cast
              here, so create a new election to run a fresh poll.
            </span>
          </>
        )}
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-paper border border-line text-navy-600 text-xs flex items-center space-x-2 mb-6">
          <ListChecks className="w-4 h-4 flex-shrink-0 text-brand-600" />
          <span>{notice}</span>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-dashed border-line text-center">
          <ListChecks className="w-8 h-8 text-navy-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-navy">No positions on this ballot yet</h3>
          <p className="text-xs text-navy-400 mt-1">
            Add the positions students will vote for, then attach candidates to each one.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {positions.map((position) => (
            <div
              key={position.id}
              className="rounded-2xl bg-white border border-line shadow-sm overflow-hidden"
            >
              <div className="p-5 border-b border-line flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-mono text-[11px] text-navy-400">
                      #{position.orderIndex}
                    </span>
                    <h3 className="text-lg font-bold text-navy">{position.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-paper text-navy-500 border border-line">
                      {position.maxChoices === 1 ? "Single choice" : `Up to ${position.maxChoices}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        position.isRequired
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-paper text-navy-500 border-line"
                      }`}
                    >
                      {position.isRequired ? "Required" : "Optional"}
                    </span>
                  </div>
                  {position.description && (
                    <p className="text-xs text-navy-400 mt-1 max-w-2xl">{position.description}</p>
                  )}
                </div>

                {editable && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setPositionForm({
                          id: position.id,
                          title: position.title,
                          description: position.description || "",
                          orderIndex: position.orderIndex,
                          maxChoices: position.maxChoices,
                          isRequired: position.isRequired,
                        })
                      }
                      disabled={busy !== null}
                      className="px-2.5 py-1 rounded-lg bg-paper hover:bg-brand-50 text-navy-600 border border-line text-[10px] font-bold flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() =>
                        setCandidateForm({
                          positionId: position.id,
                          fullName: "",
                          studentId: "",
                          partyList: "",
                          platform: "",
                          photoUrl: "",
                        })
                      }
                      disabled={busy !== null}
                      className="px-2.5 py-1 rounded-lg bg-leaf-600 hover:bg-leaf-700 text-white text-[10px] font-bold flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-leaf-500 disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Candidate</span>
                    </button>
                    <button
                      onClick={() => removePosition(position)}
                      disabled={busy !== null}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-line hover:border-rose-200 text-[10px] font-bold flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {position.candidates.length === 0 ? (
                <div className="p-6 text-xs text-amber-800 bg-amber-50 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    This position has no candidates yet — polls cannot open until at least one is
                    added.
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-navy-500">
                    <thead className="bg-paper text-navy-400 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Candidate</th>
                        <th className="py-3 px-4 font-semibold">Student ID</th>
                        <th className="py-3 px-4 font-semibold">Party</th>
                        <th className="py-3 px-4 font-semibold">Platform</th>
                        {editable && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {position.candidates.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-paper">
                          <td className="py-3 px-4 font-semibold text-navy">{candidate.fullName}</td>
                          <td className="py-3 px-4 font-mono">{candidate.studentId}</td>
                          <td className="py-3 px-4">{candidate.partyList || "—"}</td>
                          <td className="py-3 px-4 max-w-md">
                            <span className="line-clamp-2">{candidate.platform}</span>
                          </td>
                          {editable && (
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setCandidateForm({
                                      id: candidate.id,
                                      positionId: candidate.positionId,
                                      fullName: candidate.fullName,
                                      studentId: candidate.studentId,
                                      partyList: candidate.partyList || "",
                                      platform: candidate.platform,
                                      photoUrl: candidate.photoUrl || "",
                                    })
                                  }
                                  disabled={busy !== null}
                                  className="px-2.5 py-1 rounded-lg bg-paper hover:bg-brand-50 text-navy-600 border border-line text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => removeCandidate(candidate)}
                                  disabled={busy !== null}
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-line hover:border-rose-200 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          <div className="p-5 rounded-2xl bg-white border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-navy-400">
              <Users className="w-4 h-4 text-brand-600" />
              <span>
                Voters will see exactly these positions in this order when they open the ballot.
              </span>
            </div>
            <a
              href="/comelec/elections"
              className="px-3.5 py-2 rounded-xl bg-paper hover:bg-brand-50 text-navy-600 border border-line text-xs font-semibold text-center"
            >
              Manage polling window
            </a>
          </div>
        </div>
      )}

      {positionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50">
          <div className="max-w-lg w-full bg-white border border-line rounded-3xl p-6 sm:p-8 shadow space-y-4">
            <h3 className="text-xl font-bold text-navy">
              {positionForm.id ? "Edit position" : "Add position"}
            </h3>
            <form onSubmit={submitPosition} className="space-y-4 text-xs">
              <div>
                <label className={labelClass}>Position title</label>
                <input
                  type="text"
                  required
                  value={positionForm.title}
                  onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })}
                  placeholder="e.g. President"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description (optional)</label>
                <input
                  type="text"
                  value={positionForm.description}
                  onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                  placeholder="Role scope or responsibilities"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Order</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={positionForm.orderIndex}
                    onChange={(e) =>
                      setPositionForm({ ...positionForm, orderIndex: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max choices</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={positionForm.maxChoices}
                    onChange={(e) =>
                      setPositionForm({ ...positionForm, maxChoices: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Required</label>
                  <select
                    value={positionForm.isRequired ? "yes" : "no"}
                    onChange={(e) =>
                      setPositionForm({ ...positionForm, isRequired: e.target.value === "yes" })
                    }
                    className={inputClass}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPositionForm(null)}
                  className="flex-1 py-2.5 rounded-xl bg-paper hover:bg-brand-50 text-navy-600 border border-line font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
                >
                  {busy === "position" ? "Saving..." : "Save position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {candidateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50">
          <div className="max-w-lg w-full bg-white border border-line rounded-3xl p-6 sm:p-8 shadow space-y-4">
            <h3 className="text-xl font-bold text-navy">
              {candidateForm.id ? "Edit candidate" : "Add candidate"}
            </h3>
            <p className="text-[11px] text-navy-400 -mt-2">
              For:{" "}
              {positions.find((p) => p.id === candidateForm.positionId)?.title || "selected position"}
            </p>
            <form onSubmit={submitCandidate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Full name</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.fullName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, fullName: e.target.value })}
                    placeholder="Juan Dela Cruz"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Student ID</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.studentId}
                    onChange={(e) => setCandidateForm({ ...candidateForm, studentId: e.target.value })}
                    placeholder="2024-00001"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Party list (optional)</label>
                <input
                  type="text"
                  value={candidateForm.partyList}
                  onChange={(e) => setCandidateForm({ ...candidateForm, partyList: e.target.value })}
                  placeholder="e.g. Lakas SEAIT Coalition"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Platform</label>
                <textarea
                  required
                  rows={3}
                  value={candidateForm.platform}
                  onChange={(e) => setCandidateForm({ ...candidateForm, platform: e.target.value })}
                  placeholder="Key promises and priorities..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Photo URL (optional)</label>
                <input
                  type="url"
                  value={candidateForm.photoUrl}
                  onChange={(e) => setCandidateForm({ ...candidateForm, photoUrl: e.target.value })}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              {positions.length > 1 && (
                <div>
                  <label className={labelClass}>Position</label>
                  <select
                    value={candidateForm.positionId}
                    onChange={(e) => setCandidateForm({ ...candidateForm, positionId: e.target.value })}
                    className={inputClass}
                  >
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCandidateForm(null)}
                  className="flex-1 py-2.5 rounded-xl bg-paper hover:bg-brand-50 text-navy-600 border border-line font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
                >
                  {busy === "candidate" ? "Saving..." : "Save candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50">
          <div className="max-w-lg w-full bg-white border border-line rounded-3xl p-6 sm:p-8 shadow space-y-4">
            <h3 className="text-xl font-bold text-navy">Voting window</h3>
            <form onSubmit={submitSchedule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Opens</label>
                  <input
                    type="datetime-local"
                    required
                    value={schedule.startTime}
                    onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Closes</label>
                  <input
                    type="datetime-local"
                    required
                    value={schedule.endTime}
                    onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-[11px] text-navy-400">
                Voters can only cast ballots inside this window. Closing must happen after the end
                time for the tally to be final.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-paper hover:bg-brand-50 text-navy-600 border border-line font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
                >
                  {busy === "schedule" ? "Saving..." : "Save window"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
