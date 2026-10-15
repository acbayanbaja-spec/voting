"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { fetchApi, Election } from "../../../lib/api";
import {
  Vote,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Bell,
  User,
  ExternalLink,
} from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, isStudent, isLoading } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [eligibilityMap, setEligibilityMap] = useState<Record<string, any>>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/auth/login");
      return;
    }

    async function loadData() {
      try {
        const [elRes, annRes] = await Promise.all([
          fetchApi("/elections"),
          fetchApi("/announcements"),
        ]);

        if (elRes.success && elRes.data) {
          setElections(elRes.data);

          // Check eligibility for each election
          const eligMap: Record<string, any> = {};
          for (const el of elRes.data) {
            try {
              const eligRes = await fetchApi(`/ballots/eligibility/${el.id}`);
              if (eligRes.success) {
                eligMap[el.id] = eligRes.data;
              }
            } catch {
              // Ignore individual failure
            }
          }
          setEligibilityMap(eligMap);
        }

        if (annRes.success && annRes.data) {
          setAnnouncements(annRes.data);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user && isStudent) {
      loadData();
    }
  }, [user, isStudent, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading Student Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Student Welcome Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-navy-950 to-slate-900 border border-slate-800 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 mb-2 inline-block">
            Student Voter Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            School ID: <span className="font-mono text-slate-200">{user?.schoolId}</span> • {user?.department} • {user?.yearLevel}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <Link
            href="/verify"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verify Any Receipt</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Elections Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Vote className="w-5 h-5 text-brand-400" />
              <span>My Eligible Elections</span>
            </h2>
            <span className="text-xs text-slate-500">{elections.length} Active Listing</span>
          </div>

          {elections.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Vote className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No Active Elections</p>
              <p className="text-xs text-slate-400 mt-1">No elections currently open for voting.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {elections.map((election) => {
                const elig = eligibilityMap[election.id];
                const hasVoted = elig?.hasVoted;
                const isEligible = elig?.isEligible;
                const isOpen = election.status === "OPEN";

                return (
                  <div
                    key={election.id}
                    className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-semibold text-brand-400 font-mono">
                            A.Y. {election.academicYear} • {election.semester}
                          </span>
                          {isOpen ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              POLLS OPEN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              {election.status}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white">{election.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                          {election.description}
                        </p>
                      </div>

                      {/* Voting Status Indicator */}
                      <div className="flex-shrink-0">
                        {hasVoted ? (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ballot Cast</span>
                          </div>
                        ) : isOpen && isEligible ? (
                          <Link
                            href={`/student/elections/${election.id}/vote`}
                            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-md shadow-brand-600/20"
                          >
                            <Vote className="w-4 h-4" />
                            <span>Cast Ballot</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : !isEligible ? (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs">
                            Not in Voter Roster
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs">
                            Voting Closed
                          </span>
                        )}
                      </div>
                    </div>

                    {hasVoted && elig?.receiptReference && (
                      <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500">Your Verification Reference:</span>
                          <span className="font-mono text-indigo-300 font-bold">
                            {elig.receiptReference}
                          </span>
                        </div>
                        <Link
                          href={`/student/receipts/${elig.receiptReference}`}
                          className="text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
                        >
                          <span>View Receipt</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Announcements & Voter Information (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Election Announcements</span>
            </h3>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500">No active announcements from COMELEC.</p>
            ) : (
              <div className="space-y-4">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="pb-4 border-b border-slate-800/80 last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {ann.priority}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">{ann.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3">
                      {ann.content}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-2">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-3">
            <h4 className="text-white font-bold text-sm">Voter Guidelines</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li>Review candidate platforms before final confirmation.</li>
              <li>You may only cast your ballot once per election.</li>
              <li>Always record your Verification Reference after submission.</li>
              <li>Ballot choices are encrypted and kept strictly confidential.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
