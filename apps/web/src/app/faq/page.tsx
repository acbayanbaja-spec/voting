import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowRight, ShieldCheck, Vote } from "lucide-react";

export default function FaqPage() {
  const faqs = [
    {
      q: "Who is eligible to vote in the Student Council elections?",
      a: "All officially enrolled students of South East Asian Institute of Technology, Inc. who appear on the verified voter roster certified by the COMELEC committee and school registrar are eligible.",
    },
    {
      q: "Can I change my vote after submitting my ballot?",
      a: "No. Once confirmed, your ballot selections are cryptographically committed to the blockchain ledger. To safeguard election integrity, cast ballots cannot be modified or replaced.",
    },
    {
      q: "What do I do if I lose my Verification Reference?",
      a: "If you lose your Verification Reference, log back into the Student Portal. Your unique verification reference remains securely linked to your voter status profile so you can verify your receipt anytime.",
    },
    {
      q: "What device or browser do I need to vote?",
      a: "You can cast your ballot from any standard desktop, laptop, tablet, or smartphone with an active internet connection using Chrome, Safari, Edge, or Firefox.",
    },
    {
      q: "How does the system ensure the vote count is accurate?",
      a: "When an election closes, the automated tally procedure computes candidate votes and generates a SHA-256 results commitment hash sealed onto the smart contract. Independent auditors and student leaders can verify the final tally against the immutable ledger.",
    },
    {
      q: "Who should I contact if I encounter difficulties logging in?",
      a: "Please contact the SEAIT Commission on Elections (COMELEC) office or send an email through your official student portal support channel.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Voter Help Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy">Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-navy-400">
          Everything you need to know about participating in SEAIT online student elections.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-white border border-line shadow-sm space-y-2">
            <h3 className="text-base font-bold text-navy">{faq.q}</h3>
            <p className="text-xs sm:text-sm text-navy-400 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-2xl bg-paper border border-line text-center text-xs text-navy-400">
        <p>Ready to participate in the active Student Council election?</p>
        <Link
          href="/auth/login"
          className="mt-3 inline-flex items-center space-x-1.5 text-brand-600 hover:text-brand-700 font-semibold text-sm"
        >
          <span>Sign In to Student Portal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
