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
  if (error) return <p className="p-8 text-sm text-red-400">⚠️ {error}</p>;

  if (rows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="rounded border border-[#262626] bg-[#141414] p-12 text-center">
          <div className="text-lg font-bold text-[#f5c518]">📋 No applications yet</div>
          <div className="mt-1 text-sm text-zinc-400">
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
          <div key={label} className="rounded border border-t-2 border-[#262626] border-t-[#f5c518] bg-[#141414] p-4 text-center transition-shadow duration-200 hover:shadow-[0_0_16px_rgba(245,197,24,0.15)]">
            <div className="glow-text font-display text-2xl font-black text-[#f5c518]">{num}</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-zinc-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 glow-text border-l-2 border-[#f5c518] pl-3 font-mono text-sm font-bold uppercase tracking-widest text-[#f5c518]">
        Your pipeline
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {rows.map((r) => (
          <OpportunityCard key={r.id} opportunity={r.opportunity} saved removeMode onToggleSave={() => remove(r.id)}>
            <select
              value={r.status}
              onChange={(e) => updateStatus(r.id, e.target.value as SavedStatus)}
              className="cursor-pointer rounded-md border border-[#2a2a2a] bg-[#141414] px-2 py-1.5 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518]"
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
