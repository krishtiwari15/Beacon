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
      <div className="border-l-2 border-[#f5c518] pl-3 font-mono text-sm font-bold uppercase tracking-widest text-[#f5c518]">
        📄 AI Resume Analyzer
      </div>
      <p className="mt-2 text-sm text-zinc-400">
        Upload your resume (PDF), pick an opportunity, and get an AI match score with strengths and gaps.
      </p>

      <div className="mt-5 rounded border border-[#262626] bg-[#141414] p-5">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer text-sm text-zinc-300 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-[#2a2a2a] file:bg-[#0d0d0d] file:px-3 file:py-1.5 file:text-sm file:text-zinc-200 file:transition-colors file:duration-200 hover:file:border-[#f5c518] hover:file:text-[#f5c518]"
        />
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
          onClick={analyze}
          disabled={busy || !file || !oppId}
          className="mt-4 cursor-pointer rounded-md bg-[#f5c518] px-4 py-2 text-sm font-bold text-black transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Reading your resume…" : "📄 Analyze My Resume"}
        </button>
        {!file && <p className="mt-2 text-xs text-zinc-500">Please upload a PDF resume first.</p>}
      </div>

      {result?.error && <p className="mt-4 text-sm text-red-400">⚠️ {result.error}</p>}

      {result?.summary !== undefined && (
        <div className="mt-5 flex flex-col gap-4 rounded border border-[#262626] bg-[#141414] p-5 sm:flex-row sm:items-start">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 font-mono text-lg font-black"
            style={{ borderColor: scoreColor, color: scoreColor }}
          >
            {score}/10
          </div>
          <div className="flex-1">
            <p className="text-base text-zinc-200">{result.summary}</p>
            {!!result.strengths?.length && (
              <div className="mt-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#f5c518]">✅ Strengths</div>
                {result.strengths.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-zinc-300">• {s}</div>
                ))}
              </div>
            )}
            {!!result.gaps?.length && (
              <div className="mt-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#f5c518]">⚠️ Gaps</div>
                {result.gaps.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-zinc-300">• {s}</div>
                ))}
              </div>
            )}
            {!!result.suggestions?.length && (
              <div className="mt-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#f5c518]">💡 Suggestions</div>
                {result.suggestions.map((s, i) => (
                  <div key={i} className="mt-1 text-sm text-zinc-300">💡 {s}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
