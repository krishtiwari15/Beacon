"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import CardSkeleton from "@/components/CardSkeleton";

type Resources = { resources?: string[]; certifications?: string[]; projects?: string[]; error?: string };

export default function Skills() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [resourceCache, setResourceCache] = useState<Record<string, Resources>>({});
  const [fetchingResources, setFetchingResources] = useState(false);

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

  const skillCounts = useMemo(() => {
    const counts = new Map<string, number>();
    opportunities.forEach((o) => o.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [opportunities]);

  const matchingOpportunities = useMemo(
    () => (selected ? opportunities.filter((o) => o.tags.includes(selected)) : []),
    [selected, opportunities],
  );

  async function selectSkill(skill: string) {
    setSelected(skill);
    if (resourceCache[skill] || fetchingResources) return;
    setFetchingResources(true);
    try {
      const res = await fetch("/api/skill-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill }),
      });
      const data = await res.json();
      setResourceCache((prev) => ({ ...prev, [skill]: data }));
    } finally {
      setFetchingResources(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <CardSkeleton count={2} />
      </div>
    );
  }

  const resources = selected ? resourceCache[selected] : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Skill → Opportunity Graph
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Real skills pulled from real opportunities on Beacon. Click one to see how many opportunities it
        unlocks, plus AI-suggested ways to learn it.
      </p>

      {skillCounts.length === 0 ? (
        <div className="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
          No tagged skills found in the current opportunities.
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {skillCounts.map(([skill, count]) => (
            <button
              key={skill}
              onClick={() => selectSkill(skill)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                selected === skill
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
              }`}
            >
              {skill} <span className="opacity-70">· {count}</span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
            <div className="font-serif text-lg font-semibold text-[var(--heading)]">{selected}</div>
            <div className="mt-1 text-sm text-[var(--text-muted)]">
              Unlocks {matchingOpportunities.length} opportunit{matchingOpportunities.length === 1 ? "y" : "ies"} right now.
            </div>

            {fetchingResources && !resources ? (
              <div className="mt-3 text-sm text-[var(--text-muted)]">Getting AI suggestions…</div>
            ) : resources?.error ? (
              <p className="mt-3 text-sm text-red-600">{resources.error}</p>
            ) : resources ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  ["📚 Ways to learn this", resources.resources],
                  ["🎓 Certifications", resources.certifications],
                  ["🛠️ Project ideas", resources.projects],
                ].map(([title, items]) => (
                  <div key={title as string}>
                    <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">{title}</div>
                    {!items || (items as string[]).length === 0 ? (
                      <div className="mt-1 text-sm text-[var(--text-muted)]">—</div>
                    ) : (
                      (items as string[]).map((it, i) => (
                        <div key={i} className="mt-1 text-sm text-[var(--text)]">
                          • {it}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {matchingOpportunities.length > 0 && (
            <div>
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                Opportunities unlocked by {selected}
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {matchingOpportunities.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm backdrop-blur-md">
                    <span className="truncate text-[var(--text)]">{o.title}</span>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">{o.organization}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
