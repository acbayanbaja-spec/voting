"use client";

import React, { useEffect, useState } from "react";
import { fetchApi, Election } from "../../lib/api";
import { User, Award, Shield, FileText } from "lucide-react";

export default function CandidatesDirectoryPage() {
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi("/elections");
        if (res.success && res.data && res.data.length > 0) {
          // Fetch full election with positions and candidates
          const detailRes = await fetchApi(`/elections/${res.data[0].id}`);
          if (detailRes.success && detailRes.data) {
            setElection(detailRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to load candidates:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Candidate Directory</h1>
        <p className="mt-2 text-sm text-slate-400">
          Official candidates certified by COMELEC for the SEAIT Supreme Student Council Elections.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : !election || !election.positions || election.positions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Candidates Certified</h3>
          <p className="text-xs text-slate-400 mt-1">
            Candidate filing or certification is currently ongoing with the COMELEC committee.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {election.positions.map((position) => (
            <div key={position.id} className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <h2 className="text-xl font-bold text-white">{position.title}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {position.candidates.length} {position.candidates.length === 1 ? "Candidate" : "Candidates"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {position.candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 overflow-hidden flex-shrink-0 relative border border-slate-700">
                          {cand.photoUrl ? (
                            <img
                              src={cand.photoUrl}
                              alt={cand.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <User className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white">{cand.fullName}</h3>
                          <p className="text-xs text-brand-400 font-semibold mt-0.5">
                            {cand.partyList || "Independent Candidate"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">ID: {cand.studentId}</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-4">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                          <FileText className="w-3.5 h-3.5 text-brand-400" />
                          <span>Candidate Platform & Objectives</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                          "{cand.platform}"
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        <span>COMELEC Verified Profile</span>
                      </span>
                      <span>Position: {position.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
