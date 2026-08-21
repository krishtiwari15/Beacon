import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, MAX_POSTS_PER_HOUR, type CommunityCategory } from "@/lib/community";

// Real server-enforced posting rate limit — not just a client-side
// suggestion, since a client-side-only check can be bypassed by calling
// the REST API directly.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { category, title, body } = (await req.json()) as { category?: string; title?: string; body?: string };
  if (!category || !CATEGORIES.includes(category as CommunityCategory)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (!title?.trim() || title.trim().length < 3) {
    return NextResponse.json({ error: "Title is too short." }, { status: 400 });
  }
  if (!body?.trim() || body.trim().length < 10) {
    return NextResponse.json({ error: "Post body is too short." }, { status: 400 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("community_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= MAX_POSTS_PER_HOUR) {
    return NextResponse.json(
      { error: `You've hit the posting limit (${MAX_POSTS_PER_HOUR}/hour). Try again later.` },
      { status: 429 },
    );
  }

  const { data, error } = await supabase
    .from("community_posts")
    .insert({ user_id: user.id, category, title: title.trim(), body: body.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
