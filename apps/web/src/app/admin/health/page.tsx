"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import { Activity, Database, Cpu, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    try {
      const res = await fetchApi("/health");
      setHealth(res);
    } catch (err: any) {
      setHealth({ status: "DEGRADED", error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">System Service Health</h1>
          <p className="text-xs text-navy-400 mt-1">
            Current status of backend API, PostgreSQL persistence layer, and EVM blockchain node.
          </p>
        </div>
        <button
          onClick={loadHealth}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-paper text-navy-600 border border-line hover:border-brand-300 text-xs font-medium flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="h-44 rounded-2xl bg-white animate-pulse border border-line" />
      ) : (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-leaf-50 text-leaf-600 border border-leaf-100 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">API Service Status</h3>
                <p className="text-xs text-navy-400">Node.js Express REST Backend</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-leaf-50 text-leaf-700 border border-leaf-200">
              {health?.status || "HEALTHY"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-line">
              <div className="flex items-center space-x-2 text-brand-600 mb-2">
                <Database className="w-4 h-4" />
                <h4 className="font-bold text-sm text-navy">PostgreSQL Database</h4>
              </div>
              <p className="text-xs text-navy-400">
                Connection Status:{" "}
                <span className="font-bold text-leaf-700">
                  {health?.database?.status || "UP"}
                </span>
              </p>
              <p className="text-xs text-navy-400 mt-1">Engine: Supabase / PostgreSQL</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-line">
              <div className="flex items-center space-x-2 text-leaf-600 mb-2">
                <Cpu className="w-4 h-4" />
                <h4 className="font-bold text-sm text-navy">Blockchain EVM Ledger</h4>
              </div>
              <p className="text-xs text-navy-400">
                Network:{" "}
                <span className="font-bold text-navy">
                  Chain ID {health?.blockchain?.networkChainId || 31337}
                </span>
              </p>
              <p className="text-xs text-navy-400 mt-1 font-mono truncate">
                Contract: {health?.blockchain?.contractAddress || "VotingLedger"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
