"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Vote,
  ShieldCheck,
  BarChart3,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  FileText,
  UserPlus,
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-line text-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center space-x-3 group" aria-label="SEAIT Voting home">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white group-hover:bg-brand-700 transition-colors">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold tracking-tight text-navy text-base">SEAIT</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100">
                  COMELEC
                </span>
              </div>
              <p className="text-[11px] text-navy-400 font-medium">Online Voting System</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-navy-500 hover:text-navy hover:bg-paper"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-600" : "text-navy-400"}`} />
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
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center space-x-1"
                  >
                    <span>Student Portal</span>
                  </Link>
                )}
                {isComelec && (
                  <Link
                    href="/comelec/dashboard"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-leaf-600 hover:bg-leaf-700 text-white transition-colors flex items-center space-x-1"
                  >
                    <span>COMELEC Portal</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-900 text-white transition-colors flex items-center space-x-1"
                  >
                    <span>Admin Portal</span>
                  </Link>
                )}

                <div className="flex items-center space-x-2 pl-2 border-l border-line text-xs">
                  <div className="text-right">
                    <p className="font-semibold text-navy-600">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-navy-400">{user.schoolId}</p>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    aria-label="Sign out"
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-navy-400 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-300"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/register"
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors border border-transparent hover:border-brand-100"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="p-2 rounded-lg text-navy-500 hover:text-navy hover:bg-paper focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-line px-4 pt-2 pb-4 space-y-1 shadow-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-base font-medium text-navy-600 hover:bg-paper"
            >
              <span>{link.label}</span>
            </Link>
          ))}
          <div className="pt-4 border-t border-line">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="font-semibold text-sm text-navy">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-navy-400">{user.role}</p>
                </div>
                {isStudent && (
                  <Link
                    href="/student/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-center text-sm"
                  >
                    Student Portal
                  </Link>
                )}
                {isComelec && (
                  <Link
                    href="/comelec/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg bg-leaf-600 text-white font-medium text-center text-sm"
                  >
                    COMELEC Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg bg-navy-800 text-white font-medium text-center text-sm"
                  >
                    System Administration
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-2.5 rounded-lg border border-brand-200 text-brand-700 bg-brand-50 font-semibold text-sm"
                >
                  Register
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
