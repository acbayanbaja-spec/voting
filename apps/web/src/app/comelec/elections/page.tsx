"use client";

import React, { useEffect, useState } from "react";
import { fetchApi, Election } from "../../../lib/api";
import {
  Vote,
  PlusCircle,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export default function ComelecElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New election form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [semester, setSemester] = useState("1st Semester");
  const [startTime, setStartTime] = useState(new Date().toISOString().substring(0, 16));
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16)
  );

  const loadElections = async () => {
    try {
      const res = await fetchApi("/elections");
      if (res.success && res.data) {
        setElections(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load elections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElections();
  }, []);

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetchApi("/elections", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          academicYear,
          semester,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      if (res.success) {
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        loadElections();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create election.");
    }
  };

  const handleTransitionStatus = async (electionId: string, newStatus: string) => {
    try {
      const res = await fetchApi(`/elections/${electionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        loadElections();
      }
    } catch (err: any) {
      alert(`Status transition error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Election Lifecycle Management</h1>
          <p className="text-xs text-navy-400 mt-1">
            Configure elections, manage voting windows, and control authoritative status transitions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Election</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white animate-pulse border border-line" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {elections.map((el) => (
            <div
              key={el.id}
              className="p-6 rounded-2xl bg-white border border-line shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-brand-600">
                      A.Y. {el.academicYear} • {el.semester}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-paper text-navy-500 font-bold border border-line">
                      {el.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-navy">{el.title}</h2>
                  <p className="text-xs text-navy-400 mt-1 max-w-3xl">{el.description}</p>
                </div>

                {/* Status Transitions */}
                <div className="flex flex-wrap items-center gap-2">
                  {el.status === "DRAFT" && (
                    <button
                      onClick={() => handleTransitionStatus(el.id, "OPEN")}
                      className="px-3.5 py-1.5 rounded-lg bg-leaf-600 hover:bg-leaf-700 focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors"
                    >
                      Open Polls
                    </button>
                  )}
                  {el.status === "OPEN" && (
                    <button
                      onClick={() => handleTransitionStatus(el.id, "CLOSED")}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors"
                    >
                      Close Polls
                    </button>
                  )}
                  {el.status === "CLOSED" && (
                    <button
                      onClick={() => handleTransitionStatus(el.id, "UNDER_REVIEW")}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors"
                    >
                      Move to Review
                    </button>
                  )}
                  {el.status === "UNDER_REVIEW" && (
                    <a
                      href={`/comelec/tally/${el.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-leaf-600 hover:bg-leaf-700 focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors"
                    >
                      Review & Publish
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between text-xs text-navy-400 gap-4">
                <div className="flex items-center space-x-4">
                  <span>Start: {new Date(el.startTime).toLocaleString()}</span>
                  <span>End: {new Date(el.endTime).toLocaleString()}</span>
                </div>
                {el._count && (
                  <div className="font-mono text-navy-400">
                    {el._count.positions} Positions • {el._count.candidates} Candidates • {el._count.ballotSubmissions} Votes
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Election Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/50">
          <div className="max-w-lg w-full bg-white border border-line rounded-3xl p-6 sm:p-8 shadow space-y-4">
            <h3 className="text-xl font-bold text-navy">Create New Election</h3>
            <form onSubmit={handleCreateElection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy-500 mb-1">Election Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SEAIT Supreme Student Council General Election 2026-2027"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-500 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding eligible voters, positions, and election rules..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-navy-500 mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-navy-500 mb-1">Semester</label>
                  <input
                    type="text"
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy placeholder-navy-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-navy-500 mb-1">Voting Starts</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-navy-500 mb-1">Voting Closes</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-line text-navy text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-paper hover:bg-brand-50 text-navy-600 border border-line hover:border-brand-300 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Save Election
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
