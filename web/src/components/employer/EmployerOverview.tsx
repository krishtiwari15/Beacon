"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Company, JobApplication } from "@/lib/employer";

export default function EmployerOverview({ company }: { company: Company }) {
  const [loading, setLoading] = useState(true);
  const [activeJobs, setActiveJobs] = useState(0);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: jobs } = await supabase.from("jobs").select("id, status").eq("company_id", company.id);
      const jobIds = (jobs ?? []).map((j) => j.id as number);
      setActiveJobs((jobs ?? []).filter((j) => j.status === "active").length);

      if (jobIds.length > 0) {
        const { data: apps } = await supabase.from("job_applications").select("*").in("job_id", jobIds);
        setApplications((apps ?? []) as JobApplication[]);
      }
      setLoading(false);
    })();
  }, [company.id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="h-32 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
  const interviews = applications.filter((a) => a.status === "interview").length;
  const offers = applications.filter((a) => a.status === "offered" || a.status === "hired").length;

  const stats: [number, string][] = [
    [activeJobs, "Active Jobs"],
    [applications.length, "Applications"],
    [shortlisted, "Shortlisted"],
    [interviews, "Interviews"],
    [offers, "Offers"],
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Employer Dashboard
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Welcome back — here&apos;s what&apos;s happening with {company.name}&apos;s postings.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([num, label]) => (
          <div key={label} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md transition-shadow duration-200 hover:shadow-md">
            <div className="text-2xl font-semibold text-[var(--text)]">{num}</div>
            <div className="mt-1 text-[11px] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
          </div>
        ))}
      </div>

      {applications.length === 0 && activeJobs === 0 && (
        <div className="mt-6 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
          Post your first job to start receiving applications.
        </div>
      )}
    </div>
  );
}
