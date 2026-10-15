import React from "react";
import { Lock, ShieldCheck, EyeOff, Key, Database, Cpu } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>Cryptographic Ballot Secrecy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Privacy & Verification Architecture</h1>
        <p className="mt-2 text-sm text-slate-400">
          How South East Asian Institute of Technology, Inc. guarantees individual ballot confidentiality while preserving public auditability.
        </p>
      </div>

      <div className="space-y-8 text-xs text-slate-300 leading-relaxed">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <EyeOff className="w-4 h-4 text-brand-400" />
            <span>1. Strict Architectural Separation of Identity and Ballots</span>
          </h2>
          <p>
            In conventional manual voting, a voter&apos;s physical presence at a precinct is recorded in a single roster alongside their ballot stub. In our system, authentication and eligibility checks are strictly segregated from ballot data.
          </p>
          <p className="text-slate-400">
            When a student submits their ballot, the system records that the voter has participated in order to prevent duplicate voting. However, the ballot submission itself contains <strong>no user ID, school ID, or student reference</strong>. Database rows containing candidate choices cannot be linked back to individual voter accounts.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span>2. Cryptographic Salt & Commitment Scheme</span>
          </h2>
          <p>
            Storing raw hashes of candidate selections alone would allow an attacker to guess ballot choices through a rainbow table attack because the number of candidate combinations in a student election is finite.
          </p>
          <p className="text-slate-400">
            To prevent this, every ballot is combined with a 256-bit cryptographically secure pseudorandom salt before generating the commitment hash (SHA-256). Observers inspecting the public blockchain ledger see only high-entropy commitment hashes, making it mathematically infeasible to deduce the voter&apos;s choices.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>3. Immutable Smart Contract Ledger</span>
          </h2>
          <p>
            The EVM smart contract acts as an authoritative, append-only ledger of vote commitments and election finalization proofs. Once sealed into a block, commitments cannot be altered or removed.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>4. Receipt-Freeness and Coercion Resistance</span>
          </h2>
          <p>
            The Verification Reference given to each student allows them to verify that their ballot was received and counted. Crucially, the public receipt <strong>never reveals which candidates were selected</strong>. This protects students against voter coercion and vote-buying, as voters cannot produce a certified receipt proving to a third party how they voted.
          </p>
        </div>
      </div>
    </div>
  );
}
