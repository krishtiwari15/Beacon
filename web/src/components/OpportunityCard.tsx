"use client";

import { useState } from "react";
import {
  DIFF_COLORS,
  Opportunity,
  TYPE_COLORS,
  deadlineLabel,
  typeLabel,
} from "@/lib/opportunities";
import { track } from "@/lib/track";
import { computeTrustScore } from "@/lib/trustScore";
import OpportunityIntelligence from "@/components/OpportunityIntelligence";

function scoreColor(score: number): string {
  if (score >= 75) return "#2f8a52";
  if (score >= 50) return "#b58a1f";
  return "#8a8a86";
}

function ScoreBadge({ label, score, title }: { label: string; score: number; title: string }) {
  return (
    <span
      className="shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ borderColor: scoreColor(score), color: scoreColor(score) }}
      title={title}
    >
      {score}% {label}
    </span>
  );
}

export default function OpportunityCard({
  opportunity,
  saved,
  onToggleSave,
  removeMode = false,
  matchScore,
  readiness,
  children,
}: {
  opportunity: Opportunity;
  saved: boolean;
  onToggleSave: () => void;
  removeMode?: boolean;
  matchScore?: number;
  readiness?: { score: number; missing: string[] };
  children?: React.ReactNode;
}) {
  const [showIntel, setShowIntel] = useState(false);
  const [strategistOpen, setStrategistOpen] = useState(false);
  const accent = TYPE_COLORS[opportunity.type ?? ""] ?? "#336443";
  const diffColor = opportunity.difficulty ? DIFF_COLORS[opportunity.difficulty] ?? "#999" : null;
  const deadline = deadlineLabel(opportunity.deadline);
  const stipend = opportunity.stipend || "Not specified";
  const unpaid = /unpaid|volunteer|not specified|free/i.test(stipend);
  const trust = computeTrustScore(opportunity);
  const hasIntel = matchScore !== undefined || opportunity.quality_score !== null;

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {opportunity.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={opportunity.logo_url}
              alt=""
              className="h-9 w-9 shrink-0 rounded-md border border-[var(--border)] bg-white object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
          <span className="min-w-0 break-words font-serif text-lg font-semibold text-[var(--heading)]">{opportunity.title}</span>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {matchScore !== undefined && (
            <ScoreBadge label="Match" score={matchScore} title="AI-estimated fit based on your saved profile" />
          )}
          <ScoreBadge label="Trust" score={trust.score} title={`${trust.tier} — based on verifiable listing details, not AI guesswork`} />
          {opportunity.quality_score !== null && (
            <ScoreBadge label="Quality" score={opportunity.quality_score} title="AI assessment of the opportunity's intrinsic value" />
          )}
        </div>
      </div>
      <div className="mt-1 text-xs text-[var(--text-muted)]">
        {opportunity.organization} · {opportunity.category}
      </div>

      {readiness && (
        <div className="mt-2 rounded-[12px] border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
          <span className="font-semibold text-amber-800">🎯 {readiness.score}% ready</span>
          {readiness.missing.length > 0 && (
            <span className="text-amber-800"> — missing: {readiness.missing.join(", ")}</span>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {hasIntel && (
          <button
            onClick={() => setShowIntel((v) => !v)}
            className="cursor-pointer text-xs font-medium text-[var(--accent)] hover:underline"
          >
            {showIntel ? "Hide" : "Why these scores?"}
          </button>
        )}
        <button
          onClick={() => setStrategistOpen(true)}
          className="cursor-pointer text-xs font-medium text-[var(--accent)] hover:underline"
        >
          Opportunity Intelligence →
        </button>
      </div>
      {showIntel && (
        <div className="mt-2 rounded-[12px] border border-[var(--border)] bg-black/[0.015] p-3 text-xs">
          <div className="font-semibold text-[var(--text)]">
            Trust: {trust.score}% — {trust.tier}
          </div>
          <ul className="mt-1 flex flex-col gap-0.5">
            {trust.checks.map((c) => (
              <li key={c.label} className={c.passed ? "text-emerald-700" : "text-[var(--text-muted)]"}>
                {c.passed ? "✓" : "○"} {c.label}
                {!c.passed && <span className="italic"> — could not verify</span>}
              </li>
            ))}
          </ul>
          {opportunity.quality_score !== null && (
            <>
              <div className="mt-3 font-semibold text-[var(--text)]">Quality: {opportunity.quality_score}%</div>
              {opportunity.quality_summary && <p className="mt-1 text-[var(--text-muted)]">{opportunity.quality_summary}</p>}
              {!!opportunity.quality_reasons?.length && (
                <ul className="mt-1 flex flex-col gap-0.5 text-[var(--text-muted)]">
                  {opportunity.quality_reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-[10px] text-[var(--text-muted)] italic">AI-generated assessment, not a verified fact.</p>
            </>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <span
          className="rounded border px-2 py-0.5 text-[11px] font-medium tracking-wider uppercase"
          style={{ borderColor: accent, color: accent }}
        >
          {typeLabel(opportunity.type)}
        </span>
        {opportunity.difficulty && (
          <span
            className="rounded border px-2 py-0.5 text-[11px] font-medium tracking-wider uppercase"
            style={{ borderColor: diffColor ?? "#999", color: diffColor ?? "#999" }}
          >
            {opportunity.difficulty}
          </span>
        )}
        {opportunity.work_mode && (
          <span className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium tracking-wider text-[var(--text-muted)] uppercase">
            {opportunity.work_mode}
          </span>
        )}
      </div>

      <div className="mt-3 text-sm text-[var(--text-muted)]">
        {opportunity.location || "—"} &nbsp; <span className={deadline.className}>{deadline.text}</span>
      </div>
      <div className="mt-1 text-sm text-[var(--text-muted)]">
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            unpaid
              ? "border border-[var(--border)] text-[var(--text-muted)]"
              : "border border-emerald-600/30 bg-emerald-500/10 text-emerald-700"
          }`}
        >
          {stipend}
        </span>
      </div>
      {opportunity.eligibility && (
        <div className="mt-1 text-sm text-[var(--text-muted)]">
          <b>Eligibility:</b> {opportunity.eligibility}
        </div>
      )}

      {opportunity.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {opportunity.tags.map((tag) => (
            <span key={tag} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {opportunity.source_url && (
          <a
            href={opportunity.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("apply_click", opportunity.type ?? "unknown")}
            className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
          >
            Apply ↗
          </a>
        )}
        <button
          onClick={onToggleSave}
          className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
            removeMode
              ? "border border-red-500/40 text-red-600 hover:bg-red-500/10"
              : saved
                ? "border border-emerald-600/40 bg-emerald-500/10 text-emerald-700"
                : "border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
          }`}
        >
          {removeMode ? "Remove" : saved ? "✓ Saved" : "+ Save"}
        </button>
        {children}
      </div>

      {strategistOpen && (
        <OpportunityIntelligence
          opportunity={opportunity}
          matchScore={matchScore}
          open={strategistOpen}
          onClose={() => setStrategistOpen(false)}
        />
      )}
    </div>
  );
}
