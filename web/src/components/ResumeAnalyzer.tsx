"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";

type Result = {
  score?: number;
  summary?: string;
  strengths?: string[];
  gaps?: string[];
  suggestions?: string[];
  error?: string;
};

export default function ResumeAnalyzer() {
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
  const scoreColor = score < 4 ? "#ff4d4d" : score < 7 ? "#f5c518" : "#34c98a";

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-white pl-3 text-sm font-[450] tracking-widest text-white uppercase">
        AI Resume Analyzer
      </div>
      <p className="mt-2 text-sm text-white/50">
        Upload your resume (PDF), pick an opportunity, and get an AI match score with strengths and gaps.
      </p>

      <div className="mt-5 rounded-[16px] border border-white/[0.08] bg-[rgba(17,16,15,0.35)] p-5 backdrop-blur-[20px]">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer text-sm text-white/70 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-white/15 file:bg-white/5 file:px-3 file:py-1.5 file:text-sm file:text-white file:transition-colors file:duration-200 hover:file:border-white/40"
        />
        <select
          value={oppId ?? ""}
          onChange={(e) => setOppId(Number(e.target.value))}
          className="mt-3 w-full cursor-pointer rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors duration-200 focus:border-white/40"
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
          className="mt-4 h-[46px] cursor-pointer rounded-[12px] bg-[#E9E9E9] px-4 text-sm font-[450] text-[#0A0707] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Reading your resume…" : "Analyze my resume"}
        </button>
        {!file && <p className="mt-2 text-xs text-white/40">Please upload a PDF resume first.</p>}
      </div>

      {result?.error && <p className="mt-4 text-sm text-red-400">{result.error}</p>}

      {result?.summary !== undefined && (
        <div className="mt-5 flex flex-col gap-4 rounded-[16px] border border-white/[0.08] bg-[rgba(17,16,15,0.35)] p-5 backdrop-blur-[20px] sm:flex-row sm:items-start">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-lg font-[450]"
            style={{ borderColor: scoreColor, color: scoreColor }}
          >
            {score}/10
          </div>
          <div className="flex-1">
            <p className="text-base text-white/90">{result.summary}</p>
            {!!result.strengths?.length && (
              <div className="mt-3">
                <div className="text-xs font-[450] tracking-wider text-white/60 uppercase">✅ Strengths</div>
                {result.strengths.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-white/80">• {s}</div>
                ))}
              </div>
            )}
            {!!result.gaps?.length && (
              <div className="mt-3">
                <div className="text-xs font-[450] tracking-wider text-white/60 uppercase">⚠️ Gaps</div>
                {result.gaps.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-white/80">• {s}</div>
                ))}
              </div>
            )}
            {!!result.suggestions?.length && (
              <div className="mt-3">
                <div className="text-xs font-[450] tracking-wider text-white/60 uppercase">💡 Suggestions</div>
                {result.suggestions.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-white/80">💡 {s}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
