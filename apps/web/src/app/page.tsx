"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi, Election } from "../lib/api";
import {
  Vote,
  ShieldCheck,
  Lock,
  FileCheck2,
  BarChart2,
  ArrowRight,
  Users,
  Clock,
  HelpCircle,
} from "lucide-react";

function OpenElectionsBanner() {
  const [openElections, setOpenElections] = useState<Election[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchApi("/elections?status=OPEN")
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setOpenElections(res.data);
        } else {
          setOpenElections([]);
        }
      })
      .catch(() => {
        setFailed(true);
        setOpenElections([]);
      });
  }, []);

  if (openElections === null) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="p-6 rounded-2xl bg-white border border-line animate-pulse h-24" />
      </div>
    );
  }

  if (openElections.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-line shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-paper text-navy-400 flex items-center justify-center flex-shrink-0 border border-line">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-navy">
                {failed ? "Election information unavailable right now" : "No election is currently open for voting"}
              </h2>
              <p className="text-sm text-navy-400 mt-1 max-w-2xl">
                {failed
                  ? "We could not reach the election service. Please check again shortly."
                  : "When the COMELEC committee opens the next Student Council election, it will appear here with its official voting schedule."}
              </p>
            </div>
          </div>
          <Link
            href="/elections"
            className="px-5 py-2.5 rounded-xl bg-paper hover:bg-paper-dark border border-line text-navy-600 font-semibold text-sm transition-colors text-center flex-shrink-0"
          >
            View All Elections
          </Link>
        </div>
      </div>
    );
  }

  const election = openElections[0];
  const endsAt = election.endTime ? new Date(election.endTime).toLocaleString() : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
      <div className="p-6 sm:p-7 rounded-2xl bg-brand-50 border border-brand-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-leaf-50 text-leaf-700 border border-leaf-200">
            <span className="w-2 h-2 rounded-full bg-leaf-500" />
            <span>OPEN FOR VOTING</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-navy">{election.title}</h2>
          <p className="text-sm text-navy-500 max-w-2xl">
            Voting is underway{endsAt ? ` and closes ${endsAt}` : ""}. Sign in with your SEAIT
            student credentials to participate.
          </p>
          {openElections.length > 1 && (
            <p className="text-xs text-navy-400">
              {openElections.length - 1} more election{openElections.length > 2 ? "s" : ""} also
              open — see the Elections page.
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
          <Link
            href="/elections"
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-paper text-brand-700 border border-brand-200 font-semibold text-sm transition-colors text-center"
          >
            View Election Details
          </Link>
          <Link
            href="/auth/login"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors text-center"
          >
            Sign In to Vote
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="pt-14 pb-12 md:pt-20 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Institutional Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white border border-line text-xs font-semibold text-navy-500 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-leaf-500" />
            <span>South East Asian Institute of Technology, Inc.</span>
            <span className="text-navy-300">•</span>
            <span>COMELEC Student Elections</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-navy max-w-3xl mx-auto leading-tight">
            Vote for your Student Council —{" "}
            <span className="text-brand-600">securely, from anywhere</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-navy-500 max-w-2xl mx-auto leading-relaxed">
            The official SEAIT online voting platform. Eligible students cast their ballots online,
            receive a personal verification receipt, and can confirm their ballot was recorded —
            while their choices stay private.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold text-base transition-colors"
            >
              <Vote className="w-5 h-5" />
              <span>Sign In to Vote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-white hover:bg-paper text-brand-700 border border-brand-200 font-semibold text-base transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Register as Student Voter</span>
            </Link>

            <Link
              href="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-white hover:bg-paper text-navy-600 border border-line font-semibold text-base transition-colors"
            >
              <ShieldCheck className="w-5 h-5 text-leaf-600" />
              <span>Verify a Ballot Receipt</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Election Banner (live data) */}
      <OpenElectionsBanner />

      {/* 3-Step Voting Process */}
      <section className="py-14 bg-white border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Simple &amp; Verifiable
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-navy mt-2">How voting works</p>
            <p className="text-navy-400 text-sm mt-3">
              Three clear steps, designed to replace precinct queues with a verifiable online
              process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-paper border border-line">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base mb-4 border border-brand-100">
                1
              </div>
              <h3 className="text-base font-bold text-navy">Sign in with your school account</h3>
              <p className="text-sm text-navy-400 mt-2 leading-relaxed">
                Use your SEAIT Student ID and institutional email. New students register once; the
                COMELEC committee confirms eligibility per election.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-paper border border-line">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base mb-4 border border-brand-100">
                2
              </div>
              <h3 className="text-base font-bold text-navy">Select, review, and submit</h3>
              <p className="text-sm text-navy-400 mt-2 leading-relaxed">
                Choose candidates per position, review your full ballot on a confirmation screen,
                then submit. One accepted ballot per voter, enforced by the server.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-paper border border-line">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-base mb-4 border border-brand-100">
                3
              </div>
              <h3 className="text-base font-bold text-navy">Keep your receipt</h3>
              <p className="text-sm text-navy-400 mt-2 leading-relaxed">
                Receive a personal verification reference you can check anytime on the Verify page
                — without revealing your choices to anyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Institutional Integrity
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-navy mt-2">Built for trustworthy elections</p>
          <p className="text-navy-400 text-sm mt-3">
            Addressing the core problems of manual student council elections with verifiable
            technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy">Ballot privacy by design</h3>
            <p className="text-sm text-navy-400 mt-2 leading-relaxed">
              Student identity records and ballot submissions are stored in separate tables, and
              ballots are encrypted — so administrators cannot map a voter to their choices.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy">Tamper-evident commitments</h3>
            <p className="text-sm text-navy-400 mt-2 leading-relaxed">
              Each accepted ballot is sealed with a cryptographic commitment and recorded on the
              ledger, making after-the-fact alterations detectable.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy">Voter-verifiable receipts</h3>
            <p className="text-sm text-navy-400 mt-2 leading-relaxed">
              Every voter receives a unique reference to independently confirm their ballot was
              recorded — without exposing candidate selections.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy">Automated tallying</h3>
            <p className="text-sm text-navy-400 mt-2 leading-relaxed">
              Results are computed from accepted ballots when the election closes — no manual
              counting errors or delays.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy">Live turnout monitoring</h3>
            <p className="text-sm text-navy-400 mt-2 leading-relaxed">
              COMELEC officers monitor participation and departmental turnout in real time, without
              access to interim candidate totals.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-line shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-navy">Protected voter records</h3>
            <p className="text-sm text-navy-400 mt-2 leading-relaxed">
              Replaces unsecured physical logbooks with encrypted records and audit logs of every
              sensitive administrative operation.
            </p>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-14 bg-white border-t border-line">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-4 border border-brand-100">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Need help voting?</h2>
          <p className="text-sm text-navy-400 mt-2 max-w-xl mx-auto">
            Visit the Voter FAQ for step-by-step guidance, or contact the SEAIT COMELEC Committee
            or the Office of Student Affairs for account and eligibility concerns.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/faq"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors"
            >
              Read the Voter FAQ
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-paper text-navy-600 border border-line font-semibold text-sm transition-colors"
            >
              About This System
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
