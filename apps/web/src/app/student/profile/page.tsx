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
          <h1 className="text-2xl sm:text-3xl font-bold text-navy">Student Voter Profile</h1>
          <p className="text-xs text-navy-400 mt-1">
            Registered voter credentials verified by the SEAIT Registrar and COMELEC committee.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-line shadow-sm space-y-4">
          <div className="flex items-center space-x-4 pb-4 border-b border-line">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xl border border-brand-200">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy">
                {user?.firstName} {user?.lastName}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-leaf-50 text-leaf-700 border border-leaf-200 font-medium">
                Verified Voter
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-paper border border-line">
              <span className="text-navy-400 flex items-center space-x-2">
                <Hash className="w-4 h-4 text-navy-400" />
                <span>School ID:</span>
              </span>
              <span className="font-mono font-bold text-navy">{user?.schoolId}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-paper border border-line">
              <span className="text-navy-400 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-navy-400" />
                <span>Institutional Email:</span>
              </span>
              <span className="font-medium text-navy-600">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-paper border border-line">
              <span className="text-navy-400 flex items-center space-x-2">
                <School className="w-4 h-4 text-navy-400" />
                <span>Department / College:</span>
              </span>
              <span className="font-medium text-navy-600">{user?.department}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-paper border border-line">
              <span className="text-navy-400 flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-navy-400" />
                <span>Year Level:</span>
              </span>
              <span className="font-medium text-navy-600">{user?.yearLevel}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-line text-[11px] text-navy-400">
            Account managed under SEAIT Academic Data Protection Policies.
          </div>
        </div>
      </div>
    </div>
  );
}
