import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStartupPlan } from "@/lib/services/startupCopilot";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { idea_title, idea_description } = (await req.json()) as { idea_title?: string; idea_description?: string };
  if (!idea_title) return NextResponse.json({ error: "Missing idea_title." }, { status: 400 });

  const { stages, error } = await generateStartupPlan(idea_description || idea_title);
  if (error || !stages) return NextResponse.json({ error: error ?? "Could not generate a plan." }, { status: 502 });

  const withProgress = stages.map((s) => ({ title: s.title, tasks: s.tasks.map((text) => ({ text, done: false })) }));

  const { data, error: dbError } = await supabase
    .from("startup_roadmaps")
    .upsert(
      { user_id: user.id, idea_title, stages: withProgress, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ plan: data });
}
