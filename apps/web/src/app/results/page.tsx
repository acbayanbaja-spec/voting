"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi, Election } from "../../lib/api";
import { BarChart3, Award, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ResultsDirectoryPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchApi("/elections");
        if (res.success && res.data) {
          setElections(res.data);
        }
      } catch (err) {
        console.error("Failed to load elections:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Official Election Results
        </h1>
        <p className="mt-2 text-sm text-navy-400">
          Certified outcomes and cryptographic tallies for SEAIT Supreme Student Council Elections.
        </p>
      </div>

      {loading ? (
        <div className="h-44 rounded-2xl bg-white animate-pulse border border-line" />
      ) : elections.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-line shadow-sm">
          <BarChart3 className="w-12 h-12 text-navy-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">No Results Published</h3>
          <p className="text-xs text-navy-400 mt-1">
            Official election results will appear here once COMELEC certifies the tallies.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((el) => (
            <div
              key={el.id}
              className="p-6 rounded-2xl bg-white border border-line shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-brand-600 font-mono">
                    A.Y. {el.academicYear} • {el.semester}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-paper text-navy-500 border border-line">
                    {el.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-navy">{el.title}</h3>
                <p className="text-xs text-navy-400 mt-1">{el.description}</p>
              </div>

              <Link
                href={`/results/${el.id}`}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 flex-shrink-0"
              >
                <span>View Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
