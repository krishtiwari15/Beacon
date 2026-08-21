"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Job, JobApplication, APPLICATION_STAGES, ApplicationStatus } from "@/lib/employer";
import type { Profile } from "@/lib/profile";

type MatchInfo = { score: number; explanation: string };

export default function JobApplicants({ job }: { job: Job }) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Partial<Profile>>>({});
  const [matches, setMatches] = useState<Record<string, MatchInfo>>({});
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const { data: apps } = await supabase.from("job_applications").select("*").eq("job_id", job.id).order("applied_at", { ascending: false });
    const appRows = (apps ?? []) as JobApplication[];
    setApplications(appRows);

    if (appRows.length > 0) {
      const ids = appRows.map((a) => a.student_user_id);
      const [{ data: profileRows }, { data: matchRows }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, education, skills, projects, career_goal").in("user_id", ids),
        supabase.from("job_candidate_matches").select("student_user_id, score, explanation").eq("job_id", job.id),
      ]);
      const profileMap: Record<string, Partial<Profile>> = {};
      (profileRows ?? []).forEach((p) => {
        profileMap[p.user_id as string] = p as Partial<Profile>;
      });
      setProfiles(profileMap);

      const matchMap: Record<string, MatchInfo> = {};
      (matchRows ?? []).forEach((m) => {
        matchMap[m.student_user_id as string] = { score: m.score as number, explanation: m.explanation as string };
      });
      setMatches(matchMap);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  async function updateStatus(applicationId: number, status: ApplicationStatus) {
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId);
    if (updateError) {
      setError("Couldn't save that status change — please try again.");
      load();
    }
  }

  async function rankWithAI() {
    setRanking(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/candidate-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't rank candidates.");
        return;
      }
      const matchMap: Record<string, MatchInfo> = {};
      (data.matches ?? []).forEach((m: { student_user_id: string; score: number; explanation: string }) => {
        matchMap[m.student_user_id] = { score: m.score, explanation: m.explanation };
      });
      setMatches(matchMap);
    } finally {
      setRanking(false);
    }
  }

  const sorted = [...applications].sort((a, b) => (matches[b.student_user_id]?.score ?? -1) - (matches[a.student_user_id]?.score ?? -1));

  if (loading) {
    return <div className="mt-4 h-24 animate-pulse rounded-[12px] bg-black/[0.03]" />;
  }

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      {applications.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No applicants yet.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)]">{applications.length} applicant{applications.length === 1 ? "" : "s"}</p>
            <button
              onClick={rankWithAI}
              disabled={ranking}
              className="cursor-pointer rounded-full border border-[var(--accent)]/40 px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition-colors duration-200 hover:bg-[var(--accent)]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ranking ? "Ranking with AI…" : "✨ Rank with AI"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-3 flex flex-col gap-3">
            {sorted.map((app) => {
              const profile = profiles[app.student_user_id];
              const match = matches[app.student_user_id];
              return (
                <div key={app.id} className="rounded-[12px] border border-[var(--border)] bg-black/[0.015] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 break-words text-sm font-semibold text-[var(--text)]">
                      {profile?.full_name || "Beacon Student"}
                    </span>
                    {match !== undefined && (
                      <span className="shrink-0 rounded-full border border-[var(--accent)]/30 px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                        {match.score}% match
                      </span>
                    )}
                  </div>
                  {profile?.education && <p className="mt-1 text-xs text-[var(--text-muted)]">{profile.education}</p>}
                  {!!profile?.skills?.length && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profile.skills.slice(0, 8).map((s) => (
                        <span key={s} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">{s}</span>
                      ))}
                    </div>
                  )}
                  {match?.explanation && <p className="mt-2 text-xs text-[var(--text)] italic">&quot;{match.explanation}&quot;</p>}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                      className="cursor-pointer rounded-md border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                    >
                      {APPLICATION_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                    <span className="text-[11px] text-[var(--text-muted)]">Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
