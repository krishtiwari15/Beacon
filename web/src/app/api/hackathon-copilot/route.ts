import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateHackathonKit } from "@/lib/services/hackathonCopilot";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { theme, team_skills, hours_available, difficulty } = (await req.json()) as {
    theme?: string;
    team_skills?: string;
    hours_available?: number;
    difficulty?: string;
  };
  if (!theme) return NextResponse.json({ error: "Missing theme." }, { status: 400 });

  const result = await generateHackathonKit(theme, team_skills ?? "", hours_available ?? 24, difficulty ?? "Intermediate");
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json(result);
}
