"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi, Election } from "../../lib/api";
import { Vote, Calendar, Clock, ArrowRight, BarChart3, CheckCircle2 } from "lucide-react";

export default function ElectionsListPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi("/elections");
        if (res.success && res.data) {
          setElections(res.data);
        }
      } catch (err) {
        console.error("Failed to load elections:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPEN FOR VOTING</span>
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            OFFICIAL RESULTS PUBLISHED
          </span>
        );
      case "CLOSED":
      case "UNDER_REVIEW":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            POLLS CLOSED • TALLYING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          Student Council Elections
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Official elections administered by the Commission on Elections (COMELEC) of South East Asian Institute of Technology, Inc.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : elections.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Vote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Elections Scheduled</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are currently no active or scheduled elections listed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {elections.map((election) => (
            <div
              key={election.id}
              className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-brand-400 font-mono">
                      A.Y. {election.academicYear} • {election.semester}
                    </span>
                    {getStatusBadge(election.status)}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{election.title}</h2>
                </div>

                <div className="flex items-center space-x-3">
                  {election.status === "OPEN" && (
                    <Link
                      href={`/student/elections/${election.id}/vote`}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-brand-600/20"
                    >
                      <Vote className="w-4 h-4" />
                      <span>Vote Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {election.status === "PUBLISHED" && (
                    <Link
                      href={`/results/${election.id}`}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>View Results</span>
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-4xl">
                {election.description}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Starts: {new Date(election.startTime).toLocaleString()}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Ends: {new Date(election.endTime).toLocaleString()}</span>
                  </span>
                </div>

                {election._count && (
                  <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-500">
                    <span>{election._count.positions} Positions</span>
                    <span>•</span>
                    <span>{election._count.candidates} Candidates</span>
                    <span>•</span>
                    <span>{election._count.ballotSubmissions} Ballots Cast</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
