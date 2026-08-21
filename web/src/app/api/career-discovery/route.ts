import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recommendCareers, type QuizAnswers } from "@/lib/services/careerRecommendation";
import type { Profile } from "@/lib/profile";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const answers = (await req.json()) as QuizAnswers;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const result = await recommendCareers(answers, profile as Profile | null);
  return NextResponse.json(result);
}
