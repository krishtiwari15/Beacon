import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateProjects } from "@/lib/services/projectGenerator";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { career_title, skills } = (await req.json()) as { career_title?: string; skills?: string[] };
  if (!career_title) return NextResponse.json({ error: "Missing career_title." }, { status: 400 });

  const result = await generateProjects(career_title, skills ?? []);
  return NextResponse.json(result);
}
