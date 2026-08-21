"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import ProfileResumeAnalysis from "@/components/ProfileResumeAnalysis";

type Result = {
  score?: number;
  summary?: string;
  strengths?: string[];
  gaps?: string[];
  suggestions?: string[];
  error?: string;
};

export default function ResumeAnalyzer({ user }: { user: User }) {
  const [mode, setMode] = useState<"opportunity" | "profile">("opportunity");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [oppId, setOppId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

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
  }, []);

  async function analyze() {
    if (!file || !oppId) return;
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.set("opportunity_id", String(oppId));
      form.set("resume", file);
      const res = await fetch("/api/analyze-resume", { method: "POST", body: form });
      setResult(await res.json());
    } finally {
      setBusy(false);
    }
  }

  const score = result?.score ?? 0;
  const scoreColor = score < 4 ? "#dc2626" : score < 7 ? "#b58a1f" : "#2f8a52";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        AI Resume Analyzer
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setMode("opportunity")}
          className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
            mode === "opportunity"
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]"
          }`}
        >
          Match vs. an opportunity
        </button>
        <button
          onClick={() => setMode("profile")}
          className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
            mode === "profile"
              ? "bg-[var(--accent)] text-white"
              : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]"
          }`}
        >
          Analyze my profile
        </button>
      </div>

      {mode === "profile" ? (
        <ProfileResumeAnalysis user={user} />
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Upload your resume (PDF), pick an opportunity, and get an AI match score with strengths and gaps.
          </p>

          <div className="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer text-sm text-[var(--text-muted)] file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-[var(--border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:text-[var(--text)] file:transition-colors file:duration-200 hover:file:border-[var(--accent)]"
            />
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
              onClick={analyze}
              disabled={busy || !file || !oppId}
              className="mt-4 h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Reading your resume…" : "Analyze my resume"}
            </button>
            {!file && <p className="mt-2 text-xs text-[var(--text-muted)]">Please upload a PDF resume first.</p>}
          </div>
        </>
      )}

      {mode === "opportunity" && result?.error && <p className="mt-4 text-sm text-red-600">{result.error}</p>}

      {mode === "opportunity" && result?.summary !== undefined && (
        <div className="mt-5 flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:flex-row sm:items-start">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-lg font-semibold"
            style={{ borderColor: scoreColor, color: scoreColor }}
          >
            {score}/10
          </div>
          <div className="flex-1">
            <p className="text-base text-[var(--text)]">{result.summary}</p>
            {!!result.strengths?.length && (
              <div className="mt-3">
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">✅ Strengths</div>
                {result.strengths.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-[var(--text)]">• {s}</div>
                ))}
              </div>
            )}
            {!!result.gaps?.length && (
              <div className="mt-3">
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">⚠️ Gaps</div>
                {result.gaps.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-[var(--text)]">• {s}</div>
                ))}
              </div>
            )}
            {!!result.suggestions?.length && (
              <div className="mt-3">
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">💡 Suggestions</div>
                {result.suggestions.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-[var(--text)]">💡 {s}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
