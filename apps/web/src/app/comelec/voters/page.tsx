"use client";

import React, { useEffect, useState } from "react";
import { fetchApi, Election } from "../../../lib/api";
import {
  Users,
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
} from "lucide-react";

export default function ComelecVotersPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [voters, setVoters] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const sampleCsv = `schoolId,email,firstName,lastName,department,yearLevel
2024-00201,maria.clara@seait.edu.ph,Maria,Clara,College of Information and Communication Technology,1st Year
2024-00202,crisostomo.ibarra@seait.edu.ph,Crisostomo,Ibarra,College of Business Administration,2nd Year
2024-00203,elias.salome@seait.edu.ph,Elias,Salome,College of Criminology,3rd Year`;

  useEffect(() => {
    async function init() {
      try {
        const res = await fetchApi("/elections");
        if (res.success && res.data && res.data.length > 0) {
          setElections(res.data);
          setSelectedElectionId(res.data[0].id);
          loadVoters(res.data[0].id);
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const loadVoters = async (electionId: string, query?: string) => {
    try {
      setLoading(true);
      const url = `/voters/${electionId}${query ? `?search=${encodeURIComponent(query)}` : ""}`;
      const res = await fetchApi(url);
      if (res.success && res.data) {
        setVoters(res.data.voters);
      }
    } catch (err) {
      console.error("Failed to load voters:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleElectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedElectionId(id);
    loadVoters(id, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedElectionId) {
      loadVoters(selectedElectionId, search);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvContent.trim() || !selectedElectionId) return;

    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetchApi(`/voters/${selectedElectionId}/import-csv`, {
        method: "POST",
        body: JSON.stringify({ csvContent }),
      });

      if (res.success) {
        setImportResult(res.data);
        loadVoters(selectedElectionId);
      }
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!selectedElectionId) return;
    try {
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/voters/${selectedElectionId}/export-csv`,
        "_blank"
      );
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Voter Eligibility Roster</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage certified student voters, import authorized CSV rolls, and inspect participation status.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setCsvContent(sampleCsv);
              setShowImportModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-brand-600/20"
          >
            <Upload className="w-4 h-4" />
            <span>Import Voters CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Election:
          </label>
          <select
            value={selectedElectionId}
            onChange={handleElectionChange}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-brand-500"
          >
            {elections.map((el) => (
              <option key={el.id} value={el.id}>
                {el.title}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search School ID or Name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        </form>
      </div>

      {/* Voters Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">School ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Year Level</th>
                <th className="py-3 px-4">Voting Status</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Loading voters...
                  </td>
                </tr>
              ) : voters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No eligible voters found. Import a CSV file to register voters.
                  </td>
                </tr>
              ) : (
                voters.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {v.user.schoolId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {v.user.lastName}, {v.user.firstName}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{v.user.department}</td>
                    <td className="py-3 px-4 text-slate-400">{v.user.yearLevel}</td>
                    <td className="py-3 px-4">
                      {v.hasVoted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>BALLOT ACCEPTED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 w-max block">
                          NOT YET CAST
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {v.votedAt ? new Date(v.votedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Upload className="w-5 h-5 text-brand-400" />
              <span>Import Eligible Voter Roster (CSV)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Paste or edit comma-separated student records. Required columns: <code>schoolId, email, firstName, lastName, department, yearLevel</code>.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <textarea
                rows={8}
                required
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="schoolId,email,firstName,lastName,department,yearLevel..."
                className="w-full p-3 font-mono rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-brand-500"
              />

              {importResult && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <p className="font-semibold text-emerald-400">
                    Import Result: {importResult.importedCount} registered, {importResult.skippedCount} skipped.
                  </p>
                  {importResult.errors?.length > 0 && (
                    <div className="text-rose-400 text-[11px] max-h-24 overflow-y-auto">
                      {importResult.errors.map((err: any, i: number) => (
                        <p key={i}>Row {err.row}: {err.error}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center space-x-1.5"
                >
                  {importing ? <span>Importing...</span> : <span>Process & Register</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
