"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { fetchApi } from "../../../lib/api";
import { Vote, Lock, User, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        // Redirect by role
        if (res.data.user.role === "STUDENT") {
          router.push("/student/dashboard");
        } else if (res.data.user.role === "COMELEC_OFFICER") {
          router.push("/comelec/dashboard");
        } else {
          router.push("/admin/users");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Demo credential filler
  const fillCredentials = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Vote className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In to SEAIT Elections
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            South East Asian Institute of Technology, Inc. • COMELEC Portal
          </p>
        </div>

        {/* Demo Accounts Pill Card for Evaluation */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5 font-semibold text-brand-300 mb-2">
            <KeyRound className="w-4 h-4" />
            <span>Demonstration Test Accounts</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Click any role to auto-fill verified test credentials:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("2024-00123", "Student@12345")}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-brand-600/30 text-slate-200 border border-slate-700 hover:border-brand-500 text-[11px] font-medium transition-colors text-center"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("comelec@seait.edu.ph", "Comelec@12345")}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-200 border border-slate-700 hover:border-emerald-500 text-[11px] font-medium transition-colors text-center"
            >
              ⚖️ COMELEC
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("admin@seait.edu.ph", "Admin@12345")}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-slate-200 border border-slate-700 hover:border-purple-500 text-[11px] font-medium transition-colors text-center"
            >
              ⚙️ Admin
            </button>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              School ID or Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 2024-00123 or user@seait.edu.ph"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-600/25 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          <p>Protected by cryptographic role-based access control.</p>
          <p className="mt-1">Inquiries? Contact the SEAIT COMELEC Committee.</p>
        </div>
      </div>
    </div>
  );
}
