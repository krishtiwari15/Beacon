"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import CardSkeleton from "@/components/CardSkeleton";

// Best-effort region label from the free-text location field — real data
// only, no fabricated coordinates. Most locations are "City, Country" or a
// single region name like "Remote" / "Global" / "Europe".
function regionOf(location: string | null): string {
  if (!location) return "Unspecified";
  const trimmed = location.trim();
  if (/remote/i.test(trimmed)) return "Remote";
  const parts = trimmed.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || trimmed;
}

export default function GlobalMap() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<string | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [fundedOnly, setFundedOnly] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("opportunities")
      .select("*")
      .then(({ data }) => {
        setOpportunities((data ?? []) as Opportunity[]);
        setLoading(false);
      });
  }, []);

  const filteredBase = useMemo(
    () =>
      opportunities.filter((o) => {
        if (remoteOnly && o.work_mode !== "Remote") return false;
        if (fundedOnly) {
          const stipend = o.stipend || "";
          if (/unpaid|volunteer|not specified|free/i.test(stipend)) return false;
        }
        return true;
      }),
    [opportunities, remoteOnly, fundedOnly],
  );

  const regionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredBase.forEach((o) => {
      const r = regionOf(o.location);
      counts.set(r, (counts.get(r) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredBase]);

  const inRegion = region ? filteredBase.filter((o) => regionOf(o.location) === region) : [];

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <CardSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-center gap-2 border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        <Globe2 className="h-4 w-4" /> Global Opportunities
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Explore real Beacon opportunities grouped by region — pulled directly from listing locations.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--text)]">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="h-4 w-4 cursor-pointer accent-[var(--accent)]" />
          Remote only
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={fundedOnly} onChange={(e) => setFundedOnly(e.target.checked)} className="h-4 w-4 cursor-pointer accent-[var(--accent)]" />
          Paid / funded only
        </label>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {regionCounts.map(([r, count]) => (
          <button
            key={r}
            onClick={() => setRegion(region === r ? null : r)}
            className={`cursor-pointer rounded-[14px] border p-4 text-left transition-colors duration-200 ${
              region === r ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] backdrop-blur-md hover:border-[var(--accent)]"
            }`}
          >
            <div className="text-sm font-semibold">{r}</div>
            <div className={`text-xs ${region === r ? "text-white/80" : "text-[var(--text-muted)]"}`}>
              {count} opportunit{count === 1 ? "y" : "ies"}
            </div>
          </button>
        ))}
      </div>

      {region && (
        <div className="mt-6">
          <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Opportunities in {region}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {inRegion.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm backdrop-blur-md">
                <span className="truncate text-[var(--text)]">{o.title}</span>
                <span className="shrink-0 text-xs text-[var(--text-muted)]">{o.organization} · {o.work_mode}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
