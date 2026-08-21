import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES = new Set(["apply_click", "skill_view", "career_view"]);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { type, target } = (await req.json()) as { type?: string; target?: string };
  if (!type || !VALID_TYPES.has(type) || !target) {
    return NextResponse.json({ error: "Invalid interaction." }, { status: 400 });
  }

  await supabase.from("user_interactions").insert({ user_id: user.id, type, target });
  return NextResponse.json({ ok: true });
}
