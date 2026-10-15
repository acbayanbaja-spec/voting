"use client";

import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { User, Shield, GraduationCap, School, Mail, Hash } from "lucide-react";

export default function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Voter Profile</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered voter credentials verified by the SEAIT Registrar and COMELEC committee.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-4 pb-4 border-b border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-xl border border-brand-500/30">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Verified Voter
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-2">
                <Hash className="w-4 h-4 text-slate-500" />
                <span>School ID:</span>
              </span>
              <span className="font-mono font-bold text-white">{user?.schoolId}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>Institutional Email:</span>
              </span>
              <span className="font-medium text-slate-200">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-2">
                <School className="w-4 h-4 text-slate-500" />
                <span>Department / College:</span>
              </span>
              <span className="font-medium text-slate-200">{user?.department}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span>Year Level:</span>
              </span>
              <span className="font-medium text-slate-200">{user?.yearLevel}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Account managed under SEAIT Academic Data Protection Policies.
          </div>
        </div>
      </div>
    </div>
  );
}
