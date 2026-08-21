import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Moves a company from "unverified" to "pending" -- a real request for a
// human to review, never an auto-grant. Only the company's owner can
// request it, and only from "unverified" (no re-requesting once pending or
// already verified).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: recruiter } = await supabase
    .from("recruiters")
    .select("company_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!recruiter) return NextResponse.json({ error: "You're not registered as a recruiter." }, { status: 403 });
  if (recruiter.role !== "owner") {
    return NextResponse.json({ error: "Only the company owner can request verification." }, { status: 403 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("verification_status")
    .eq("id", recruiter.company_id)
    .single();

  if (company?.verification_status !== "unverified") {
    return NextResponse.json({ error: "Verification has already been requested or granted." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("companies")
    .update({ verification_status: "pending" })
    .eq("id", recruiter.company_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data });
}
