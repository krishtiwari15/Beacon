import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_TEAM_REQUESTS_PER_HOUR } from "@/lib/community";

const PURPOSES = ["hackathon", "project", "competition", "startup", "research"];

// Server-enforced rate limit and validation, mirroring
// /api/community/posts. team_requests used to be inserted straight from
// the browser client with only a client-side title.trim() check and RLS
// (auth.uid() = user_id) — no throttle, easily bypassed via direct REST calls.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { title, description, purpose, looking_for, skills_offered } = (await req.json()) as {
    title?: string;
    description?: string;
    purpose?: string;
    looking_for?: string[];
    skills_offered?: string[];
  };

  if (!title?.trim() || title.trim().length < 3) {
    return NextResponse.json({ error: "Title is too short." }, { status: 400 });
  }
  if (!purpose || !PURPOSES.includes(purpose)) {
    return NextResponse.json({ error: "Invalid purpose." }, { status: 400 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("team_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= MAX_TEAM_REQUESTS_PER_HOUR) {
    return NextResponse.json(
      { error: `You've hit the posting limit (${MAX_TEAM_REQUESTS_PER_HOUR}/hour). Try again later.` },
      { status: 429 },
    );
  }

  const { data, error } = await supabase
    .from("team_requests")
    .insert({
      user_id: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      purpose,
      looking_for: Array.isArray(looking_for) ? looking_for : [],
      skills_offered: Array.isArray(skills_offered) ? skills_offered : [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
