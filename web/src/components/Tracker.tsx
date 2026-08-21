"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity, STATUS_LABELS, STATUS_OPTIONS, SavedStatus } from "@/lib/opportunities";
import OpportunityCard from "@/components/OpportunityCard";
import CardSkeleton from "@/components/CardSkeleton";

type SavedRow = {
  id: number;
  status: SavedStatus;
  opportunity: Opportunity;
};

export default function Tracker({ user }: { user: User }) {
  const [rows, setRows] = useState<SavedRow[]>([]);
  const [matchScores, setMatchScores] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("saved_opportunities")
      .select("id, status, opportunity:opportunities(*)")
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
  }

  async function remove(savedId: number) {
    setRows((prev) => prev.filter((r) => r.id !== savedId));
    const supabase = createClient();
    await supabase.from("saved_opportunities").delete().eq("id", savedId);
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

  const total = rows.length;
  const applied = rows.filter((r) => ["applied", "interview", "rejected", "accepted"].includes(r.status)).length;
  const interviews = rows.filter((r) => r.status === "interview").length;
  const accepted = rows.filter((r) => r.status === "accepted").length;
  const acceptRate = applied ? `${Math.round((accepted / applied) * 100)}%` : "—";

  const stats: [number | string, string][] = [
    [total, "Saved"],
    [applied, "Applied"],
    [interviews, "Interviews"],
    [acceptRate, "Accept Rate"],
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([num, label]) => (
          <div key={label} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md transition-shadow duration-200 hover:shadow-md">
            <div className="text-2xl font-semibold text-[var(--text)]">{num}</div>
            <div className="mt-1 text-[11px] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Your pipeline
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {rows.map((r) => (
          <OpportunityCard
            key={r.id}
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
        ))}
      </div>
    </div>
  );
}
