"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Vote,
  ShieldCheck,
  BarChart3,
  Search,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  FileText,
  ChevronDown,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isStudent, isComelec, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/elections", label: "Elections", icon: Vote },
    { href: "/candidates", label: "Candidates", icon: User },
    { href: "/results", label: "Results", icon: BarChart3 },
    { href: "/verify", label: "Verify Receipt", icon: ShieldCheck },
    { href: "/about", label: "About", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">SEAIT</span>
                <span className="text-xs uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  COMELEC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Online Voting Management System</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800/90 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {isStudent && (
                  <Link
                    href="/student/dashboard"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <span>Student Portal</span>
                  </Link>
                )}
                {isComelec && (
                  <Link
                    href="/comelec/dashboard"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <span>COMELEC Portal</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center space-x-1 shadow-sm"
                  >
                    <span>Admin Portal</span>
                  </Link>
                )}

                <div className="flex items-center space-x-2 pl-2 border-l border-slate-800 text-xs">
                  <div className="text-right">
                    <p className="font-semibold text-slate-200">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{user.schoolId}</p>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all shadow-md shadow-brand-600/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-950 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <span>{link.label}</span>
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="font-semibold text-sm text-slate-200">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-400">{user.role}</p>
                </div>
                {isStudent && (
                  <Link
                    href="/student/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg bg-brand-600 text-white font-medium text-center"
                  >
                    Student Portal
                  </Link>
                )}
                {isComelec && (
                  <Link
                    href="/comelec/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg bg-emerald-600 text-white font-medium text-center"
                  >
                    COMELEC Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg bg-purple-600 text-white font-medium text-center"
                  >
                    System Administration
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:bg-slate-800 text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
