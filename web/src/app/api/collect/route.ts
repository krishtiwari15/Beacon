// /api/collect — pulls opportunities from free job APIs and inserts new ones.
// Triggered by Vercel Cron (see vercel.json) roughly every 12 hours, using
// the ADAPTER pattern: each source has its own fetcher that translates that
// API's data into our common opportunity shape. Ported from backend/collector.py.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const REMOTIVE_URL = "https://remotive.com/api/remote-jobs?category=software-dev&limit=20";
const HIMALAYAS_URL = "https://himalayas.app/jobs/api?limit=20";
const ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api";

type NewOpportunity = {
  title: string;
  type: string;
  category: string;
  organization: string;
  location: string;
  eligibility: string;
  deadline: null;
  source_url: string;
  tags: string[];
  stipend: string;
  difficulty: string;
  work_mode: string;
  logo_url: string;
};

function tagsFrom(list: unknown, limit = 5): string[] {
  if (!Array.isArray(list)) return [];
  return list.slice(0, limit).map((t) => String(t));
}

async function fetchRemotive(): Promise<NewOpportunity[]> {
  try {
    const res = await fetch(REMOTIVE_URL, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return [];
    const jobs = ((await res.json()).jobs ?? []) as Record<string, unknown>[];
    return jobs.map((job) => ({
      title: (job.title as string) || "Untitled Role",
      type: job.job_type === "internship" ? "internship" : "remote_job",
      category: (job.category as string) || "Tech",
      organization: (job.company_name as string) || "Unknown",
      location: (job.candidate_required_location as string) || "Remote",
      eligibility: "Open to applicants",
      deadline: null,
      source_url: (job.url as string) || "",
      tags: tagsFrom(job.tags),
      stipend: (job.salary as string) || "Not specified",
      difficulty: "Intermediate",
      work_mode: "Remote",
      logo_url: (job.company_logo as string) || "",
    }));
  } catch {
    return [];
  }
}

async function fetchHimalayas(): Promise<NewOpportunity[]> {
  try {
    const res = await fetch(HIMALAYAS_URL, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return [];
    const jobs = ((await res.json()).jobs ?? []) as Record<string, unknown>[];
    return jobs.map((job) => {
      const locations = (job.locationRestrictions as string[] | undefined) ?? [];
      return {
        title: (job.title as string) || "Untitled Role",
        type: "remote_job",
        category: ((job.categories as string[] | undefined) ?? ["Tech"])[0] ?? "Tech",
        organization: (job.companyName as string) || "Unknown",
        location: locations.length ? locations.join(", ") : "Remote",
        eligibility: "Open to applicants",
        deadline: null,
        source_url: (job.applicationLink as string) || (job.guid as string) || "",
        tags: tagsFrom(job.categories),
        stipend: "Not specified",
        difficulty: "Intermediate",
        work_mode: "Remote",
        logo_url: (job.companyLogo as string) || "",
      };
    });
  } catch {
    return [];
  }
}

async function fetchArbeitnow(): Promise<NewOpportunity[]> {
  try {
    const res = await fetch(ARBEITNOW_URL, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return [];
    const jobs = (((await res.json()).data ?? []) as Record<string, unknown>[]).slice(0, 20);
    return jobs.map((job) => {
      const remote = Boolean(job.remote);
      return {
        title: (job.title as string) || "Untitled Role",
        type: remote ? "remote_job" : "internship",
        category: ((job.job_types as string[] | undefined) ?? ["Tech"])[0] ?? "Tech",
        organization: (job.company_name as string) || "Unknown",
        location: (job.location as string) || "Europe",
        eligibility: "Open to applicants",
        deadline: null,
        source_url: (job.url as string) || "",
        tags: tagsFrom(job.tags),
        stipend: "Not specified",
        difficulty: "Intermediate",
        work_mode: remote ? "Remote" : "On-site",
        logo_url: "",
      };
    });
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const all = [...(await fetchRemotive()), ...(await fetchHimalayas()), ...(await fetchArbeitnow())].filter(
    (o) => o.source_url,
  );

  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("opportunities").select("source_url");
  const existingUrls = new Set((existing ?? []).map((r) => r.source_url as string));

  const toInsert = all.filter((o) => !existingUrls.has(o.source_url));
  // Dedup within the fetched batch too.
  const seen = new Set<string>();
  const deduped = toInsert.filter((o) => {
    if (seen.has(o.source_url)) return false;
    seen.add(o.source_url);
    return true;
  });

  if (deduped.length > 0) {
    const { error } = await supabase.from("opportunities").insert(deduped);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Collection run complete",
    fetched: all.length,
    added: deduped.length,
    skipped: all.length - deduped.length,
  });
}
