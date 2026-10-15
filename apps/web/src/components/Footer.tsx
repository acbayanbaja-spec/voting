import React from "react";
import Link from "next/link";
import { ShieldCheck, Vote, ExternalLink, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-slate-800 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Vote className="w-4 h-4" />
              </div>
              <span className="text-white font-bold tracking-tight text-base">SEAIT Voting</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Online Voting Management System with Blockchain developed for the Supreme Student Council elections of South East Asian Institute of Technology, Inc.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Immutable Ledger Verified</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Elections</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/elections" className="hover:text-white transition-colors">
                  Active & Upcoming Elections
                </Link>
              </li>
              <li>
                <Link href="/candidates" className="hover:text-white transition-colors">
                  Candidate Directory
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-white transition-colors">
                  Official Election Results
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white transition-colors">
                  Receipt Verification Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Institution</h4>
            <ul className="space-y-2 text-xs">
              <li>South East Asian Institute of Technology, Inc.</li>
              <li>College of Information & Communications Technology</li>
              <li>Commission on Elections (COMELEC)</li>
              <li>Supreme Student Council (SSC)</li>
              <li>IT 323: System Integration & Architecture 1</li>
            </ul>
          </div>

          {/* Governance & Privacy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Governance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Ballot Privacy & Anonymity
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Project Scope & Chapter 1
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Voter FAQ & Guidelines
                </Link>
              </li>
              <li>
                <span className="text-slate-500">ISO/IEC 25010 Quality Standards</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} South East Asian Institute of Technology, Inc. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Student Council Election Management System</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
