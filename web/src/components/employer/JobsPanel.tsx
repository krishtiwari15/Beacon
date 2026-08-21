"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Job, JobType, JobStatus, JOB_TYPE_LABELS } from "@/lib/employer";
import JobApplicants from "@/components/employer/JobApplicants";

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]";

const STATUS_LABEL: Record<JobStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "border-emerald-600/30 bg-emerald-500/10 text-emerald-700" },
  draft: { label: "Draft", className: "border-[var(--border)] text-[var(--text-muted)]" },
  closed: { label: "Closed", className: "border-red-600/30 bg-red-500/10 text-red-700" },
};

type FormState = {
  title: string;
  type: JobType;
  description: string;
  required_skills: string;
  preferred_skills: string;
  eligibility: string;
  experience_level: string;
  location: string;
  work_mode: string;
  compensation: string;
  application_deadline: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  type: "internship",
  description: "",
  required_skills: "",
  preferred_skills: "",
  eligibility: "",
  experience_level: "",
  location: "",
  work_mode: "",
  compensation: "",
  application_deadline: "",
};

export default function JobsPanel({ companyId }: { companyId: number }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("jobs").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    const jobRows = (data ?? []) as Job[];
    setJobs(jobRows);
    if (jobRows.length > 0) {
      const { data: apps } = await supabase
        .from("job_applications")
        .select("job_id")
        .in("job_id", jobRows.map((j) => j.id));
      const counts: Record<number, number> = {};
      (apps ?? []).forEach((a) => {
        counts[a.job_id as number] = (counts[a.job_id as number] ?? 0) + 1;
      });
      setApplicantCounts(counts);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function post(e: React.FormEvent, status: JobStatus) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setPosting(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPosting(false);
      return;
    }
    const { error: insertError } = await supabase.from("jobs").insert({
      company_id: companyId,
      posted_by: user.id,
      title: form.title.trim(),
      type: form.type,
      description: form.description.trim(),
      required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
      preferred_skills: form.preferred_skills.split(",").map((s) => s.trim()).filter(Boolean),
      eligibility: form.eligibility.trim() || null,
      experience_level: form.experience_level.trim() || null,
      location: form.location.trim() || null,
      work_mode: form.work_mode.trim() || null,
      compensation: form.compensation.trim() || null,
      application_deadline: form.application_deadline || null,
      status,
    });
    setPosting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm(EMPTY_FORM);
    setFormOpen(false);
    load();
  }

  async function setStatus(jobId: number, status: JobStatus) {
    const supabase = createClient();
    await supabase.from("jobs").update({ status, updated_at: new Date().toISOString() }).eq("id", jobId);
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="h-48 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          Job Postings
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
        >
          {formOpen ? "Cancel" : "+ Post a job"}
        </button>
      </div>

      {formOpen && (
        <form className="mt-4 grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:grid-cols-2">
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Job title, e.g. Data Analyst Intern" required className={`${inputClass} sm:col-span-2`} />
          <select value={form.type} onChange={(e) => set("type", e.target.value as JobType)} className={`${inputClass} cursor-pointer`}>
            {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input value={form.experience_level} onChange={(e) => set("experience_level", e.target.value)} placeholder="Experience level, e.g. Entry-level / 0-1 years" className={inputClass} />
          <input value={form.required_skills} onChange={(e) => set("required_skills", e.target.value)} placeholder="Required skills, comma-separated" className={inputClass} />
          <input value={form.preferred_skills} onChange={(e) => set("preferred_skills", e.target.value)} placeholder="Preferred skills, comma-separated" className={inputClass} />
          <input value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} placeholder="Eligibility, e.g. Final-year CS students" className={inputClass} />
          <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Location" className={inputClass} />
          <input value={form.work_mode} onChange={(e) => set("work_mode", e.target.value)} placeholder="Work mode, e.g. Remote / Hybrid / On-site" className={inputClass} />
          <input value={form.compensation} onChange={(e) => set("compensation", e.target.value)} placeholder="Compensation, e.g. $1,500/month stipend" className={inputClass} />
          <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
            Application deadline
            <input type="date" value={form.application_deadline} onChange={(e) => set("application_deadline", e.target.value)} className={inputClass} />
          </label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Full job description" rows={4} required className={`${inputClass} resize-none sm:col-span-2`} />
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              onClick={(e) => post(e, "active")}
              disabled={posting}
              className="h-[44px] flex-1 cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? "Posting…" : "Publish job"}
            </button>
            <button
              type="submit"
              onClick={(e) => post(e, "draft")}
              disabled={posting}
              className="h-[44px] cursor-pointer rounded-[12px] border border-[var(--border)] px-4 text-sm font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save as draft
            </button>
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        </form>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {jobs.length === 0 ? (
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
            No job postings yet — post your first one above.
          </div>
        ) : (
          jobs.map((job) => {
            const badge = STATUS_LABEL[job.status];
            const isExpanded = expandedJob === job.id;
            return (
              <div key={job.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 font-serif text-lg font-semibold break-words text-[var(--heading)]">{job.title}</span>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {JOB_TYPE_LABELS[job.type]} · {job.location || "Location not specified"} · {applicantCounts[job.id] ?? 0} applicant{(applicantCounts[job.id] ?? 0) === 1 ? "" : "s"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    className="cursor-pointer text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    {isExpanded ? "Hide candidates" : "View candidates →"}
                  </button>
                  {job.status !== "active" && (
                    <button onClick={() => setStatus(job.id, "active")} className="cursor-pointer text-xs font-medium text-emerald-700 hover:underline">
                      Publish
                    </button>
                  )}
                  {job.status !== "closed" && (
                    <button onClick={() => setStatus(job.id, "closed")} className="cursor-pointer text-xs font-medium text-red-600 hover:underline">
                      Close
                    </button>
                  )}
                </div>

                {isExpanded && <JobApplicants job={job} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
