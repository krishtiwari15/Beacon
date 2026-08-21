"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import OpportunityCard from "@/components/OpportunityCard";
import CardSkeleton from "@/components/CardSkeleton";

export default function Discover({ user }: { user: User }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [matchScores, setMatchScores] = useState<Map<number, number>>(new Map());
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      setError(null);

      const [oppsRes, savedRes] = await Promise.all([
        supabase.from("opportunities").select("*").order("deadline", { ascending: true, nullsFirst: false }),
        supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id),
      ]);

      if (oppsRes.error) {
        setError(oppsRes.error.message);
      } else {
        setOpportunities(oppsRes.data as Opportunity[]);
      }
      if (!savedRes.error && savedRes.data) {
        setSavedIds(new Set(savedRes.data.map((r) => r.opportunity_id as number)));
      }
      setLoading(false);
    }

    load();

    // Cheap DB read — cached scores, no AI call on mount.
    fetch("/api/match-scores")
      .then((r) => r.json())
      .then((data) => {
        const rows = (data.scores ?? []) as { opportunity_id: number; score: number }[];
        setMatchScores(new Map(rows.map((r) => [r.opportunity_id, r.score])));
      })
      .catch(() => {});
  }, [user.id]);

  async function refreshMatches() {
    setMatching(true);
    setMatchError(null);
    try {
      const res = await fetch("/api/match-scores", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setMatchError(data.error);
      } else {
        const rows = (data.scores ?? []) as { id: number; score: number }[];
        setMatchScores(new Map(rows.map((r) => [r.id, r.score])));
      }
    } finally {
      setMatching(false);
    }
  }

  async function toggleSave(opportunityId: number) {
    const supabase = createClient();
    const isSaved = savedIds.has(opportunityId);

    // Optimistic update.
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(opportunityId);
      else next.add(opportunityId);
      return next;
    });

    if (isSaved) {
      await supabase
        .from("saved_opportunities")
        .delete()
        .eq("user_id", user.id)
        .eq("opportunity_id", opportunityId);
    } else {
      await supabase
        .from("saved_opportunities")
        .insert({ user_id: user.id, opportunity_id: opportunityId, status: "saved" });
    }
  }

  const types = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.type).filter(Boolean))) as string[],
    [opportunities],
  );
  const modes = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.work_mode).filter(Boolean))) as string[],
    [opportunities],
  );

  const filtered = opportunities.filter((o) => {
    if (search) {
      const hay = [o.title, o.organization, o.category, o.location, ...o.tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    if (typeFilter && o.type !== typeFilter) return false;
    if (modeFilter && o.work_mode !== modeFilter) return false;
    if (difficultyFilter && o.difficulty !== difficultyFilter) return false;
    return true;
  });

  if (loading) {
    return <CardSkeleton count={4} />;
  }

  if (error) {
    return <p className="p-8 text-sm text-red-600">Could not load opportunities: {error}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <input
        type="text"
        placeholder="Search title, company, skill, keyword…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
      />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="cursor-pointer rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="cursor-pointer rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
        >
          <option value="">Any work mode</option>
          {modes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="cursor-pointer rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
        >
          <option value="">Any level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"} found
        </div>
        <button
          onClick={refreshMatches}
          disabled={matching}
          className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {matching ? "Scoring your matches…" : matchScores.size > 0 ? "↻ Refresh match scores" : "✨ Get my match scores"}
        </button>
      </div>
      {matchError && <p className="mt-2 text-xs text-red-600">{matchError}</p>}

      <div className="mt-4 flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-[var(--text-muted)] backdrop-blur-md">
            No opportunities found
          </div>
        ) : (
          filtered.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              saved={savedIds.has(o.id)}
              onToggleSave={() => toggleSave(o.id)}
              matchScore={matchScores.get(o.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
