"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";

type Result = {
  verdict?: string;
  reasons?: string[];
  suggestions?: string[];
  error?: string;
};

const VERDICT_COLORS: Record<string, string> = {
  Eligible: "#34c98a",
  "Partially Eligible": "#f5c518",
  "Not Eligible": "#ff4d4d",
};

export default function Eligibility() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [oppId, setOppId] = useState<number | null>(null);
  const [age, setAge] = useState("");
  const [education, setEducation] = useState("");
  const [country, setCountry] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [skills, setSkills] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("opportunities")
      .select("*")
      .then(({ data }) => {
        const rows = (data ?? []) as Opportunity[];
        setOpportunities(rows);
        if (rows[0]) setOppId(rows[0].id);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!oppId) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: oppId, age, education, country, cgpa, skills }),
      });
      setResult(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[#f5c518] pl-3 font-mono text-sm font-bold uppercase tracking-widest text-[#f5c518]">
        🤖 AI Eligibility Checker
      </div>
      <p className="mt-2 text-sm text-zinc-400">
        Enter your profile, pick an opportunity, and let AI assess your eligibility.
      </p>

      <form onSubmit={submit} className="mt-5 rounded border border-[#262626] bg-[#141414] p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age, e.g. 20" className="rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/30" />
          <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="CGPA / GPA, e.g. 8.5" className="rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/30" />
          <input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Education / Degree, e.g. B.Tech CS, 2nd year" className="rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/30" />
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills, e.g. python, sql, ml" className="rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/30" />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country, e.g. India" className="rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/30 sm:col-span-2" />
        </div>

        <select
          value={oppId ?? ""}
          onChange={(e) => setOppId(Number(e.target.value))}
          className="mt-3 w-full cursor-pointer rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518]"
        >
          {opportunities.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title} — {o.organization}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={busy || !oppId}
          className="mt-4 cursor-pointer rounded-md bg-[#f5c518] px-4 py-2 text-sm font-bold text-black transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Asking the AI…" : "🤖 Check My Eligibility"}
        </button>
      </form>

      {result?.error && <p className="mt-4 text-sm text-red-400">⚠️ {result.error}</p>}

      {result?.verdict && (
        <div className="mt-5 rounded border-l-4 bg-[#141414] p-5" style={{ borderLeftColor: VERDICT_COLORS[result.verdict] ?? "#999" }}>
          <div className="text-lg font-bold" style={{ color: VERDICT_COLORS[result.verdict] ?? "#999" }}>
            {result.verdict}
          </div>
          {!!result.reasons?.length && (
            <div className="mt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#f5c518]">Why</div>
              {result.reasons.map((r, i) => (
                <div key={i} className="mt-1 text-sm text-zinc-300">• {r}</div>
              ))}
            </div>
          )}
          {!!result.suggestions?.length && (
            <div className="mt-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#f5c518]">Suggestions</div>
              {result.suggestions.map((s, i) => (
                <div key={i} className="mt-1 text-sm text-zinc-300">💡 {s}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
