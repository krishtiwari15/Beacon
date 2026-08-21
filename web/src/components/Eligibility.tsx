"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import { Profile } from "@/lib/profile";

type Result = {
  verdict?: string;
  reasons?: string[];
  suggestions?: string[];
  error?: string;
};

const VERDICT_COLORS: Record<string, string> = {
  Eligible: "#2f8a52",
  "Potentially Eligible": "#b58a1f",
  "Partially Eligible": "#b58a1f", // legacy label, kept in case of stale cached results
  "Not Eligible": "#dc2626",
};

const VERDICT_ICONS: Record<string, string> = {
  Eligible: "🟢",
  "Potentially Eligible": "🟡",
  "Partially Eligible": "🟡",
  "Not Eligible": "🔴",
};

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export default function Eligibility({ user }: { user: User }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [oppId, setOppId] = useState<number | null>(null);
  const [age, setAge] = useState("");
  const [education, setEducation] = useState("");
  const [country, setCountry] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [skills, setSkills] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [fromProfile, setFromProfile] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("opportunities")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(300)
      .then(({ data }) => {
        const rows = (data ?? []) as Opportunity[];
        setOpportunities(rows);
        if (rows[0]) setOppId(rows[0].id);
      });

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const p = data as Profile;
        setAge(p.age ?? "");
        setEducation(p.education ?? "");
        setCountry(p.country ?? "");
        setCgpa(p.cgpa ?? "");
        setSkills((p.skills ?? []).join(", "));
        setFromProfile(true);
      });
  }, [user.id]);

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
        {fromProfile
          ? "Pre-filled from your saved profile — edit anything below, pick an opportunity, and let AI assess your eligibility."
          : "Enter your profile, pick an opportunity, and let AI assess your eligibility. Tip: save this info once on the Profile tab and it'll be pre-filled here next time."}
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
            {VERDICT_ICONS[result.verdict] ?? ""} {result.verdict}
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
