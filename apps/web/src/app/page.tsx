import React from "react";
import Link from "next/link";
import {
  Vote,
  ShieldCheck,
  Lock,
  FileCheck2,
  Cpu,
  BarChart2,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-gradient-to-b from-navy-950 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.15),rgba(255,255,255,0))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Institutional Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-brand-500/30 text-xs font-semibold text-brand-300 mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>South East Asian Institute of Technology, Inc.</span>
            <span className="text-slate-600">•</span>
            <span>COMELEC Academic Election System</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Online Voting Management System with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-indigo-500">
              Blockchain
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Empowering the SEAIT student body with remote, verifiable, and tamper-evident Student Council elections. Cast your ballot securely from anywhere while maintaining absolute privacy.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-base transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5"
            >
              <Vote className="w-5 h-5" />
              <span>Cast Your Vote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition-colors"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Verify Ballot Receipt</span>
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-slate-400 mt-1">Ballot Privacy & Anonymity</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">EVM</p>
              <p className="text-xs text-slate-400 mt-1">Immutable Smart Ledger</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">Real-Time</p>
              <p className="text-xs text-slate-400 mt-1">Automated Tallying</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">ISO 25010</p>
              <p className="text-xs text-slate-400 mt-1">Quality Architecture</p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Election Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-16 relative z-10">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-brand-900/80 to-navy-900/90 border border-brand-500/30 shadow-2xl backdrop-blur flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>ACTIVE ELECTION OPEN FOR VOTING</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              SEAIT Supreme Student Council General Election 2026-2027
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              Voting period is officially underway. Log in using your institutional Student ID credentials to cast your ballot for Council Executive Officers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/elections"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors text-center"
            >
              View Election Details
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors text-center border border-slate-700"
            >
              Sign In to Vote
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step Voting Process */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Simple & Verifiable</h2>
            <p className="text-3xl font-extrabold text-white mt-2">How It Works in 3 Clear Steps</p>
            <p className="text-slate-400 text-sm mt-3">
              Designed according to Chapter 1 specifications to eliminate long precinct queues while guaranteeing tamper-evident auditability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-lg mb-4 border border-brand-500/20">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Authenticate with School ID</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Log in securely using your registered SEAIT student credentials. The system checks your voter eligibility roster while keeping your future voting choices decoupled.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-lg mb-4 border border-brand-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Review & Cast Digital Ballot</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Browse candidate platforms, select your choices per position, and review your digital ballot. Confirm your submission with cryptographic commitment generation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative group hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-lg mb-4 border border-brand-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Receive & Verify Receipt</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Receive an individualized Verification Reference. Check it against the smart contract ledger at any time to verify your vote was permanently recorded without disclosing choices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Institutional Integrity</h2>
          <p className="text-3xl font-extrabold text-white mt-2">Built for Absolute Trust & Reliability</p>
          <p className="text-slate-400 text-sm mt-3">
            Addressing all 6 fundamental challenges of manual student elections identified in the SEAIT CICT research study.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Cryptographic Ballot Privacy</h3>
            <p className="text-sm text-slate-400 mt-2">
              Student identities are strictly segregated from ballot choice storage. AES-256-GCM encryption and random salting prevent observers from associating voters with selections.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Immutable Blockchain Ledger</h3>
            <p className="text-sm text-slate-400 mt-2">
              Every accepted vote commitment is sealed onto an EVM distributed smart contract ledger, ensuring submitted records cannot be altered, rolled back, or deleted.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Voter-Verifiable Receipts</h3>
            <p className="text-sm text-slate-400 mt-2">
              Students receive a tamper-proof verification reference allowing independent lookup against the blockchain without revealing their candidate selections to anyone.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Automated Vote Tallying</h3>
            <p className="text-sm text-slate-400 mt-2">
              Eliminates human tallying errors and delays. Results are calculated instantly once the election closes, with official Merkle commitment hashing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Real-Time Turnout Monitoring</h3>
            <p className="text-sm text-slate-400 mt-2">
              COMELEC officers monitor live participation metrics, departmental turnout percentages, and transaction health without exposing interim candidate totals.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Protected Voter Records</h3>
            <p className="text-sm text-slate-400 mt-2">
              Replaces physical unsecured logbooks with encrypted database records and audit logging of all sensitive administrative operations.
            </p>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Questions & Answers</h2>
            <p className="text-3xl font-extrabold text-white mt-2">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-semibold text-white text-base">Can anyone see who I voted for?</h4>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                No. The system uses a strict privacy architecture where student identity records and ballot choice submissions are stored separately. Even system administrators and COMELEC officers cannot access a voter-to-choice mapping.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-semibold text-white text-base">What happens if I try to vote more than once?</h4>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                The backend enforces strict database uniqueness constraints and atomic transaction locks. Once a voter has cast a ballot, their voter eligibility record is marked as voted and any subsequent attempt is immediately rejected.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-semibold text-white text-base">How does receipt verification work?</h4>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Upon submitting your ballot, you receive a unique Verification Reference (e.g. SEAIT-SC-2026-XXXX). You can enter this reference on the Receipt Verification page to confirm that your ballot commitment was recorded on the ledger.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-semibold text-white text-base">When are official election results announced?</h4>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Once the authorized election window closes, COMELEC officers perform final reconciliation. When officially verified, results are published with a cryptographic results commitment hash accessible to all students.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
