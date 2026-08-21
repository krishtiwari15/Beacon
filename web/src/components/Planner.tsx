"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Opportunity, daysUntil } from "@/lib/opportunities";
import CardSkeleton from "@/components/CardSkeleton";

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

  if (loading) return <CardSkeleton count={3} />;
  if (error) return <p className="p-8 text-sm text-red-600">{error}</p>;

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
          <div key={label} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md transition-shadow duration-200 hover:shadow-md">
            <div className="text-2xl font-semibold text-[var(--text)]">{num}</div>
            <div className="mt-1 text-[11px] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Upcoming deadlines
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {openSorted.length === 0 ? (
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
            No upcoming deadlines found.
          </div>
        ) : (
          openSorted.map(({ o, d }) => {
            const [bar, cls] = d <= 7 ? ["#dc2626", "text-red-600"] : d <= 30 ? ["#b58a1f", "text-amber-600"] : ["#2f8a52", "text-emerald-700"];
            const when = d === 1 ? "1 DAY" : `${d} DAYS`;
            return (
              <div key={o.id} className="flex items-center gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 backdrop-blur-md">
                <div className="h-10 w-1.5 rounded" style={{ background: bar }} />
                <div className="flex-1">
                  <div className="font-medium text-[var(--text)]">{o.title}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {o.organization} · {o.deadline}
                  </div>
                </div>
                <div className={`text-right text-sm font-semibold ${cls}`}>
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
