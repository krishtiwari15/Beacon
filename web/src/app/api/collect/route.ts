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
// Official, free, no-auth-required U.S. federal grants search API.
// https://grants.gov/api/api-guide
const GRANTS_GOV_URL = "https://api.grants.gov/v1/api/search2";
// Official, free U.S. federal jobs API — requires a self-registered key
// (developer.usajobs.gov). Inactive until USAJOBS_API_KEY/USAJOBS_USER_AGENT
// are set; fetchUSAJobs() returns [] silently until then.
const USAJOBS_URL = "https://data.usajobs.gov/api/search";

type NewOpportunity = {
  title: string;
  type: string;
  category: string;
  organization: string;
  location: string;
  eligibility: string;
  deadline: string | null;
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

function parseGrantsGovDate(mmddyyyy: string): string | null {
  const m = mmddyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchGrantsGov(): Promise<NewOpportunity[]> {
  try {
    const res = await fetch(GRANTS_GOV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: "student", oppStatuses: "posted", rows: 25 }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const hits = (json?.data?.oppHits ?? []) as Record<string, unknown>[];
    return hits
      .filter((h) => h.oppStatus === "posted" && h.id && h.title)
      .map((h) => ({
        title: h.title as string,
        type: "grant",
        category: "Grants & Research Funding",
        organization: (h.agency as string) || "U.S. Government",
        location: "United States (federal)",
        eligibility: "See official listing on Grants.gov for eligibility criteria.",
        deadline: parseGrantsGovDate((h.closeDate as string) || ""),
        source_url: `https://www.grants.gov/search-results-detail/${h.id}`,
        tags: [],
        stipend: "Varies by award",
        difficulty: "Advanced",
        work_mode: "Varies",
        logo_url: "",
      }));
  } catch {
    return [];
  }
}

function parseUsaJobsDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function fetchUSAJobs(): Promise<NewOpportunity[]> {
  const apiKey = process.env.USAJOBS_API_KEY;
  const userAgent = process.env.USAJOBS_USER_AGENT;
  if (!apiKey || !userAgent) return [];

  try {
    const url = `${USAJOBS_URL}?Keyword=student%20intern&ResultsPerPage=25`;
    const res = await fetch(url, {
      headers: {
        Host: "data.usajobs.gov",
        "User-Agent": userAgent,
        "Authorization-Key": apiKey,
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = (json?.SearchResult?.SearchResultItems ?? []) as Record<string, unknown>[];
    return items
      .map((item) => item.MatchedObjectDescriptor as Record<string, unknown>)
      .filter((d) => d?.PositionTitle && d?.PositionURI)
      .map((d) => ({
        title: d.PositionTitle as string,
        type: "internship",
        category: "Government",
        organization: (d.OrganizationName as string) || (d.DepartmentName as string) || "U.S. Government",
        location: (d.PositionLocationDisplay as string) || "United States",
        eligibility: "See official USAJOBS listing for eligibility criteria.",
        deadline: parseUsaJobsDate(d.PositionEndDate as string | undefined),
        source_url: (Array.isArray(d.ApplyURI) ? (d.ApplyURI[0] as string) : undefined) || (d.PositionURI as string),
        tags: [],
        stipend: "Federal pay scale — see listing",
        difficulty: "Intermediate",
        work_mode: "On-site",
        logo_url: "",
      }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const all = [
    ...(await fetchRemotive()),
    ...(await fetchHimalayas()),
    ...(await fetchArbeitnow()),
    ...(await fetchGrantsGov()),
    ...(await fetchUSAJobs()),
  ].filter((o) => o.source_url);

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

  // Remove opportunities whose deadline has passed — but never one a
  // student has saved/tracked, so their application history in the
  // Tracker never silently disappears out from under them.
  const today = new Date().toISOString().slice(0, 10);
  const { data: savedRows } = await supabase.from("saved_opportunities").select("opportunity_id");
  const protectedIds = Array.from(new Set((savedRows ?? []).map((r) => r.opportunity_id as number)));

  let deleteQuery = supabase.from("opportunities").delete({ count: "exact" }).lt("deadline", today);
  if (protectedIds.length > 0) {
    deleteQuery = deleteQuery.not("id", "in", `(${protectedIds.join(",")})`);
  }
  const { count: removedCount, error: deleteError } = await deleteQuery;
  if (deleteError) {
    console.error("[collect] Failed to clean up expired opportunities:", deleteError.message);
  }

  return NextResponse.json({
    message: "Collection run complete",
    fetched: all.length,
    added: deduped.length,
    skipped: all.length - deduped.length,
    expiredRemoved: removedCount ?? 0,
  });
}
