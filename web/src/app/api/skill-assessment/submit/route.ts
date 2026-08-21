import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { skill, score } = (await req.json()) as { skill?: string; score?: number };
  if (!skill || typeof score !== "number") {
    return NextResponse.json({ error: "Missing skill or score." }, { status: 400 });
  }
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  const { error } = await supabase.from("skill_assessments").insert({ user_id: user.id, skill, score: clamped });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, score: clamped });
}
