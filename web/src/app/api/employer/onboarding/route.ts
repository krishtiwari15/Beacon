import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Creates a company + the caller's own recruiter row (as owner) in one
// request, so a company never exists without an owner attached to it.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: existing } = await supabase.from("recruiters").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "You're already registered as a recruiter." }, { status: 409 });
  }

  const { name, website, industry, size, description, full_name, title } = (await req.json()) as {
    name?: string;
    website?: string;
    industry?: string;
    size?: string;
    description?: string;
    full_name?: string;
    title?: string;
  };

  if (!name?.trim() || name.trim().length < 2) {
    return NextResponse.json({ error: "Company name is too short." }, { status: 400 });
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: name.trim(),
      website: website?.trim() || null,
      industry: industry?.trim() || null,
      size: size?.trim() || null,
      description: description?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 });

  const { error: recruiterError } = await supabase.from("recruiters").insert({
    user_id: user.id,
    company_id: company.id,
    role: "owner",
    full_name: full_name?.trim() || null,
    title: title?.trim() || null,
  });

  if (recruiterError) {
    // Roll back the orphaned company row rather than leaving a company with
    // no recruiter attached to it.
    await supabase.from("companies").delete().eq("id", company.id);
    return NextResponse.json({ error: recruiterError.message }, { status: 500 });
  }

  return NextResponse.json({ company });
}
