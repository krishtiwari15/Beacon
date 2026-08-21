import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { replyAsRecruiterCopilot, type ChatMessage } from "@/lib/services/recruiterCopilot";

export const maxDuration = 30;

async function requireRecruiter(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: recruiter } = await supabase
    .from("recruiters")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();
  return recruiter;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data } = await supabase
    .from("recruiter_conversations")
    .select("messages")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ messages: (data?.messages as ChatMessage[]) ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const recruiter = await requireRecruiter(supabase, user.id);
  if (!recruiter) return NextResponse.json({ error: "You're not registered as a recruiter." }, { status: 403 });

  const { message } = (await req.json()) as { message?: string };
  if (!message?.trim()) return NextResponse.json({ error: "Message is empty." }, { status: 400 });

  const [{ data: convoRow }, { data: company }, { data: jobs }] = await Promise.all([
    supabase.from("recruiter_conversations").select("messages").eq("user_id", user.id).maybeSingle(),
    supabase.from("companies").select("name").eq("id", recruiter.company_id).single(),
    supabase.from("jobs").select("id, title, status").eq("company_id", recruiter.company_id),
  ]);

  const jobIds = (jobs ?? []).map((j) => j.id as number);
  const { data: applications } = jobIds.length
    ? await supabase.from("job_applications").select("job_id").in("job_id", jobIds)
    : { data: [] as { job_id: number }[] };

  const countByJob = new Map<number, number>();
  (applications ?? []).forEach((a) => {
    countByJob.set(a.job_id as number, (countByJob.get(a.job_id as number) ?? 0) + 1);
  });

  const jobSummaries = (jobs ?? []).map((j) => ({
    id: j.id as number,
    title: j.title as string,
    status: j.status as string,
    applicantCount: countByJob.get(j.id as number) ?? 0,
  }));

  const history = ((convoRow?.messages as ChatMessage[]) ?? []).slice();

  const { reply, error } = await replyAsRecruiterCopilot(message.trim(), history, company?.name ?? "your company", jobSummaries);

  if (error || !reply) {
    return NextResponse.json({ error: error ?? "The Copilot couldn't respond. Try again." }, { status: 502 });
  }

  const now = new Date().toISOString();
  const nextMessages: ChatMessage[] = [
    ...history,
    { role: "user", content: message.trim(), at: now },
    { role: "assistant", content: reply, at: now },
  ];

  await supabase
    .from("recruiter_conversations")
    .upsert({ user_id: user.id, messages: nextMessages, updated_at: now }, { onConflict: "user_id" });

  return NextResponse.json({ reply });
}
