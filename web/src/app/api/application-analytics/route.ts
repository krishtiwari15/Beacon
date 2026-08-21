import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAnalyticsInsights, type AnalyticsInput } from "@/lib/services/applicationAnalytics";

export const maxDuration = 30;

// Stats are computed client-side from data the user already has loaded
// (their own tracked applications) — this route only turns real,
// already-computed numbers into AI-phrased insights, no extra DB query.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const stats = (await req.json()) as AnalyticsInput;
  const result = await generateAnalyticsInsights(stats);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json(result);
}
