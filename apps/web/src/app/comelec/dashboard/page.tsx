"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { fetchApi, Election } from "../../../lib/api";
import {
  Vote,
  Users,
  CheckCircle2,
  Clock,
  Cpu,
  BarChart3,
  FileSpreadsheet,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function ComelecDashboardPage() {
  const router = useRouter();
  const { user, isComelec, isAdmin, isLoading } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const [elRes, chainRes] = await Promise.all([
        fetchApi("/elections"),
        fetchApi("/blockchain/status"),
      ]);

      if (elRes.success && elRes.data && elRes.data.length > 0) {
        setElections(elRes.data);
        const openOrFirst = elRes.data.find((e: Election) => e.status === "OPEN") || elRes.data[0];
        setActiveElection(openOrFirst);

        // Fetch analytics for active election
        const anaRes = await fetchApi(`/analytics/${openOrFirst.id}/overview`);
        if (anaRes.success) {
          setAnalytics(anaRes.data);
        }
      }

      if (chainRes.success) {
        setBlockchainStats(chainRes.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isLoading && (!user || (!isComelec && !isAdmin))) {
      router.push("/auth/login");
      return;
    }

    if (user && (isComelec || isAdmin)) {
      loadDashboard();
    }
  }, [user, isComelec, isAdmin, isLoading, router]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (isLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading COMELEC Administration Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              COMELEC Election Monitoring
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Election Command Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time voter turnout, participation tracking, and blockchain ledger health.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
          <Link
            href="/comelec/elections"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-md shadow-brand-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Elections</span>
          </Link>
        </div>
      </div>

      {/* Real-Time Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Eligible Voters</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {analytics?.totalEligibleVoters ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Registered roster entries</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Accepted Ballots</span>
            <Vote className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            {analytics?.acceptedBallots ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Successfully recorded votes</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Voter Turnout</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
            {analytics?.turnoutPercentage ?? 0}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {analytics?.remainingEligibleVoters ?? 0} remaining voters
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Ledger Status</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-white mt-2 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{blockchainStats?.connected ? "Node Synced" : "Ledger Online"}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {analytics?.transactions?.confirmed ?? 0} confirmed commitments
          </p>
        </div>
      </div>

      {/* Main Grid: Department Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Department Turnout Progress (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Participation by College Department</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time voter participation across SEAIT colleges
                </p>
              </div>
            </div>

            {analytics?.departmentStats?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No department statistics recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {analytics?.departmentStats?.map((dept: any) => (
                  <div key={dept.department} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{dept.department}</span>
                      <span className="text-slate-400">
                        {dept.votedCount} / {dept.totalEligible} voters ({dept.turnoutPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${dept.turnoutPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/comelec/voters"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
            >
              <div>
                <FileSpreadsheet className="w-6 h-6 text-brand-400 mb-2" />
                <h4 className="font-bold text-white text-sm">Voter Roster</h4>
                <p className="text-xs text-slate-400 mt-1">Import CSV & manage eligible voters</p>
              </div>
              <span className="text-xs text-brand-400 font-semibold mt-4 flex items-center space-x-1">
                <span>Manage Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href={activeElection ? `/comelec/tally/${activeElection.id}` : "/comelec/elections"}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
            >
              <div>
                <BarChart3 className="w-6 h-6 text-emerald-400 mb-2" />
                <h4 className="font-bold text-white text-sm">Tally & Reconcile</h4>
                <p className="text-xs text-slate-400 mt-1">Audit counts & publish official results</p>
              </div>
              <span className="text-xs text-emerald-400 font-semibold mt-4 flex items-center space-x-1">
                <span>Open Tally</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/comelec/audit"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
            >
              <div>
                <ShieldAlert className="w-6 h-6 text-amber-400 mb-2" />
                <h4 className="font-bold text-white text-sm">Audit Trails</h4>
                <p className="text-xs text-slate-400 mt-1">Inspect immutable security logs</p>
              </div>
              <span className="text-xs text-amber-400 font-semibold mt-4 flex items-center space-x-1">
                <span>View Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>

        {/* Right Sidebar: Active Election Status & Blockchain Information (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Active Election Status</span>
            </h3>

            {activeElection ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Election Title</span>
                  <p className="font-bold text-white text-sm">{activeElection.title}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block mb-1">State Transition Controls</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 uppercase font-mono">
                      {activeElection.status}
                    </span>
                    <Link
                      href="/comelec/elections"
                      className="text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      Change Status →
                    </Link>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Authorized Voting Window</span>
                  <p className="text-slate-300">
                    {new Date(activeElection.startTime).toLocaleTimeString()} –{" "}
                    {new Date(activeElection.endTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active election.</p>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Smart Contract Ledger</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Network:</span>
                <span className="font-mono text-slate-200">EVM Chain ({blockchainStats?.chainId || 31337})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Transactions:</span>
                <span className="font-bold text-white">
                  {blockchainStats?.metrics?.totalTransactions || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Confirmed:</span>
                <span className="font-bold text-emerald-400">
                  {blockchainStats?.metrics?.confirmedTransactions || 0}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 block text-[11px] mb-0.5">Contract Address:</span>
                <span className="font-mono text-[11px] text-slate-300 break-all">
                  {blockchainStats?.contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
