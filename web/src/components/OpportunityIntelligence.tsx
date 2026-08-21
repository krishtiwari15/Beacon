"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Opportunity } from "@/lib/opportunities";
import { computeTrustScore } from "@/lib/trustScore";
import { track } from "@/lib/track";
import type { StrategistResult } from "@/lib/services/applicationStrategist";

const ALIGN_COLOR: Record<string, string> = { Strong: "#2f8a52", Medium: "#b58a1f", Weak: "#dc2626" };

function scoreColor(score: number): string {
  if (score >= 75) return "#2f8a52";
  if (score >= 50) return "#b58a1f";
  return "#8a8a86";
}

export default function OpportunityIntelligence({
  opportunity,
  matchScore,
  open,
  onClose,
}: {
  opportunity: Opportunity;
  matchScore?: number;
  open: boolean;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(StrategistResult & { matchedSkills?: string[]; gapSkills?: string[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const trust = computeTrustScore(opportunity);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function prepare() {
    setBusy(true);
    setError(null);
    track("career_view", `strategist:${opportunity.title}`);
    try {
      const res = await fetch("/api/application-strategist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunity.id }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8 transition-all duration-300 ${
        open ? "visible" : "invisible"
      }`}
    >
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[var(--text)]/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative w-full max-w-2xl rounded-[24px] border border-white/60 bg-white/97 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:p-8 ${
          open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.97] opacity-0"
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors duration-200 hover:bg-black/5 hover:text-[var(--text)]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
          Opportunity Intelligence
        </div>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--heading)]">{opportunity.title}</h2>
        <p className="text-sm text-[var(--text-muted)]">{opportunity.organization}</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {matchScore !== undefined && (
            <div className="rounded-[14px] border border-[var(--border)] p-3 text-center">
              <div className="text-lg font-semibold" style={{ color: scoreColor(matchScore) }}>{matchScore}%</div>
              <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Match</div>
            </div>
          )}
          <div className="rounded-[14px] border border-[var(--border)] p-3 text-center">
            <div className="text-lg font-semibold" style={{ color: scoreColor(trust.score) }}>{trust.score}%</div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Trust</div>
          </div>
          {opportunity.quality_score !== null && (
            <div className="rounded-[14px] border border-[var(--border)] p-3 text-center">
              <div className="text-lg font-semibold" style={{ color: scoreColor(opportunity.quality_score) }}>{opportunity.quality_score}%</div>
              <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Quality</div>
            </div>
          )}
        </div>

        {!result && (
          <div className="mt-6">
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <button
              onClick={prepare}
              disabled={busy}
              className="w-full cursor-pointer rounded-[12px] bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Analyzing your fit…" : "Prepare My Application"}
            </button>
            <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
              Runs one AI check against your saved profile — readiness, gaps, and a personalized strategy.
            </p>
          </div>
        )}

        {result && (
          <div className="mt-6 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {result.readiness !== undefined && (
                <div className="rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Your Readiness</div>
                  <div className="text-xl font-semibold" style={{ color: scoreColor(result.readiness) }}>{result.readiness}%</div>
                </div>
              )}
              {result.competition_estimate && (
                <div className="rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Competition (estimate)</div>
                  <div className="text-xl font-semibold text-[var(--text)]">{result.competition_estimate}</div>
                </div>
              )}
              {result.prep_weeks_estimate && (
                <div className="rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Prep Needed</div>
                  <div className="text-xl font-semibold text-[var(--text)]">{result.prep_weeks_estimate}</div>
                </div>
              )}
            </div>

            {(!!result.matchedSkills?.length || !!result.gapSkills?.length) && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {!!result.matchedSkills?.length && (
                  <div>
                    <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Why You Match</div>
                    {result.matchedSkills.map((s) => (
                      <div key={s} className="mt-1 text-sm text-emerald-700">✓ {s}</div>
                    ))}
                  </div>
                )}
                {!!result.gapSkills?.length && (
                  <div>
                    <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Your Gaps</div>
                    {result.gapSkills.map((s) => (
                      <div key={s} className="mt-1 text-sm text-amber-700">⚠ {s}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!!result.skill_alignment?.length && (
              <div>
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Skill Alignment</div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {result.skill_alignment.map((s) => (
                    <div key={s.skill} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text)]">{s.skill}</span>
                      <span className="font-medium" style={{ color: ALIGN_COLOR[s.level] ?? "#999" }}>{s.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!!result.resume_recommendations?.length && (
              <div>
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Resume Recommendations</div>
                {result.resume_recommendations.map((r, i) => (
                  <div key={i} className="mt-1 text-sm text-[var(--text)]">💡 {r}</div>
                ))}
              </div>
            )}

            {!!result.project_selection?.length && (
              <div>
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Project Selection</div>
                {result.project_selection.map((p, i) => (
                  <div key={i} className="mt-1 text-sm text-[var(--text)]">• {p}</div>
                ))}
              </div>
            )}

            {!!result.missing_evidence?.length && (
              <div>
                <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Missing Evidence</div>
                {result.missing_evidence.map((m, i) => (
                  <div key={i} className="mt-1 text-sm text-[var(--text)]">⚠ {m}</div>
                ))}
              </div>
            )}

            {result.strategy && (
              <div className="rounded-[14px] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="text-xs font-semibold tracking-wider text-[var(--accent)] uppercase">AI Application Strategy</div>
                <p className="mt-1 text-sm text-[var(--text)]">{result.strategy}</p>
              </div>
            )}

            <p className="text-center text-[10px] text-[var(--text-muted)] italic">
              AI-generated guidance based on your saved profile — not a guarantee of outcome.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
