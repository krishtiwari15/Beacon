import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prepareApplication } from "@/lib/services/applicationStrategist";
import type { Opportunity } from "@/lib/opportunities";
import type { Profile } from "@/lib/profile";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { opportunity_id } = (await req.json()) as { opportunity_id?: number };
  if (!opportunity_id) return NextResponse.json({ error: "Missing opportunity_id." }, { status: 400 });

  const [{ data: profile }, { data: opportunity, error: oppError }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("opportunities").select("*").eq("id", opportunity_id).single(),
  ]);

  if (oppError || !opportunity) {
    return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  }

  const profileSkills = new Set(((profile?.skills as string[] | undefined) ?? []).map((s) => s.toLowerCase()));
  const oppTags = (opportunity.tags as string[] | undefined) ?? [];
  const matchedSkills = oppTags.filter((t) => profileSkills.has(t.toLowerCase()));
  const gapSkills = oppTags.filter((t) => !profileSkills.has(t.toLowerCase()));

  const result = await prepareApplication(
    profile as Profile | null,
    opportunity as Opportunity,
    matchedSkills,
    gapSkills,
  );

  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ ...result, matchedSkills, gapSkills });
}
