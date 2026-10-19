import React from "react";
import Link from "next/link";
import {
  Vote,
  ShieldCheck,
  BookOpen,
  Award,
  Layers,
  CheckCircle2,
  Lock,
  Cpu,
  BarChart2,
  FileText,
} from "lucide-react";

export default function AboutSystemPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 mb-3 inline-block">
          Academic Project Study • Chapter 1 & 2
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-navy">
          About the Online Voting Management System
        </h1>
        <p className="mt-3 text-sm text-navy-400 leading-relaxed">
          Designed and developed for the Commission on Elections (COMELEC) and the student body of South East Asian Institute of Technology, Inc. (SEAIT).
        </p>
      </div>

      <div className="space-y-10">
        {/* Academic Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-brand-700 font-bold text-sm uppercase tracking-wider">
            <BookOpen className="w-5 h-5" />
            <span>Institutional Background</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-paper border border-line">
              <span className="text-navy-400 block mb-1">Institution</span>
              <p className="font-bold text-navy text-sm">
                South East Asian Institute of Technology, Inc.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line">
              <span className="text-navy-400 block mb-1">Academic Unit</span>
              <p className="font-bold text-navy text-sm">
                College of Information & Communications Technology
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line">
              <span className="text-navy-400 block mb-1">Subject & Course</span>
              <p className="font-medium text-navy-600">
                IT 323: System Integration and Architecture 1
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line">
              <span className="text-navy-400 block mb-1">Researcher</span>
              <p className="font-medium text-navy-600">
                Abilo, Shelley Fatima D.
              </p>
            </div>
          </div>
        </div>

        {/* Rationale and Problem Statement */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-navy">Rationale of the Study</h2>
          <p className="text-xs sm:text-sm text-navy-500 leading-relaxed">
            The institution&apos;s COMELEC committee historically administered Student Council elections through a traditional, paper-based process. Students lined up at designated campus precincts to check paper rosters and cast physical ballots, followed by manual tallying on whiteboards.
          </p>
          <p className="text-xs sm:text-sm text-navy-400 leading-relaxed">
            This traditional process encountered persistent challenges: (1) limited on-campus voting windows restricted off-campus and working students; (2) manual tallying was slow and prone to human error; (3) physical ballots and rosters were vulnerable to loss or tampering; (4) voters could not independently verify their votes; (5) student voter info was exposed in unsecured paper logbooks; and (6) COMELEC officers lacked real-time turnout visibility.
          </p>
        </div>

        {/* Scope of Features (The 6 Core Objectives) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-line shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-navy">The Six Core Scope Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-paper border border-line space-y-1.5">
              <div className="flex items-center space-x-2 text-brand-700 font-bold text-xs">
                <Vote className="w-4 h-4" />
                <span>1. Online Voting (Blockchain-Secured)</span>
              </div>
              <p className="text-xs text-navy-400">
                Enables verified students to cast remote ballots from any internet-connected device, eliminating physical precinct queues.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line space-y-1.5">
              <div className="flex items-center space-x-2 text-leaf-700 font-bold text-xs">
                <Cpu className="w-4 h-4" />
                <span>2. Automated Real-Time Tallying</span>
              </div>
              <p className="text-xs text-navy-400">
                Automates vote counts and displays final results immediately when voting closes, preventing counting delays and disputes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line space-y-1.5">
              <div className="flex items-center space-x-2 text-brand-700 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>3. Immutable Blockchain Vote Ledger</span>
              </div>
              <p className="text-xs text-navy-400">
                Permanently records cryptographic vote commitments onto a distributed smart contract ledger, making any post-election alteration evident.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>4. Voter-Verifiable Vote Receipts</span>
              </div>
              <p className="text-xs text-navy-400">
                Issues unique verification references allowing students to confirm their ballot is recorded without exposing their choices.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line space-y-1.5">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>5. Encrypted Voter Database</span>
              </div>
              <p className="text-xs text-navy-400">
                Secures student credentials with cryptographic separation between authentication and ballot submission data.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-paper border border-line space-y-1.5">
              <div className="flex items-center space-x-2 text-navy-800 font-bold text-xs">
                <BarChart2 className="w-4 h-4" />
                <span>6. Real-Time Monitoring Dashboard</span>
              </div>
              <p className="text-xs text-navy-400">
                Provides COMELEC officers with live visibility into turnout rates and departmental progress while polls are open.
              </p>
            </div>
          </div>
        </div>

        {/* Quality Standards & SDG Alignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-line shadow-sm space-y-2">
            <h3 className="text-base font-bold text-navy flex items-center space-x-2">
              <Award className="w-4 h-4 text-leaf-600" />
              <span>ISO/IEC 25010 Quality Standards</span>
            </h3>
            <p className="text-xs text-navy-400 leading-relaxed">
              Evaluated across functional suitability, performance efficiency, compatibility, usability, reliability, security, maintainability, and portability.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-line shadow-sm space-y-2">
            <h3 className="text-base font-bold text-navy flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>UN Sustainable Development Goals</span>
            </h3>
            <p className="text-xs text-navy-400 leading-relaxed">
              Directly advances <strong>SDG 16 (Peace, Justice, and Strong Institutions)</strong> by safeguarding institutional transparency, and <strong>SDG 9 (Industry, Innovation, and Infrastructure)</strong> through digital ledger modernization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
