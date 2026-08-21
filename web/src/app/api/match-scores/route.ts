import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeMatchScores } from "@/lib/services/opportunityMatching";
import type { Opportunity } from "@/lib/opportunities";
import type { Profile } from "@/lib/profile";

// POST scores in sequential batches (see opportunityMatching.ts), which can
// take longer than the default serverless timeout for large opportunity
// counts.
export const maxDuration = 60;

// GET returns cached match scores for the signed-in user (cheap DB read,
// no AI call — safe to call on every Discover/Tracker mount).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data, error } = await supabase
    .from("opportunity_matches")
    .select("opportunity_id, score")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scores: data ?? [] });
}

const LABELS: Record<string, string> = {
  apply_click: "clicked Apply on opportunity type",
  skill_view: "looked up the skill",
  career_view: "explored the career path",
};

function summarizeInteractions(rows: { type: string; target: string }[]): string {
  if (rows.length === 0) return "";
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.type}::${r.target}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const top = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [type, target] = key.split("::");
      const label = LABELS[type] ?? type;
      return `${label} "${target}" (${count}x)`;
    });
  return top.join("; ");
}

// POST (re)computes match scores via one AI call and upserts them —
// triggered explicitly by the user ("Refresh matches"), never automatically
// on every render.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [{ data: profile }, { data: opportunities, error: oppsError }, { data: interactions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("opportunities").select("*").order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("user_interactions")
      .select("type, target")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (oppsError) return NextResponse.json({ error: oppsError.message }, { status: 500 });

  const interactionSummary = summarizeInteractions((interactions ?? []) as { type: string; target: string }[]);

  const { scores, error } = await computeMatchScores(
    profile as Profile | null,
    (opportunities ?? []) as Opportunity[],
    interactionSummary,
  );
  if (error) return NextResponse.json({ error }, { status: 502 });

  if (scores.length > 0) {
    const rows = scores.map((s) => ({
      user_id: user.id,
      opportunity_id: s.id,
      score: s.score,
      computed_at: new Date().toISOString(),
    }));
    const { error: upsertError } = await supabase
      .from("opportunity_matches")
      .upsert(rows, { onConflict: "user_id,opportunity_id" });
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ scores });
}
