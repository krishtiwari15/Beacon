"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity, daysUntil } from "@/lib/opportunities";
import { Profile } from "@/lib/profile";
import { Roadmap, roadmapProgress } from "@/lib/roadmap";
import { computeCareerHealth } from "@/lib/careerHealth";
import OpportunityCard from "@/components/OpportunityCard";
import CardSkeleton from "@/components/CardSkeleton";

type SavedRow = { id: number; status: string; opportunity: Opportunity };

function profileStrength(p: Profile | null): number {
  if (!p) return 0;
  const fields = [p.full_name, p.education, p.skills?.length ? "x" : "", p.interests, p.career_goal, p.location, p.work_mode, p.age, p.cgpa, p.country];
  const filled = fields.filter((f) => f && f.trim?.() !== "").length;
  return Math.round((filled / fields.length) * 100);
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [savedRows, setSavedRows] = useState<SavedRow[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [matchScores, setMatchScores] = useState<Map<number, number>>(new Map());
  const [hasMentorListing, setHasMentorListing] = useState(false);

  const name = (user.user_metadata?.name as string | undefined) || user.email?.split("@")[0] || "there";

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("roadmaps").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("saved_opportunities")
        .select("id, status, opportunity:opportunities(*)")
        .eq("user_id", user.id),
      supabase.from("opportunities").select("*").order("deadline", { ascending: true, nullsFirst: false }),
      fetch("/api/match-scores").then((r) => r.json()),
      supabase.from("mentors").select("user_id").eq("user_id", user.id).maybeSingle(),
    ]).then(([profileRes, roadmapRes, savedRes, oppsRes, matchesJson, mentorRes]) => {
      setProfile((profileRes.data as Profile) ?? null);
      setRoadmap((roadmapRes.data as Roadmap) ?? null);
      setSavedRows((savedRes.data as unknown as SavedRow[]) ?? []);
      setOpportunities((oppsRes.data as Opportunity[]) ?? []);
      const rows = (matchesJson.scores ?? []) as { opportunity_id: number; score: number }[];
      setMatchScores(new Map(rows.map((r) => [r.opportunity_id, r.score])));
      setHasMentorListing(!!mentorRes.data);
      setLoading(false);
    });
  }, [user.id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <CardSkeleton count={3} />
      </div>
    );
  }

  const strength = profileStrength(profile);
  const progress = roadmap ? roadmapProgress(roadmap) : 0;

  const recommended = opportunities
    .filter((o) => matchScores.has(o.id))
    .sort((a, b) => (matchScores.get(b.id) ?? 0) - (matchScores.get(a.id) ?? 0))
    .slice(0, 3);

  const deadlines = opportunities
    .map((o) => ({ o, d: daysUntil(o.deadline) }))
    .filter((x): x is { o: Opportunity; d: number } => x.d !== null && x.d >= 0)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3);
  const closingThisWeek = opportunities.filter((o) => {
    const d = daysUntil(o.deadline);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const incompleteTasks = (roadmap?.stages ?? []).flatMap((s) => s.tasks.filter((t) => !t.done).map((t) => t.text)).slice(0, 3);
  const savedCount = savedRows.filter((r) => r.status === "saved").length;
  const applied = savedRows.filter((r) => r.status !== "saved").length;
  const interviews = savedRows.filter((r) => ["interview", "shortlisted", "accepted"].includes(r.status)).length;
  const accepted = savedRows.filter((r) => r.status === "accepted").length;
  const careerHealth = computeCareerHealth(profile, roadmap, applied, interviews, hasMentorListing);

  const nextActions: string[] = [];
  if (strength < 100) nextActions.push("Finish filling out your Profile for better match scores.");
  if (!roadmap) nextActions.push("Take the Career Discovery quiz to get a personalized roadmap.");
  incompleteTasks.forEach((t) => nextActions.push(t));
  if (savedCount > 0) nextActions.push(`Apply to ${savedCount} opportunit${savedCount === 1 ? "y" : "ies"} you've saved.`);

  // Rule-based insights, derived only from real saved data — never invented.
  const insights: string[] = [];
  if (closingThisWeek > 0) insights.push(`${closingThisWeek} opportunit${closingThisWeek === 1 ? "y is" : "ies are"} closing this week.`);
  if (matchScores.size > 0) {
    const byType = new Map<string, number[]>();
    opportunities.forEach((o) => {
      const score = matchScores.get(o.id);
      if (score === undefined) return;
      const key = o.type ?? "other";
      byType.set(key, [...(byType.get(key) ?? []), score]);
    });
    let best: [string, number] | null = null;
    byType.forEach((scores, type) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (!best || avg > best[1]) best = [type, avg];
    });
    if (best) insights.push(`Your profile scores strongest for ${(best[0] as string).replace(/_/g, " ")} opportunities.`);
  }
  if (profile && (!profile.skills || profile.skills.length < 3)) {
    insights.push("Adding more skills to your Profile could improve your match scores.");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="font-serif text-2xl font-semibold text-[var(--heading)]">
        {greeting()}, {name} 👋
      </h1>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
          <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Profile Strength</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text)]">{strength}%</div>
        </div>
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
          <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Career Goal</div>
          <div className="mt-1 truncate text-lg font-semibold text-[var(--text)]">
            {roadmap?.career_title || profile?.career_goal || "Not set"}
          </div>
        </div>
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
          <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">Roadmap Progress</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--text)]">{roadmap ? `${progress}%` : "—"}</div>
        </div>
      </div>

      <div className="mt-8">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          Career Health
        </div>
        <div className="mt-4 flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center justify-center">
            <div className="text-4xl font-semibold text-[var(--text)]">{careerHealth.overall}</div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">/ 100</div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {careerHealth.dimensions.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{d.label}</span>
                  <span className="font-medium text-[var(--text)]">{d.score}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              💡 Your biggest improvement opportunity is <b>{careerHealth.drivingFactor}</b>.
            </p>
          </div>
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="mt-8">
          <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
            Recommended for you
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {recommended.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} saved={false} onToggleSave={() => {}} matchScore={matchScores.get(o.id)} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
            Your next actions
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {nextActions.length === 0 ? (
              <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)] backdrop-blur-md">
                You&apos;re all caught up.
              </div>
            ) : (
              nextActions.map((a, i) => (
                <div key={i} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] backdrop-blur-md">
                  {i + 1}. {a}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
            Deadline alerts
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {deadlines.length === 0 ? (
              <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)] backdrop-blur-md">
                No upcoming deadlines.
              </div>
            ) : (
              deadlines.map(({ o, d }) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm backdrop-blur-md">
                  <span className="truncate text-[var(--text)]">{o.title}</span>
                  <span className={`shrink-0 font-semibold ${d <= 7 ? "text-red-600" : d <= 30 ? "text-amber-600" : "text-emerald-700"}`}>
                    {d === 0 ? "Today" : d === 1 ? "1 day" : `${d} days`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="mt-8">
          <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
            Career insights
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {insights.map((ins, i) => (
              <div key={i} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] backdrop-blur-md">
                💡 {ins}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          Application progress
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            [savedRows.length, "Saved"],
            [applied, "Applied"],
            [interviews, "Interviews"],
            [accepted, "Selected"],
          ] as [number, string][]).map(([num, label]) => (
            <div key={label} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
              <div className="text-2xl font-semibold text-[var(--text)]">{num}</div>
              <div className="mt-1 text-[11px] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
