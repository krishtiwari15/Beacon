"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  FUNNEL_STAGES,
  Opportunity,
  STAGE_RANK,
  STATUS_LABELS,
  STATUS_OPTIONS,
  SavedStatus,
} from "@/lib/opportunities";
import OpportunityCard from "@/components/OpportunityCard";
import CardSkeleton from "@/components/CardSkeleton";
import type { CategoryStat } from "@/lib/services/applicationAnalytics";

type SavedRow = {
  id: number;
  status: SavedStatus;
  rejection_stage: string | null;
  rejection_reason: string | null;
  interview_feedback: string | null;
  recruiter_feedback: string | null;
  opportunity: Opportunity;
};

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  shortlisted: "Shortlisted",
};

function reachedStage(row: SavedRow, stage: (typeof FUNNEL_STAGES)[number]): boolean {
  const target = STAGE_RANK[stage];
  if (row.status === "rejected") {
    if (!row.rejection_stage) return stage === "applied"; // unspecified — assume dropped right after applying
    return STAGE_RANK[row.rejection_stage] >= target;
  }
  return (STAGE_RANK[row.status] ?? 0) >= target;
}

export default function Tracker({ user }: { user: User }) {
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [matchScores, setMatchScores] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionFormFor, setRejectionFormFor] = useState<number | null>(null);
  const [insights, setInsights] = useState<string[] | null>(null);
  const [insightsBusy, setInsightsBusy] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("saved_opportunities")
      .select("id, status, rejection_stage, rejection_reason, interview_feedback, recruiter_feedback, opportunity:opportunities(*)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setRows((data ?? []) as unknown as SavedRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Cheap cached read — no AI call. Refreshed from the Discover tab.
    fetch("/api/match-scores")
      .then((r) => r.json())
      .then((data) => {
        const scoreRows = (data.scores ?? []) as { opportunity_id: number; score: number }[];
        setMatchScores(new Map(scoreRows.map((r) => [r.opportunity_id, r.score])));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function updateStatus(savedId: number, status: SavedStatus) {
    setRows((prev) => prev.map((r) => (r.id === savedId ? { ...r, status } : r)));
    const supabase = createClient();
    await supabase.from("saved_opportunities").update({ status }).eq("id", savedId);
    if (status === "rejected") setRejectionFormFor(savedId);
  }

  async function saveRejectionDetails(
    savedId: number,
    fields: { rejection_stage: string; rejection_reason: string; interview_feedback: string; recruiter_feedback: string },
  ) {
    setRows((prev) => prev.map((r) => (r.id === savedId ? { ...r, ...fields, rejection_stage: fields.rejection_stage || null } as SavedRow : r)));
    const supabase = createClient();
    await supabase
      .from("saved_opportunities")
      .update({
        rejection_stage: fields.rejection_stage || null,
        rejection_reason: fields.rejection_reason || null,
        interview_feedback: fields.interview_feedback || null,
        recruiter_feedback: fields.recruiter_feedback || null,
      })
      .eq("id", savedId);
    setRejectionFormFor(null);
  }

  async function remove(savedId: number) {
    setActionError(null);
    const removed = rows.find((r) => r.id === savedId);
    setRows((prev) => prev.filter((r) => r.id !== savedId));
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("saved_opportunities").delete().eq("id", savedId);
    if (deleteError) {
      setActionError("Couldn't remove that — please try again.");
      if (removed) setRows((prev) => [...prev, removed]);
    }
  }

  const funnel: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    FUNNEL_STAGES.forEach((stage) => {
      counts[stage] = rows.filter((r) => reachedStage(r, stage)).length;
    });
    counts.rejections = rows.filter((r) => r.status === "rejected").length;
    return counts;
  }, [rows]);

  const categoryStats: CategoryStat[] = useMemo(() => {
    const byCategory = new Map<string, SavedRow[]>();
    rows.forEach((r) => {
      const cat = r.opportunity.category || r.opportunity.type || "Other";
      byCategory.set(cat, [...(byCategory.get(cat) ?? []), r]);
    });
    return Array.from(byCategory.entries())
      .map(([category, catRows]) => {
        const applied = catRows.filter((r) => reachedStage(r, "applied")).length;
        const interviewed = catRows.filter((r) => reachedStage(r, "interview")).length;
        return { category, applied, interviewRate: applied > 0 ? Math.round((interviewed / applied) * 100) : 0 };
      })
      .filter((c) => c.applied > 0)
      .sort((a, b) => b.applied - a.applied);
  }, [rows]);

  const rejectionPatterns = useMemo(() => {
    const reasons = rows
      .filter((r) => r.status === "rejected" && r.rejection_reason)
      .map((r) => r.rejection_reason as string);
    return reasons;
  }, [rows]);

  async function generateInsights() {
    setInsightsBusy(true);
    setInsightsError(null);
    try {
      const res = await fetch("/api/application-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applications: funnel.applied ?? 0,
          assessments: funnel.assessment ?? 0,
          interviews: funnel.interview ?? 0,
          shortlisted: funnel.shortlisted ?? 0,
          offers: funnel.accepted ?? 0,
          rejections: funnel.rejections,
          categoryStats,
          rejectionReasons: rejectionPatterns,
        }),
      });
      const data = await res.json();
      if (data.error) setInsightsError(data.error);
      else setInsights(data.insights ?? []);
    } finally {
      setInsightsBusy(false);
    }
  }

  if (loading) return <CardSkeleton count={2} />;
  if (error) return <p className="p-8 text-sm text-red-600">{error}</p>;

  if (rows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-12 text-center backdrop-blur-md">
          <div className="text-lg font-semibold text-[var(--text)]">No applications yet</div>
          <div className="mt-1 text-sm text-[var(--text-muted)]">
            Go to Discover and save some opportunities to start tracking.
          </div>
        </div>
      </div>
    );
  }

  const funnelStats: [number, string][] = [
    [funnel.applied ?? 0, "Applications"],
    [funnel.assessment ?? 0, "Assessments"],
    [funnel.interview ?? 0, "Interviews"],
    [funnel.shortlisted ?? 0, "Shortlisted"],
    [funnel.accepted ?? 0, "Offers"],
  ];
  const applied = funnel.applied ?? 0;
  const interviewRate = applied ? Math.round(((funnel.interview ?? 0) / applied) * 100) : 0;
  const offerRate = applied ? Math.round(((funnel.accepted ?? 0) / applied) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Application Analytics
      </div>
      {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {funnelStats.map(([num, label]) => (
          <div key={label} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md transition-shadow duration-200 hover:shadow-md">
            <div className="text-2xl font-semibold text-[var(--text)]">{num}</div>
            <div className="mt-1 text-[11px] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-3 text-center">
          <div className="text-lg font-semibold text-[var(--text)]">{interviewRate}%</div>
          <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Interview Rate</div>
        </div>
        <div className="rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-3 text-center">
          <div className="text-lg font-semibold text-[var(--text)]">{offerRate}%</div>
          <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Offer Rate</div>
        </div>
      </div>

      {categoryStats.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">By category</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {categoryStats.map((c) => (
              <div key={c.category} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm backdrop-blur-md">
                <span className="min-w-0 break-words text-[var(--text)]">{c.category}</span>
                <span className="shrink-0 text-[var(--text-muted)]">
                  {c.applied} applied · {c.interviewRate}% interview rate
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectionPatterns.length > 0 && (
        <div className="mt-6 rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-4">
          <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Rejection reasons you&apos;ve logged ({rejectionPatterns.length})
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {rejectionPatterns.map((r, i) => (
              <div key={i} className="text-sm text-[var(--text)]">• {r}</div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={generateInsights}
          disabled={insightsBusy || applied === 0}
          className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {insightsBusy ? "Analyzing…" : "✨ Generate AI insights"}
        </button>
        {insightsError && <p className="mt-2 text-xs text-red-600">{insightsError}</p>}
        {insights && (
          <div className="mt-3 flex flex-col gap-2">
            {insights.map((ins, i) => (
              <div key={i} className="rounded-[12px] border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-2 text-sm text-[var(--text)]">
                {ins}
              </div>
            ))}
            <p className="text-[10px] text-[var(--text-muted)] italic">AI-generated insights based on your tracked application data.</p>
          </div>
        )}
      </div>

      <div className="mt-8 border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Your pipeline
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.id}>
            <OpportunityCard
              opportunity={r.opportunity}
              saved
              removeMode
              onToggleSave={() => remove(r.id)}
              matchScore={matchScores.get(r.opportunity.id)}
            >
              <select
                value={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value as SavedStatus)}
                className="cursor-pointer rounded-md border border-[var(--border)] bg-black/[0.02] px-2 py-1.5 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </OpportunityCard>

            {r.status === "rejected" && (rejectionFormFor === r.id || r.rejection_reason || r.rejection_stage) && (
              <RejectionForm
                row={r}
                onSave={(fields) => saveRejectionDetails(r.id, fields)}
                onSkip={() => setRejectionFormFor(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RejectionForm({
  row,
  onSave,
  onSkip,
}: {
  row: SavedRow;
  onSave: (fields: { rejection_stage: string; rejection_reason: string; interview_feedback: string; recruiter_feedback: string }) => void;
  onSkip: () => void;
}) {
  const [stage, setStage] = useState(row.rejection_stage ?? "");
  const [reason, setReason] = useState(row.rejection_reason ?? "");
  const [interviewFeedback, setInterviewFeedback] = useState(row.interview_feedback ?? "");
  const [recruiterFeedback, setRecruiterFeedback] = useState(row.recruiter_feedback ?? "");

  const inputClass =
    "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]";

  return (
    <div className="mt-2 rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-4">
      <p className="text-xs text-[var(--text-muted)]">
        Optional — help Beacon spot patterns in your rejections. Nothing here is guessed; only what you tell us.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select value={stage} onChange={(e) => setStage(e.target.value)} className={`${inputClass} cursor-pointer`}>
          <option value="">Rejected at which stage?</option>
          {Object.entries(STAGE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection reason, if known" className={inputClass} />
        <input value={interviewFeedback} onChange={(e) => setInterviewFeedback(e.target.value)} placeholder="Interview feedback, if any" className={inputClass} />
        <input value={recruiterFeedback} onChange={(e) => setRecruiterFeedback(e.target.value)} placeholder="Recruiter feedback, if any" className={inputClass} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSave({ rejection_stage: stage, rejection_reason: reason, interview_feedback: interviewFeedback, recruiter_feedback: recruiterFeedback })}
          className="cursor-pointer rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
        >
          Save
        </button>
        <button onClick={onSkip} className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
          Skip
        </button>
      </div>
    </div>
  );
}
