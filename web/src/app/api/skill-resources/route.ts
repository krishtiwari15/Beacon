import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestSkillResources } from "@/lib/services/skillResources";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { skill } = (await req.json()) as { skill?: string };
  if (!skill) return NextResponse.json({ error: "Missing skill." }, { status: 400 });

  const result = await suggestSkillResources(skill);
  return NextResponse.json(result);
}
