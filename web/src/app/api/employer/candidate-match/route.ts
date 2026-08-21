import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeCandidateMatches, type Applicant } from "@/lib/services/recruiterMatching";
import type { Job } from "@/lib/employer";
import type { Profile } from "@/lib/profile";

export const maxDuration = 30;

// Ranks the real applicants to one job against that job's requirements.
// Never searches the wider student base -- only rows already present in
// job_applications for this job, consistent with the consent-by-application
// RLS policy on public.profiles.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { job_id } = (await req.json()) as { job_id?: number };
  if (!job_id) return NextResponse.json({ error: "Missing job_id." }, { status: 400 });

  const { data: job, error: jobError } = await supabase.from("jobs").select("*").eq("id", job_id).single();
  if (jobError || !job) return NextResponse.json({ error: "Job not found." }, { status: 404 });

  const { data: recruiter } = await supabase
    .from("recruiters")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!recruiter || recruiter.company_id !== job.company_id) {
    return NextResponse.json({ error: "Not authorized for this job." }, { status: 403 });
  }

  const { data: applications } = await supabase
    .from("job_applications")
    .select("student_user_id")
    .eq("job_id", job_id);

  const studentIds = (applications ?? []).map((a) => a.student_user_id as string);
  if (studentIds.length === 0) {
    return NextResponse.json({ matches: [] });
  }

  const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", studentIds);
  const profileByUser = new Map((profiles ?? []).map((p) => [p.user_id as string, p as Profile]));

  const applicants: Applicant[] = studentIds.map((id) => ({
    student_user_id: id,
    profile: profileByUser.get(id) ?? null,
  }));

  const { matches, error } = await computeCandidateMatches(job as Job, applicants);
  if (error && matches.length === 0) return NextResponse.json({ error }, { status: 502 });

  if (matches.length > 0) {
    const now = new Date().toISOString();
    const rows = matches.map((m) => ({
      job_id,
      student_user_id: m.student_user_id,
      score: m.score,
      explanation: m.explanation,
      computed_at: now,
    }));
    const { error: upsertError } = await supabase
      .from("job_candidate_matches")
      .upsert(rows, { onConflict: "job_id,student_user_id" });
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ matches });
}
