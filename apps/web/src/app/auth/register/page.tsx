"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "../../../lib/api";
import {
  UserPlus,
  User,
  Lock,
  Mail,
  CreditCard,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  ArrowLeft,
} from "lucide-react";

const DEPARTMENTS = [
  "College of Information and Communication Technology",
  "College of Business Administration",
  "College of Education",
  "College of Criminology",
  "Management Information Systems",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

interface FormState {
  firstName: string;
  lastName: string;
  schoolId: string;
  email: string;
  department: string;
  yearLevel: string;
  password: string;
  confirmPassword: string;
  consent: boolean;
}

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  schoolId: "",
  email: "",
  department: "",
  yearLevel: "",
  password: "",
  confirmPassword: "",
  consent: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.firstName.trim()) errs.firstName = "First name is required.";
    if (!form.lastName.trim()) errs.lastName = "Last name is required.";

    if (!form.schoolId.trim()) {
      errs.schoolId = "Student ID is required.";
    } else if (!/^[0-9]{4}-[0-9]{5}$/.test(form.schoolId.trim())) {
      errs.schoolId = "Use the format 2024-00123.";
    }

    if (!form.email.trim()) {
      errs.email = "Institutional email is required.";
    } else if (!/^[^\s@]+@seait\.edu\.ph$/i.test(form.email.trim())) {
      errs.email = "Use your SEAIT address, e.g. name@seait.edu.ph.";
    }

    if (!form.department) errs.department = "Please select your department.";
    if (!form.yearLevel) errs.yearLevel = "Please select your year level.";

    if (form.password.length < 10) {
      errs.password = "At least 10 characters.";
    } else if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      errs.password = "Include uppercase, lowercase, and a number.";
    }

    if (form.confirmPassword !== form.password) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (!form.consent) {
      errs.consent = "Please acknowledge the privacy notice to continue.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          schoolId: form.schoolId.trim(),
          email: form.email.trim(),
          department: form.department,
          yearLevel: form.yearLevel,
          password: form.password,
        }),
      });

      if (res.success) {
        setSuccess(
          res.data?.message ||
            "Account created successfully. You can now sign in with your Student ID or email."
        );
        // Clear the password fields; keep identity fields if the user returns
        setForm((prev) => ({ ...prev, password: "", confirmPassword: "", consent: false }));
        setTimeout(() => router.push("/auth/login"), 4000);
      }
    } catch (err: any) {
      // Recoverable errors keep all non-sensitive input values
      if (err?.data?.error?.code === "SCHOOL_ID_TAKEN") {
        setFieldErrors({ schoolId: "This Student ID is already registered." });
      } else if (err?.data?.error?.code === "EMAIL_TAKEN") {
        setFieldErrors({ email: "This email is already registered." });
      } else {
        setError(
          err.message ||
            "Registration is temporarily unavailable. Please try again in a few moments."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border ${
      hasError ? "border-rose-400" : "border-line"
    } text-navy placeholder-navy-300 text-sm focus:outline-none focus:ring-2 ${
      hasError ? "focus:ring-rose-300" : "focus:ring-brand-500"
    } focus:border-brand-500 transition-colors`;

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="p-8 rounded-2xl bg-white border border-line shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center mx-auto mb-4 border border-leaf-200">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-navy">Account Created</h2>
            <p className="mt-2 text-sm text-navy-400 leading-relaxed">{success}</p>
            <Link
              href="/auth/login"
              className="mt-6 w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors"
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-navy tracking-tight">
            Create your SEAIT student account
          </h1>
          <p className="mt-2 text-sm text-navy-400">
            Register once, then sign in for every election you are eligible to vote in.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-line shadow-sm">
          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-xs font-semibold text-navy-500 mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="Juan"
                    aria-invalid={!!fieldErrors.firstName}
                    className={inputClass(fieldErrors.firstName)}
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-xs font-semibold text-navy-500 mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Dela Cruz"
                    aria-invalid={!!fieldErrors.lastName}
                    className={inputClass(fieldErrors.lastName)}
                  />
                </div>
                {fieldErrors.lastName && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="schoolId" className="block text-xs font-semibold text-navy-500 mb-1.5">
                  Student ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    id="schoolId"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    value={form.schoolId}
                    onChange={(e) => set("schoolId", e.target.value)}
                    placeholder="2024-00123"
                    aria-invalid={!!fieldErrors.schoolId}
                    className={`${inputClass(fieldErrors.schoolId)} font-mono`}
                  />
                </div>
                {fieldErrors.schoolId && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.schoolId}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-navy-500 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="name@seait.edu.ph"
                    aria-invalid={!!fieldErrors.email}
                    className={inputClass(fieldErrors.email)}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="department" className="block text-xs font-semibold text-navy-500 mb-1.5">
                  Department / College
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    id="department"
                    value={form.department}
                    onChange={(e) => set("department", e.target.value)}
                    aria-invalid={!!fieldErrors.department}
                    className={`${inputClass(fieldErrors.department)} appearance-none pr-3 ${
                      form.department ? "" : "text-navy-300"
                    }`}
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} className="text-navy">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.department && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.department}</p>
                )}
              </div>

              <div>
                <label htmlFor="yearLevel" className="block text-xs font-semibold text-navy-500 mb-1.5">
                  Year Level
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    id="yearLevel"
                    value={form.yearLevel}
                    onChange={(e) => set("yearLevel", e.target.value)}
                    aria-invalid={!!fieldErrors.yearLevel}
                    className={`${inputClass(fieldErrors.yearLevel)} appearance-none pr-3 ${
                      form.yearLevel ? "" : "text-navy-300"
                    }`}
                  >
                    <option value="" disabled>
                      Select year level
                    </option>
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y} className="text-navy">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.yearLevel && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.yearLevel}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-navy-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Minimum 10 characters"
                    aria-invalid={!!fieldErrors.password}
                    className={inputClass(fieldErrors.password)}
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
                {fieldErrors.password ? (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.password}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-navy-400">
                    Use at least 10 characters with uppercase, lowercase, and a number.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-navy-500 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-300">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    placeholder="Re-enter your password"
                    aria-invalid={!!fieldErrors.confirmPassword}
                    className={inputClass(fieldErrors.confirmPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-300 hover:text-navy-500"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start space-x-3 text-xs text-navy-500 leading-relaxed">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  aria-invalid={!!fieldErrors.consent}
                  className="mt-0.5 w-4 h-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span>
                  I confirm the information above is accurate and I agree that SEAIT processes my
                  account data to verify my voter eligibility, as described in the{" "}
                  <Link href="/privacy" className="text-brand-600 hover:underline font-semibold">
                    Privacy Notice
                  </Link>
                  . My ballot selections always remain confidential.
                </span>
              </label>
              {fieldErrors.consent && (
                <p className="mt-1 text-[11px] text-rose-600">{fieldErrors.consent}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Student Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-line text-center text-xs text-navy-400">
            <p>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-brand-600 hover:text-brand-700 font-semibold">
                Sign in instead
              </Link>
            </p>
            <p className="mt-2 flex items-center justify-center space-x-1">
              <ArrowLeft className="w-3 h-3" />
              <Link href="/" className="hover:text-brand-600">
                Back to home
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-navy-400 leading-relaxed max-w-md mx-auto">
          Accounts are created as students only. Voting eligibility for each election is granted
          separately by the COMELEC committee. If you believe you should be eligible but cannot
          vote, please contact the SEAIT COMELEC office.
        </p>
      </div>
    </div>
  );
}
