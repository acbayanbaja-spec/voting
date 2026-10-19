import React from "react";
import Link from "next/link";
import { ShieldCheck, Vote } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-line text-navy-500 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Vote className="w-4 h-4" />
              </div>
              <span className="text-navy font-bold tracking-tight text-base">SEAIT Voting</span>
            </div>
            <p className="text-xs text-navy-400 leading-relaxed">
              Online Voting Management System for the Supreme Student Council elections of South
              East Asian Institute of Technology, Inc.
            </p>
            <div className="flex items-center space-x-2 text-xs text-leaf-700 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Vote commitments recorded on a tamper-evident ledger</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-600 mb-3">
              Elections
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/elections" className="hover:text-brand-700 transition-colors">
                  Active &amp; Upcoming Elections
                </Link>
              </li>
              <li>
                <Link href="/candidates" className="hover:text-brand-700 transition-colors">
                  Candidate Directory
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-brand-700 transition-colors">
                  Official Election Results
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-brand-700 transition-colors">
                  Receipt Verification Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional Information */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-600 mb-3">
              Institution
            </h4>
            <ul className="space-y-2 text-xs text-navy-400">
              <li>South East Asian Institute of Technology, Inc.</li>
              <li>College of Information &amp; Communication Technology</li>
              <li>Commission on Elections (COMELEC)</li>
              <li>Supreme Student Council (SSC)</li>
              <li>IT 323: System Integration &amp; Architecture 1</li>
            </ul>
          </div>

          {/* Governance & Privacy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-600 mb-3">
              Governance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-brand-700 transition-colors">
                  Ballot Privacy &amp; Anonymity
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-700 transition-colors">
                  Project Scope &amp; Chapter 1
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-brand-700 transition-colors">
                  Voter FAQ &amp; Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between text-xs text-navy-400">
          <p>
            © {new Date().getFullYear()} South East Asian Institute of Technology, Inc. All rights
            reserved.
          </p>
          <p className="mt-2 sm:mt-0">Student Council Election Management System</p>
        </div>
      </div>
    </footer>
  );
}
