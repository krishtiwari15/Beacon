"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Opportunity, daysUntil } from "@/lib/opportunities";

export default function Planner() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("opportunities")
      .select("*")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setOpportunities((data ?? []) as Opportunity[]);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-8 text-sm text-zinc-500">Loading planner…</p>;
  if (error) return <p className="p-8 text-sm text-red-400">⚠️ {error}</p>;

  const dated = opportunities
    .map((o) => ({ o, d: daysUntil(o.deadline) }))
    .filter((x): x is { o: Opportunity; d: number } => x.d !== null);

  const thisWeek = dated.filter((x) => x.d >= 0 && x.d <= 7).length;
  const thisMonth = dated.filter((x) => x.d >= 0 && x.d <= 30).length;
  const upcoming = dated.filter((x) => x.d >= 0).length;
  const closed = dated.filter((x) => x.d < 0).length;

  const openSorted = dated.filter((x) => x.d >= 0).sort((a, b) => a.d - b.d);

  const stats: [number, string][] = [
    [thisWeek, "Due This Week"],
    [thisMonth, "Due This Month"],
    [upcoming, "Still Open"],
    [closed, "Closed"],
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([num, label]) => (
          <div key={label} className="rounded border border-t-2 border-[#262626] border-t-[#f5c518] bg-[#141414] p-4 text-center">
            <div className="font-mono text-2xl font-black text-[#f5c518]">{num}</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-zinc-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-l-2 border-[#f5c518] pl-3 font-mono text-sm font-bold uppercase tracking-widest text-[#f5c518]">
        Upcoming deadlines
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {openSorted.length === 0 ? (
          <div className="rounded border border-[#262626] bg-[#141414] p-8 text-center text-sm text-zinc-400">
            No upcoming deadlines found.
          </div>
        ) : (
          openSorted.map(({ o, d }) => {
            const [bar, cls] = d <= 7 ? ["#ff4d4d", "text-red-400"] : d <= 30 ? ["#f5c518", "text-amber-400"] : ["#34c98a", "text-emerald-400"];
            const when = d === 1 ? "1 DAY" : `${d} DAYS`;
            return (
              <div key={o.id} className="flex items-center gap-4 rounded border border-[#262626] bg-[#141414] px-4 py-3">
                <div className="h-10 w-1.5 rounded" style={{ background: bar }} />
                <div className="flex-1">
                  <div className="font-semibold text-white">{o.title}</div>
                  <div className="font-mono text-xs text-zinc-500">
                    {o.organization} · {o.deadline}
                  </div>
                </div>
                <div className={`text-right font-mono text-sm font-bold ${cls}`}>
                  {when}
                  <br />
                  LEFT
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
