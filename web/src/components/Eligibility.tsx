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
  Eligible: "#2f8a52",
  "Partially Eligible": "#b58a1f",
  "Not Eligible": "#dc2626",
};

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

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
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        AI Eligibility Checker
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Enter your profile, pick an opportunity, and let AI assess your eligibility.
      </p>

      <form
        onSubmit={submit}
        className="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age, e.g. 20" className={inputClass} />
          <input value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="CGPA / GPA, e.g. 8.5" className={inputClass} />
          <input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Education / Degree, e.g. B.Tech CS, 2nd year" className={inputClass} />
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills, e.g. python, sql, ml" className={inputClass} />
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country, e.g. India" className={`${inputClass} sm:col-span-2`} />
        </div>

        <select
          value={oppId ?? ""}
          onChange={(e) => setOppId(Number(e.target.value))}
          className="mt-3 w-full cursor-pointer rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
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
          className="mt-4 h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Asking the AI…" : "Check my eligibility"}
        </button>
      </form>

      {result?.error && <p className="mt-4 text-sm text-red-600">{result.error}</p>}

      {result?.verdict && (
        <div
          className="mt-5 rounded-[16px] border-l-4 bg-[var(--surface)] p-5 backdrop-blur-md"
          style={{ borderLeftColor: VERDICT_COLORS[result.verdict] ?? "#999" }}
        >
          <div className="text-lg font-semibold" style={{ color: VERDICT_COLORS[result.verdict] ?? "#999" }}>
            {result.verdict}
          </div>
          {!!result.reasons?.length && (
            <div className="mt-3">
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Why</div>
              {result.reasons.map((r, i) => (
                <div key={i} className="mt-1 text-sm text-[var(--text)]">• {r}</div>
              ))}
            </div>
          )}
          {!!result.suggestions?.length && (
            <div className="mt-3">
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Suggestions</div>
              {result.suggestions.map((s, i) => (
                <div key={i} className="mt-1 text-sm text-[var(--text)]">💡 {s}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
