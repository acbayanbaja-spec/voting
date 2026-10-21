"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi, Election } from "../../lib/api";
import { Countdown, TurnoutBar } from "../../components/ElectionLive";
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

    // Live turnout refresh
    const id = setInterval(async () => {
      try {
        const res = await fetchApi("/elections");
        if (res.success && res.data) setElections(res.data);
      } catch {
        // keep last known data on transient failures
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-leaf-50 text-leaf-700 border border-leaf-200 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-leaf-500 animate-pulse" />
            <span>OPEN FOR VOTING</span>
          </span>
        );
      case "PUBLISHED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
            OFFICIAL RESULTS PUBLISHED
          </span>
        );
      case "CLOSED":
      case "UNDER_REVIEW":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            POLLS CLOSED • TALLYING
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-paper text-navy-500 border border-line">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Student Council Elections
        </h1>
        <p className="mt-2 text-sm text-navy-400">
          Official elections administered by the Commission on Elections (COMELEC) of South East Asian Institute of Technology, Inc.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white animate-pulse border border-line" />
          ))}
        </div>
      ) : elections.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-line shadow-sm">
          <Vote className="w-12 h-12 text-navy-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">No Elections Scheduled</h3>
          <p className="text-xs text-navy-400 mt-1">
            There are currently no active or scheduled elections listed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {elections.map((election) => (
            <div
              key={election.id}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-line hover:border-line-strong transition-colors shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs font-semibold text-brand-600 font-mono">
                      A.Y. {election.academicYear} • {election.semester}
                    </span>
                    {getStatusBadge(election.status)}
                    {election.status === "OPEN" && (
                      <Countdown target={election.endTime} label="closes in" />
                    )}
                    {election.status === "SCHEDULED" && (
                      <Countdown target={election.startTime} label="opens in" />
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-navy">{election.title}</h2>
                </div>

                <div className="flex items-center space-x-3">
                  {election.status === "OPEN" && (
                    <Link
                      href={`/student/elections/${election.id}/vote`}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Vote className="w-4 h-4" />
                      <span>Vote Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {election.status === "PUBLISHED" && (
                    <Link
                      href={`/results/${election.id}`}
                      className="px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>View Results</span>
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-navy-400 leading-relaxed max-w-4xl">
                {election.description}
              </p>

              {election._count &&
                election._count.voterEligibilities > 0 &&
                ["OPEN", "CLOSED", "UNDER_REVIEW", "PUBLISHED"].includes(election.status) && (
                  <div className="mt-5 max-w-md">
                    <TurnoutBar
                      cast={election._count.ballotSubmissions}
                      eligible={election._count.voterEligibilities}
                    />
                  </div>
                )}

              <div className="mt-6 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-4 text-xs text-navy-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-navy-400" />
                    <span>Starts: {new Date(election.startTime).toLocaleString()}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-navy-400" />
                    <span>Ends: {new Date(election.endTime).toLocaleString()}</span>
                  </span>
                </div>

                {election._count && (
                  <div className="flex items-center space-x-4 font-mono text-[11px] text-navy-400">
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
