"use client";

import { useEffect, useState } from "react";
import { Clock, Users } from "lucide-react";

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  return `${pad(m)}m ${pad(s)}s`;
}

export function Countdown({
  target,
  label,
}: {
  target: string;
  label: "closes in" | "opens in";
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;

  const urgent = label === "closes in" && diff < 3600_000;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border font-mono ${
        urgent
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : label === "opens in"
            ? "bg-brand-50 text-brand-700 border-brand-200"
            : "bg-leaf-50 text-leaf-700 border-leaf-200"
      }`}
      aria-live="off"
    >
      <Clock className={`w-3.5 h-3.5 ${urgent ? "animate-pulse" : ""}`} />
      <span>
        {label} {formatRemaining(diff)}
      </span>
    </span>
  );
}

export function TurnoutBar({
  cast,
  eligible,
}: {
  cast: number;
  eligible: number;
}) {
  const pct = eligible > 0 ? Math.min(100, Math.round((cast / eligible) * 100)) : 0;

  return (
    <div className="w-full" role="img" aria-label={`Voter turnout ${pct}% — ${cast} of ${eligible} ballots cast`}>
      <div className="flex items-center justify-between text-[11px] font-semibold text-navy-400 mb-1.5">
        <span className="flex items-center space-x-1.5">
          <Users className="w-3.5 h-3.5 text-brand-600" />
          <span className="uppercase tracking-wider">Live Turnout</span>
        </span>
        <span className="font-mono text-navy-600">
          {cast}/{eligible} • {pct}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-paper border border-line overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-leaf-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
