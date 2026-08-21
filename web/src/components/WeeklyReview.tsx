"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/profile";
import { Roadmap } from "@/lib/roadmap";
import { computeCareerHealth } from "@/lib/careerHealth";
import { Opportunity } from "@/lib/opportunities";

type SavedRow = { id: number; status: string; saved_at: string; opportunity: Opportunity };

const SEVEN_DAYS_MS = 7 * 86_400_000;

export default function WeeklyReview({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [accomplished, setAccomplished] = useState<string[]>([]);
  const [healthNow, setHealthNow] = useState<number | null>(null);
  const [healthWeekAgo, setHealthWeekAgo] = useState<number | null>(null);
  const [newOpportunities, setNewOpportunities] = useState(0);
  const [nextWeek, setNextWeek] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("roadmaps").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("saved_opportunities").select("id, status, saved_at, opportunity:opportunities(*)").eq("user_id", user.id),
      supabase.from("opportunities").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - SEVEN_DAYS_MS).toISOString()),
      supabase.from("mentors").select("user_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("career_health_history").select("score, recorded_at").eq("user_id", user.id).order("recorded_at", { ascending: false }),
    ]).then(async ([profileRes, roadmapRes, savedRes, oppsRes, mentorRes, historyRes]) => {
      const profile = (profileRes.data as Profile) ?? null;
      const roadmap = (roadmapRes.data as Roadmap) ?? null;
      const savedRows = (savedRes.data as unknown as SavedRow[]) ?? [];
      const applied = savedRows.filter((r) => r.status !== "saved").length;
      const interviews = savedRows.filter((r) => ["interview", "shortlisted", "accepted"].includes(r.status)).length;
      const health = computeCareerHealth(profile, roadmap, applied, interviews, !!mentorRes.data);
      setHealthNow(health.overall);

      const now = Date.now();

      // Record today's snapshot at most once. A unique (user_id, recorded_date)
      // index makes this atomic — two concurrent loads racing here both hit
      // onConflict instead of producing duplicate same-day rows.
      const history = (historyRes.data ?? []) as { score: number; recorded_at: string }[];
      await supabase
        .from("career_health_history")
        .upsert({ user_id: user.id, score: health.overall }, { onConflict: "user_id,recorded_date", ignoreDuplicates: true });

      // Closest snapshot from ~7+ days ago, or the oldest available.
      const weekAgoCandidate = history.find((h) => now - new Date(h.recorded_at).getTime() >= SEVEN_DAYS_MS - 86_400_000);
      setHealthWeekAgo(weekAgoCandidate ? weekAgoCandidate.score : null);

      // Real, dateable accomplishments only.
      const doneThisWeek = (roadmap?.stages ?? [])
        .flatMap((s) => s.tasks)
        .filter((t) => t.done && t.done_at && now - new Date(t.done_at).getTime() <= SEVEN_DAYS_MS)
        .map((t) => t.text);
      const savedThisWeek = savedRows.filter((r) => now - new Date(r.saved_at).getTime() <= SEVEN_DAYS_MS).length;
      const accomplishments = [...doneThisWeek];
      if (savedThisWeek > 0) accomplishments.push(`Saved ${savedThisWeek} new opportunit${savedThisWeek === 1 ? "y" : "ies"}`);
      setAccomplished(accomplishments);

      setNewOpportunities(oppsRes.count ?? 0);

      const incompleteTasks = (roadmap?.stages ?? []).flatMap((s) => s.tasks.filter((t) => !t.done).map((t) => t.text)).slice(0, 3);
      const next = [...incompleteTasks];
      if (next.length === 0) next.push(`Focus on improving ${health.drivingFactor.toLowerCase()} — your biggest gap right now.`);
      setNextWeek(next);

      setLoading(false);
    });
  }, [user.id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="h-64 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Your Weekly Career Review
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Based on real, dated activity from the last 7 days — roadmap task completions and saves need a
        timestamp to count, so this only grows richer the more you use Beacon week to week.
      </p>

      <div className="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
        <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">You accomplished</div>
        {accomplished.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-muted)]">Nothing dated this week yet — check off some roadmap tasks or save opportunities to build this out.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-1">
            {accomplished.map((a, i) => (
              <div key={i} className="text-sm text-[var(--text)]">✓ {a}</div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
        <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Your profile improved</div>
        <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-[var(--text)]">
          {healthWeekAgo !== null ? (
            <>
              Career Health: {healthWeekAgo} → {healthNow}
              <span className={healthNow! >= healthWeekAgo ? "text-emerald-600" : "text-red-600"}>
                ({healthNow! >= healthWeekAgo ? "+" : ""}{healthNow! - healthWeekAgo})
              </span>
            </>
          ) : (
            <span className="text-sm font-normal text-[var(--text-muted)]">Career Health: {healthNow} — check back next week for a trend.</span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
        <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">New opportunities</div>
        <div className="mt-1 text-2xl font-semibold text-[var(--text)]">{newOpportunities}</div>
        <p className="text-xs text-[var(--text-muted)]">Added to Beacon in the last 7 days.</p>
      </div>

      <div className="mt-4 rounded-[16px] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5">
        <div className="text-xs font-semibold tracking-wider text-[var(--accent)] uppercase">What you should do next week</div>
        <div className="mt-2 flex flex-col gap-1">
          {nextWeek.map((n, i) => (
            <div key={i} className="text-sm text-[var(--text)]">{i + 1}. {n}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
