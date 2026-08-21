"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Job, JOB_TYPE_LABELS } from "@/lib/employer";
import CardSkeleton from "@/components/CardSkeleton";

type JobWithCompany = Job & { company: { name: string; verification_status: string; logo_url: string | null } | null };

const VERIFIED_BADGE: Record<string, { label: string; className: string } | null> = {
  verified: { label: "Beacon Verified ✓", className: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700" },
  pending: null,
  unverified: null,
};

export default function DirectJobs({ user }: { user: User }) {
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);

  async function load() {
    const supabase = createClient();
    const [{ data: jobRows }, { data: appliedRows }] = await Promise.all([
      supabase
        .from("jobs")
        .select("*, company:companies(name, verification_status, logo_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("job_applications").select("job_id").eq("student_user_id", user.id),
    ]);
    setJobs((jobRows ?? []) as unknown as JobWithCompany[]);
    setAppliedIds(new Set((appliedRows ?? []).map((r) => r.job_id as number)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function apply(jobId: number) {
    setApplying(jobId);
    const supabase = createClient();
    const { error } = await supabase.from("job_applications").insert({ job_id: jobId, student_user_id: user.id });
    setApplying(null);
    if (!error) setAppliedIds((prev) => new Set(prev).add(jobId));
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Direct Jobs
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Roles posted directly by employers on Beacon — apply here and the recruiter will review your profile.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {jobs.length === 0 ? (
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
            No direct job postings yet — check back soon.
          </div>
        ) : (
          jobs.map((job) => {
            const applied = appliedIds.has(job.id);
            const badge = job.company ? VERIFIED_BADGE[job.company.verification_status] : null;
            return (
              <div key={job.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="min-w-0 break-words font-serif text-lg font-semibold text-[var(--heading)]">{job.title}</span>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{job.company?.name ?? "Unknown company"}</p>
                  </div>
                  {badge && <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>}
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {JOB_TYPE_LABELS[job.type]} · {job.location || "Location not specified"} · {job.work_mode || "Work mode not specified"}
                </p>
                {job.compensation && <p className="mt-1 text-xs text-[var(--text-muted)]">{job.compensation}</p>}
                <p className="mt-3 text-sm text-[var(--text)] line-clamp-3">{job.description}</p>
                {!!job.required_skills.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.required_skills.map((s) => (
                      <span key={s} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">{s}</span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => apply(job.id)}
                  disabled={applied || applying === job.id}
                  className="mt-4 cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applied ? "✓ Applied" : applying === job.id ? "Applying…" : "Apply"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
