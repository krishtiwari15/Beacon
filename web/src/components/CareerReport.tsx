"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/profile";
import { Roadmap, roadmapProgress } from "@/lib/roadmap";
import { computeCareerHealth } from "@/lib/careerHealth";
import { computeProofOfSkill } from "@/lib/proofOfSkill";
import { Opportunity } from "@/lib/opportunities";

type SavedRow = { id: number; status: string; opportunity: Opportunity };

export default function CareerReport({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [savedRows, setSavedRows] = useState<SavedRow[]>([]);
  const [matchScores, setMatchScores] = useState<Map<number, number>>(new Map());
  const [hasMentorListing, setHasMentorListing] = useState(false);
  const [assessmentScores, setAssessmentScores] = useState<Map<string, number>>(new Map());

  const name = (user.user_metadata?.name as string | undefined) || profile?.full_name || user.email || "Beacon Student";

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("roadmaps").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("saved_opportunities").select("id, status, opportunity:opportunities(*)").eq("user_id", user.id),
      fetch("/api/match-scores").then((r) => r.json()),
      supabase.from("mentors").select("user_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("skill_assessments").select("skill, score, taken_at").eq("user_id", user.id).order("taken_at", { ascending: false }),
    ]).then(([profileRes, roadmapRes, savedRes, matchesJson, mentorRes, assessRes]) => {
      setProfile((profileRes.data as Profile) ?? null);
      setRoadmap((roadmapRes.data as Roadmap) ?? null);
      setSavedRows((savedRes.data as unknown as SavedRow[]) ?? []);
      const rows = (matchesJson.scores ?? []) as { opportunity_id: number; score: number }[];
      setMatchScores(new Map(rows.map((r) => [r.opportunity_id, r.score])));
      setHasMentorListing(!!mentorRes.data);
      const scoreMap = new Map<string, number>();
      (assessRes.data ?? []).forEach((r) => {
        const key = (r.skill as string).toLowerCase();
        if (!scoreMap.has(key)) scoreMap.set(key, r.score as number);
      });
      setAssessmentScores(scoreMap);
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

  const applied = savedRows.filter((r) => r.status !== "saved").length;
  const interviews = savedRows.filter((r) => ["interview", "shortlisted", "accepted"].includes(r.status)).length;
  const offers = savedRows.filter((r) => r.status === "accepted").length;
  const health = computeCareerHealth(profile, roadmap, applied, interviews, hasMentorListing);
  const proof = computeProofOfSkill(profile?.skills ?? [], profile?.projects ?? [], [], assessmentScores);

  const topMatches = savedRows
    .filter((r) => matchScores.has(r.opportunity.id))
    .sort((a, b) => (matchScores.get(b.opportunity.id) ?? 0) - (matchScores.get(a.opportunity.id) ?? 0))
    .slice(0, 5);

  const gapSkills = Array.from(
    new Set(
      savedRows.flatMap((r) => r.opportunity.tags).filter((t) => !(profile?.skills ?? []).some((s) => s.toLowerCase() === t.toLowerCase())),
    ),
  ).slice(0, 8);

  const nextActions: string[] = [];
  if (health.drivingFactor) nextActions.push(`Improve your ${health.drivingFactor} — currently your biggest gap.`);
  const incompleteTasks = (roadmap?.stages ?? []).flatMap((s) => s.tasks.filter((t) => !t.done).map((t) => t.text)).slice(0, 3);
  nextActions.push(...incompleteTasks);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 print:max-w-full print:px-0">
      <div className="flex items-center justify-between print:hidden">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          Beacon Career Report
        </div>
        <button
          onClick={() => window.print()}
          className="cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-[var(--surface-solid)] p-8 shadow-lg print:rounded-none print:border-none print:p-0 print:shadow-none">
        <div className="text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">Beacon Career Report</div>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-[var(--heading)]">{name}</h1>
        {profile?.education && <p className="mt-1 text-sm text-[var(--text-muted)]">{profile.education}</p>}
        {(roadmap?.career_title || profile?.career_goal) && (
          <p className="mt-2 text-sm text-[var(--text)]"><b>Career goal:</b> {roadmap?.career_title || profile?.career_goal}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[14px] border border-[var(--border)] p-3 text-center">
            <div className="text-2xl font-semibold text-[var(--text)]">{health.overall}</div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Career Health</div>
          </div>
          <div className="rounded-[14px] border border-[var(--border)] p-3 text-center">
            <div className="text-2xl font-semibold text-[var(--text)]">{roadmap ? `${roadmapProgress(roadmap)}%` : "—"}</div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Roadmap Progress</div>
          </div>
          <div className="rounded-[14px] border border-[var(--border)] p-3 text-center">
            <div className="text-2xl font-semibold text-[var(--text)]">{applied}</div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Applications</div>
          </div>
          <div className="rounded-[14px] border border-[var(--border)] p-3 text-center">
            <div className="text-2xl font-semibold text-[var(--text)]">{offers}</div>
            <div className="text-[10px] tracking-wider text-[var(--text-muted)] uppercase">Offers</div>
          </div>
        </div>

        {proof.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Skills</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {proof.map((s) => (
                <span key={s.skill} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)]">
                  {s.skill} · {s.proficiency}%
                </span>
              ))}
            </div>
          </div>
        )}

        {gapSkills.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Skill gaps (from applications)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {gapSkills.map((s) => (
                <span key={s} className="rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-xs text-amber-800">{s}</span>
              ))}
            </div>
          </div>
        )}

        {!!profile?.projects?.length && (
          <div className="mt-4">
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Projects</div>
            <div className="mt-2 flex flex-col gap-1">
              {profile.projects.map((p) => (
                <div key={p} className="text-sm text-[var(--text)]">• {p}</div>
              ))}
            </div>
          </div>
        )}

        {topMatches.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Top opportunity matches</div>
            <div className="mt-2 flex flex-col gap-1">
              {topMatches.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm text-[var(--text)]">
                  <span>{r.opportunity.title}</span>
                  <span className="text-[var(--text-muted)]">{matchScores.get(r.opportunity.id)}% match</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextActions.length > 0 && (
          <div className="mt-6 rounded-[14px] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
            <div className="text-xs font-semibold tracking-wider text-[var(--accent)] uppercase">Recommended next actions</div>
            <div className="mt-2 flex flex-col gap-1">
              {nextActions.map((a, i) => (
                <div key={i} className="text-sm text-[var(--text)]">{i + 1}. {a}</div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Generated by Beacon on {new Date().toLocaleDateString()}. Reflects self-reported and Beacon-tracked data only.
        </p>
      </div>
    </div>
  );
}
