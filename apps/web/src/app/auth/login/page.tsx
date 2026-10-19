"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { fetchApi } from "../../../lib/api";
import { Vote, Lock, User, AlertCircle, ArrowRight, KeyRound, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const inputClass =
    "w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-line text-navy placeholder-navy-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors";

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white">
            <Vote className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-navy tracking-tight">
            Sign in to SEAIT Elections
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-navy-400">
            South East Asian Institute of Technology, Inc. • Student Council Elections
          </p>
        </div>

        {/* Demo Accounts Card for evaluation */}
        <div className="p-4 rounded-xl bg-white border border-line text-xs text-navy-500">
          <div className="flex items-center space-x-1.5 font-semibold text-brand-700 mb-2">
            <KeyRound className="w-4 h-4" />
            <span>Demonstration Test Accounts</span>
          </div>
          <p className="text-[11px] text-navy-400 mb-3">
            Click a role to auto-fill test credentials for this evaluation build:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("2024-00123", "Student@12345")}
              className="px-2 py-1.5 rounded-lg bg-paper hover:bg-brand-50 text-navy-600 border border-line hover:border-brand-300 text-[11px] font-medium transition-colors text-center"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("comelec@seait.edu.ph", "Comelec@12345")}
              className="px-2 py-1.5 rounded-lg bg-paper hover:bg-brand-50 text-navy-600 border border-line hover:border-brand-300 text-[11px] font-medium transition-colors text-center"
            >
              COMELEC
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("admin@seait.edu.ph", "Admin@12345")}
              className="px-2 py-1.5 rounded-lg bg-paper hover:bg-brand-50 text-navy-600 border border-line hover:border-brand-300 text-[11px] font-medium transition-colors text-center"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-line shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-xs font-semibold text-navy-500 mb-1.5">
                School ID or Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 2024-00123 or name@seait.edu.ph"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-navy-500">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-300 hover:text-navy-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line text-center text-xs text-navy-400">
            <p>
              New student voter?{" "}
              <Link
                href="/auth/register"
                className="text-brand-600 hover:text-brand-700 font-semibold"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-navy-400">
          <p>
            Trouble signing in? Contact the SEAIT COMELEC Committee or the Office of Student
            Affairs.
          </p>
        </div>
      </div>
    </div>
  );
}
