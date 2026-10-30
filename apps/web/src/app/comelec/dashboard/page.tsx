"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { fetchApi, Election } from "../../../lib/api";
import { AnimatedNumber, Countdown, LiveDot } from "../../../components/ElectionLive";
import {
  Vote,
  Users,
  CheckCircle2,
  Clock,
  Cpu,
  BarChart3,
  FileSpreadsheet,
  ListChecks,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Database,
} from "lucide-react";

const REFRESH_INTERVAL_MS = 20000;

export default function ComelecDashboardPage() {
  const router = useRouter();
  const { user, isComelec, isAdmin, isLoading } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [working, setWorking] = useState(false);
  // Department bars grow from zero the first time a tally for an election paints
  const [barsReady, setBarsReady] = useState(false);

  const loadDashboard = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!options.silent) setRefreshing(true);
      try {
        const [elRes, chainRes] = await Promise.all([
          fetchApi("/elections"),
          fetchApi("/blockchain/status"),
        ]);

        if (elRes.success && elRes.data && elRes.data.length > 0) {
          const list: Election[] = elRes.data;
          const openOrFirst = list.find((e) => e.status === "OPEN") || list[0];
          setElections(list);
          setActiveElection(openOrFirst);

          const anaRes = await fetchApi(`/analytics/${openOrFirst.id}/overview`);
          if (anaRes.success) {
            setBarsReady(false);
            setAnalytics(anaRes.data);
          }
        } else {
          setElections([]);
          setActiveElection(null);
          setAnalytics(null);
        }

        if (chainRes.success) setBlockchainStats(chainRes.data);
        setError(null);
        setLastUpdated(new Date());
      } catch (err: any) {
        setError(err.message || "Could not reach the election monitoring service.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isLoading && (!user || (!isComelec && !isAdmin))) {
      router.push("/auth/login");
      return;
    }

    if (user && (isComelec || isAdmin)) {
      loadDashboard();
    }
  }, [user, isComelec, isAdmin, isLoading, router, loadDashboard]);

  // Monitoring means monitoring: keep the numbers moving without a manual refresh
  useEffect(() => {
    if (!user || (!isComelec && !isAdmin)) return;
    const id = setInterval(() => loadDashboard({ silent: true }), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user, isComelec, isAdmin, loadDashboard]);

  useEffect(() => {
    if (!analytics) return;
    const frame = requestAnimationFrame(() => setBarsReady(true));
    return () => cancelAnimationFrame(frame);
  }, [analytics]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  const handleRefresh = () => loadDashboard();

  const enrollAllStudents = async () => {
    if (!activeElection) return;
    setWorking(true);
    try {
      const res = await fetchApi(`/voters/${activeElection.id}/enroll-all`, { method: "POST" });
      setNotice(
        `${res.data?.enrolledCount ?? 0} active students added to the "${activeElection.title}" roster and approved to vote.`
      );
      await loadDashboard({ silent: true });
    } catch (err: any) {
      setError(err.message || "Could not enroll the student roster.");
    } finally {
      setWorking(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="skeleton h-4 w-52 rounded-full mb-3" />
        <div className="skeleton h-9 w-80 rounded-xl mb-2" />
        <div className="skeleton h-3 w-96 rounded-lg mb-9" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-28 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-56 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        </div>
        <p className="text-navy-400 text-xs mt-8 text-center">Loading election monitoring data…</p>
      </div>
    );
  }

  const rosterEmpty = !!activeElection && (analytics?.totalEligibleVoters ?? 0) === 0;
  const pollsOpen = activeElection?.status === "OPEN";
  const pendingApprovals = analytics?.pendingApprovals ?? 0;
  const ledgerConnected = !!blockchainStats?.connected;
  const ledgerConfigured = !!blockchainStats?.contractAddress;
  const confirmedCount = analytics?.transactions?.confirmed ?? 0;
  const pendingChainCount = analytics?.transactions?.pending ?? 0;

  const ledgerTone = ledgerConnected
    ? { dot: "text-leaf-700", label: "EVM Ledger Live", chip: "bg-leaf-50 text-leaf-700 border-leaf-200" }
    : ledgerConfigured
      ? {
          dot: "text-amber-700",
          label: "Sealed in Local Ledger",
          chip: "bg-amber-50 text-amber-700 border-amber-200",
        }
      : {
          dot: "text-navy-500",
          label: "Ledger Not Configured",
          chip: "bg-paper text-navy-500 border-line",
        };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7 animate-fade-up">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-leaf-50 text-leaf-700 border border-leaf-200">
              <LiveDot />
              <span>COMELEC Election Monitoring</span>
            </span>
            <span className="text-xs text-navy-400 font-mono">
              {lastUpdated ? `updated ${lastUpdated.toLocaleTimeString()}` : "live session"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
            Election Command Dashboard
          </h1>
          <p className="text-xs text-navy-400">
            Real-time voter turnout, participation tracking, and blockchain ledger health.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-brand-50 text-navy-600 border border-line hover:border-brand-300 text-xs font-medium transition-colors flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing…" : "Refresh Data"}</span>
          </button>
          <Link
            href="/comelec/elections"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Elections</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2 animate-fade-up" role="alert">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Monitoring data unavailable</p>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {notice && (
        <div className="mb-6 p-4 rounded-2xl bg-leaf-50 border border-leaf-200 text-leaf-700 text-xs flex items-start space-x-2 animate-pop-in" role="status">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="font-semibold leading-relaxed">{notice}</p>
        </div>
      )}

      {/* Actionable state alerts */}
      {activeElection && pollsOpen && rosterEmpty && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              <Users className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  The polls are open but the voter roster is empty
                </p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed max-w-2xl">
                  Students for “{activeElection.title}” will see “Not in Voter Roster” until you
                  enroll them. Adding the roster takes one click and approves every active student.
                </p>
              </div>
            </div>
            <button
              onClick={enrollAllStudents}
              disabled={working}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center space-x-1.5 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{working ? "Enrolling…" : "Enroll All Students"}</span>
            </button>
          </div>
        </div>
      )}

      {activeElection && pendingApprovals > 0 && (
        <Link
          href="/comelec/voters"
          className="mb-6 p-4 rounded-2xl bg-brand-50 border border-brand-200 hover:border-brand-400 transition-colors flex items-center justify-between gap-3 animate-fade-up group"
        >
          <div className="flex items-start space-x-2.5">
            <Clock className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-800">
                {pendingApprovals} voter{pendingApprovals === 1 ? "" : "s"} waiting for approval
              </p>
              <p className="text-xs text-brand-700 mt-0.5">
                Self-registered students cannot cast a ballot until you review them.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-700 flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
            <span>Open Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      )}

      {/* Real-Time Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <div className="p-5 rounded-2xl bg-white border border-line shadow-sm card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs text-navy-400 font-medium">Eligible Voters</span>
            <span className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand-600" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-navy mt-2">
            <AnimatedNumber value={analytics?.totalEligibleVoters ?? 0} />
          </p>
          <p className="text-[11px] text-navy-400 mt-1">
            {pendingApprovals > 0
              ? `${pendingApprovals} awaiting approval`
              : "Registered roster entries"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-line shadow-sm card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs text-navy-400 font-medium">Accepted Ballots</span>
            <span className="w-8 h-8 rounded-xl bg-leaf-50 flex items-center justify-center">
              <Vote className="w-4 h-4 text-leaf-600" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-navy mt-2">
            <AnimatedNumber value={analytics?.acceptedBallots ?? 0} />
          </p>
          <p className="text-[11px] text-navy-400 mt-1">
            {pendingChainCount > 0
              ? `${pendingChainCount} awaiting ledger confirmation`
              : "Successfully recorded votes"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-line shadow-sm card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs text-navy-400 font-medium">Voter Turnout</span>
            <span className="w-8 h-8 rounded-xl bg-leaf-50 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-leaf-600" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-leaf-700 mt-2">
            <AnimatedNumber value={analytics?.turnoutPercentage ?? 0} decimals={2} suffix="%" />
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-paper border border-line overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-leaf-500 transition-[width] duration-700 ease-out"
              style={{ width: `${barsReady ? Math.min(100, analytics?.turnoutPercentage ?? 0) : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-navy-400 mt-1.5">
            {analytics?.remainingEligibleVoters ?? 0} remaining voters
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-line shadow-sm card-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs text-navy-400 font-medium">Ledger Status</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-amber-600" />
            </span>
          </div>
          <p
            className={`text-base sm:text-lg font-bold mt-2 flex items-center space-x-1.5 ${ledgerTone.dot}`}
          >
            <LiveDot tone={ledgerConnected ? "leaf" : ledgerConfigured ? "amber" : "brand"} />
            <span>{ledgerTone.label}</span>
          </p>
          <p className="text-[11px] text-navy-400 mt-1 leading-relaxed">
            {ledgerConnected
              ? `${confirmedCount} confirmed commitments`
              : `${analytics?.acceptedBallots ?? 0} ballot${
                  (analytics?.acceptedBallots ?? 0) === 1 ? "" : "s"
                } hash-sealed in the database`}
          </p>
        </div>
      </div>

      {/* Main Grid: Department Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Department Turnout Progress (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm animate-fade-up">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-navy">Participation by College Department</h3>
                <p className="text-xs text-navy-400 mt-0.5">
                  Real-time voter participation across SEAIT colleges
                </p>
              </div>
              {pollsOpen && <LiveDot />}
            </div>

            {!analytics?.departmentStats?.length ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-paper border border-line flex items-center justify-center mx-auto mb-3 animate-drift">
                  <BarChart3 className="w-6 h-6 text-navy-300" />
                </div>
                <p className="text-xs font-semibold text-navy">No department turnout yet</p>
                <p className="text-[11px] text-navy-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  {rosterEmpty
                    ? "Enroll the voter roster above, then ballots cast will break down by college here."
                    : "This panel fills in as soon as the first ballot is recorded."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.departmentStats.map((dept: any) => (
                  <div key={dept.department} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-navy-600">{dept.department}</span>
                      <span className="text-navy-400 font-mono">
                        {dept.votedCount}/{dept.totalEligible} • {dept.turnoutPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-paper rounded-full h-2 overflow-hidden border border-line">
                      <div
                        className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-[width] duration-[900ms] ease-out"
                        style={{ width: `${barsReady ? dept.turnoutPercentage : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            <Link
              href="/comelec/voters"
              className="p-5 rounded-2xl bg-white border border-line hover:border-brand-300 shadow-sm card-lift flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              <div>
                <span className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-2">
                  <FileSpreadsheet className="w-5 h-5 text-brand-600" />
                </span>
                <h4 className="font-bold text-navy text-sm">Voter Roster</h4>
                <p className="text-xs text-navy-400 mt-1">Import CSV & manage eligible voters</p>
                {pendingApprovals > 0 && (
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {pendingApprovals} in queue
                  </span>
                )}
              </div>
              <span className="text-xs text-brand-600 font-semibold mt-4 flex items-center space-x-1">
                <span>Manage Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href={
                activeElection
                  ? `/comelec/elections/${activeElection.id}/ballot`
                  : "/comelec/elections"
              }
              className="p-5 rounded-2xl bg-white border border-line hover:border-brand-300 shadow-sm card-lift flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              <div>
                <span className="w-10 h-10 rounded-xl bg-paper flex items-center justify-center mb-2">
                  <ListChecks className="w-5 h-5 text-navy-500" />
                </span>
                <h4 className="font-bold text-navy text-sm">Ballot Setup</h4>
                <p className="text-xs text-navy-400 mt-1">
                  Add, edit or remove positions & candidates
                </p>
              </div>
              <span className="text-xs text-brand-600 font-semibold mt-4 flex items-center space-x-1">
                <span>Configure Ballot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href={activeElection ? `/comelec/tally/${activeElection.id}` : "/comelec/elections"}
              className="p-5 rounded-2xl bg-white border border-line hover:border-leaf-300 shadow-sm card-lift flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              <div>
                <span className="w-10 h-10 rounded-xl bg-leaf-50 flex items-center justify-center mb-2">
                  <BarChart3 className="w-5 h-5 text-leaf-600" />
                </span>
                <h4 className="font-bold text-navy text-sm">Tally & Reconcile</h4>
                <p className="text-xs text-navy-400 mt-1">
                  Audit counts & publish official results
                </p>
              </div>
              <span className="text-xs text-leaf-600 font-semibold mt-4 flex items-center space-x-1">
                <span>Open Tally</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/comelec/audit"
              className="p-5 rounded-2xl bg-white border border-line hover:border-amber-300 shadow-sm card-lift flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <div>
                <span className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                </span>
                <h4 className="font-bold text-navy text-sm">Audit Trails</h4>
                <p className="text-xs text-navy-400 mt-1">
                  Inspect tamper-evident security logs
                </p>
              </div>
              <span className="text-xs text-amber-600 font-semibold mt-4 flex items-center space-x-1">
                <span>View Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>

        {/* Right Sidebar: Active Election Status & Blockchain Information (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm space-y-4 animate-fade-up">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Active Election Status</span>
            </h3>

            {activeElection ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-navy-400 block mb-0.5">Election Title</span>
                  <p className="font-bold text-navy text-sm">{activeElection.title}</p>
                  <p className="text-[11px] text-navy-400 font-mono mt-0.5">
                    A.Y. {activeElection.academicYear} • {activeElection.semester}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-paper border border-line">
                  <span className="text-navy-400 block mb-1">State Transition Controls</span>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold uppercase font-mono ${
                        activeElection.status === "OPEN" ? "text-leaf-700" : "text-navy-500"
                      }`}
                    >
                      {activeElection.status}
                    </span>
                    <Link
                      href="/comelec/elections"
                      className="text-brand-600 hover:text-brand-700 font-semibold"
                    >
                      Change Status →
                    </Link>
                  </div>
                </div>

                {activeElection.status === "OPEN" && (
                  <Countdown target={activeElection.endTime} label="closes in" />
                )}
                {activeElection.status === "SCHEDULED" && (
                  <Countdown target={activeElection.startTime} label="opens in" />
                )}

                <div>
                  <span className="text-navy-400 block mb-0.5">Authorized Voting Window</span>
                  <p className="text-navy-500">
                    {new Date(activeElection.startTime).toLocaleString()} –{" "}
                    {new Date(activeElection.endTime).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-paper border border-line">
                    <p className="text-[10px] uppercase tracking-wider text-navy-400">Roster</p>
                    <p className="text-base font-bold text-navy">
                      <AnimatedNumber value={analytics?.totalEligibleVoters ?? 0} />
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-paper border border-line">
                    <p className="text-[10px] uppercase tracking-wider text-navy-400">Ballots</p>
                    <p className="text-base font-bold text-navy">
                      <AnimatedNumber value={analytics?.acceptedBallots ?? 0} />
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs font-semibold text-navy">No election to monitor</p>
                <p className="text-[11px] text-navy-400 mt-1 mb-3">
                  Create one to start tracking turnout and ledger health.
                </p>
                <Link
                  href="/comelec/elections"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Election</span>
                </Link>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy uppercase tracking-wider flex items-center space-x-2">
                <Database className="w-4 h-4 text-leaf-600" />
                <span>Smart Contract Ledger</span>
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ledgerTone.chip}`}
              >
                {ledgerConnected ? "ONLINE" : ledgerConfigured ? "LOCAL SEAL" : "UNSET"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-navy-400">RPC Connection:</span>
                <span
                  className={`font-bold flex items-center space-x-1.5 ${
                    ledgerConnected ? "text-leaf-700" : ledgerConfigured ? "text-amber-700" : "text-navy-500"
                  }`}
                >
                  <LiveDot tone={ledgerConnected ? "leaf" : ledgerConfigured ? "amber" : "brand"} />
                  <span>{ledgerConnected ? "Connected" : "Not reachable"}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-navy-400">Signing Wallet:</span>
                <span
                  className={`font-bold ${
                    blockchainStats?.hasSigner ? "text-leaf-700" : "text-amber-700"
                  }`}
                >
                  {blockchainStats?.hasSigner ? "Configured" : "Not configured"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-navy-400">Network:</span>
                <span className="font-mono text-navy-600">
                  {blockchainStats?.chainId ? `EVM Chain (${blockchainStats.chainId})` : "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-navy-400">Total Transactions:</span>
                <span className="font-bold text-navy">
                  <AnimatedNumber value={blockchainStats?.metrics?.totalTransactions || 0} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-navy-400">Confirmed:</span>
                <span className="font-bold text-leaf-700">
                  <AnimatedNumber
                    value={blockchainStats?.metrics?.confirmedTransactions || 0}
                  />
                </span>
              </div>
              <div className="pt-2 border-t border-line">
                <span className="text-navy-400 block text-[11px] mb-0.5">Contract Address:</span>
                <span className="font-mono text-[11px] text-navy-500 break-all">
                  {blockchainStats?.contractAddress || "No contract address configured"}
                </span>
              </div>
              <p className="text-[11px] text-navy-400 leading-relaxed pt-1">
                {ledgerConnected
                  ? "Every ballot commitment is being written to the on-chain ledger."
                  : "Votes are never lost while a node is unreachable: each ballot is SHA-256 sealed and stored in the append-only database ledger, and on-chain confirmation resumes automatically when an EVM node answers."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
