"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "../../../lib/api";
import { ShieldAlert, Search, Clock, User, Filter } from "lucide-react";

export default function ComelecAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetchApi("/audit-logs");
        if (res.success && res.data) {
          setLogs(res.data.logs);
        }
      } catch (err) {
        console.error("Audit log error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Tamper-Evident Audit Trail</h1>
        <p className="text-xs text-navy-400 mt-1">
          Recorded timestamps and operational events for election integrity verification.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-navy-500">
            <thead className="bg-paper text-navy-400 font-semibold border-b border-line uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-navy-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-navy-400">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-paper transition-colors">
                    <td className="py-3 px-4 font-mono text-navy-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-navy">
                      <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 font-mono text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-navy-500">
                      {log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.schoolId})` : "System / Anonymous"}
                    </td>
                    <td className="py-3 px-4 text-navy-400">{log.entity}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-navy-400 max-w-xs truncate">
                      {log.details || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
