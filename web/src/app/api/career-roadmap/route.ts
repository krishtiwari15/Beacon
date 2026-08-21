import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoadmap } from "@/lib/services/careerRoadmap";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { career_title } = (await req.json()) as { career_title?: string };
  if (!career_title) return NextResponse.json({ error: "Missing career_title." }, { status: 400 });

  const { stages, error } = await generateRoadmap(career_title);
  if (error || !stages) {
    return NextResponse.json({ error: error ?? "Could not generate a roadmap." }, { status: 502 });
  }

  const withProgress = stages.map((stage) => ({
    title: stage.title,
    tasks: stage.tasks.map((text) => ({ text, done: false })),
  }));

  const { data, error: dbError } = await supabase
    .from("roadmaps")
    .upsert(
      { user_id: user.id, career_title, stages: withProgress, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ roadmap: data });
}
