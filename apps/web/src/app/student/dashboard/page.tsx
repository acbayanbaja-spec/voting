"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { fetchApi, Election } from "../../../lib/api";
import { Countdown, TurnoutBar } from "../../../components/ElectionLive";
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
  XCircle,
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

  // Keep turnout counts fresh while the portal is open
  useEffect(() => {
    if (!user || !isStudent) return;
    const id = setInterval(async () => {
      try {
        const elRes = await fetchApi("/elections");
        if (elRes.success && elRes.data) setElections(elRes.data);
      } catch {
        // Transient refresh failure — keep showing the last known data
      }
    }, 30000);
    return () => clearInterval(id);
  }, [user, isStudent]);

  if (isLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-navy-400 text-sm">Loading Student Portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Student Welcome Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 mb-2 inline-block">
            Student Voter Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-xs sm:text-sm text-navy-400 mt-1">
            School ID: <span className="font-mono text-navy-600">{user?.schoolId}</span> • {user?.department} • {user?.yearLevel}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <Link
            href="/verify"
            className="px-4 py-2 rounded-xl bg-paper hover:bg-brand-50 text-navy-600 border border-line hover:border-brand-300 transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <ShieldCheck className="w-4 h-4 text-leaf-600" />
            <span>Verify Any Receipt</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Elections Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy flex items-center space-x-2">
              <Vote className="w-5 h-5 text-brand-600" />
              <span>My Eligible Elections</span>
            </h2>
            <span className="text-xs text-navy-400">{elections.length} Active Listing</span>
          </div>

          {elections.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-line">
              <Vote className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-navy">No Active Elections</p>
              <p className="text-xs text-navy-400 mt-1">No elections currently open for voting.</p>
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
                    className="p-6 rounded-2xl bg-white border border-line hover:border-brand-300 transition-colors shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-brand-600 font-mono">
                            A.Y. {election.academicYear} • {election.semester}
                          </span>
                          {isOpen ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-leaf-50 text-leaf-700 border border-leaf-200">
                              POLLS OPEN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-paper text-navy-400 border border-line">
                              {election.status}
                            </span>
                          )}
                          {isOpen && <Countdown target={election.endTime} label="closes in" />}
                          {election.status === "SCHEDULED" && (
                            <Countdown target={election.startTime} label="opens in" />
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-navy">{election.title}</h3>
                        <p className="text-xs text-navy-400 mt-1 max-w-xl leading-relaxed">
                          {election.description}
                        </p>
                      </div>

                      {/* Voting Status Indicator */}
                      <div className="flex-shrink-0">
                        {hasVoted ? (
                          <div className="px-3 py-1.5 rounded-xl bg-leaf-50 border border-leaf-200 text-leaf-700 text-xs font-semibold flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Ballot Cast</span>
                          </div>
                        ) : isOpen && isEligible ? (
                          <Link
                            href={`/student/elections/${election.id}/vote`}
                            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                          >
                            <Vote className="w-4 h-4" />
                            <span>Cast Ballot</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : elig?.status === "PENDING" ? (
                          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center space-x-1.5">
                            <Clock className="w-4 h-4 animate-pulse" />
                            <span>Awaiting COMELEC Approval</span>
                          </div>
                        ) : elig?.status === "REJECTED" ? (
                          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-1.5">
                            <XCircle className="w-4 h-4" />
                            <span>Registration Declined</span>
                          </div>
                        ) : !isEligible ? (
                          <span className="px-3 py-1.5 rounded-xl bg-paper border border-line text-navy-400 text-xs">
                            Not in Voter Roster
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-paper border border-line text-navy-400 text-xs">
                            Voting Closed
                          </span>
                        )}
                      </div>
                    </div>

                    {hasVoted && elig?.receiptReference && (
                      <div className="mt-4 p-3 rounded-xl bg-paper border border-line flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-navy-400">Your Verification Reference:</span>
                          <span className="font-mono text-brand-700 font-bold">
                            {elig.receiptReference}
                          </span>
                        </div>
                        <Link
                          href={`/student/receipts/${elig.receiptReference}`}
                          className="text-brand-600 hover:text-brand-700 font-medium flex items-center space-x-1"
                        >
                          <span>View Receipt</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {!hasVoted && elig?.status === "PENDING" && (
                      <p className="mt-4 text-[11px] text-navy-400 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          A COMELEC officer is reviewing your registration. This card updates
                          automatically once you are approved.
                        </span>
                      </p>
                    )}

                    {election._count && election._count.voterEligibilities > 0 && (isOpen || election.status === "CLOSED" || election.status === "UNDER_REVIEW" || election.status === "PUBLISHED") && (
                      <div className="mt-4">
                        <TurnoutBar
                          cast={election._count.ballotSubmissions}
                          eligible={election._count.voterEligibilities}
                        />
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
          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Election Announcements</span>
            </h3>

            {announcements.length === 0 ? (
              <p className="text-xs text-navy-400">No active announcements from COMELEC.</p>
            ) : (
              <div className="space-y-4">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className="pb-4 border-b border-line last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-50 text-amber-700 border border-amber-200">
                      {ann.priority}
                    </span>
                    <h4 className="text-xs font-bold text-navy mt-1.5">{ann.title}</h4>
                    <p className="text-xs text-navy-400 mt-1 leading-relaxed line-clamp-3">
                      {ann.content}
                    </p>
                    <span className="text-[10px] text-navy-400 block mt-2">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-line text-xs text-navy-400 space-y-3">
            <h4 className="text-navy font-bold text-sm">Voter Guidelines</h4>
            <ul className="space-y-2 list-disc list-inside">
              <li>Review candidate platforms before final confirmation.</li>
              <li>You may only cast your ballot once per election.</li>
              <li>Always record your Verification Reference after submission.</li>
              <li>Ballot selections stay private after submission.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
