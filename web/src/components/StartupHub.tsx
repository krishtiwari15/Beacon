"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import OpportunityCard from "@/components/OpportunityCard";
import CardSkeleton from "@/components/CardSkeleton";

type TaskItem = { text: string; done: boolean };
type Stage = { title: string; tasks: TaskItem[] };
type StartupPlan = { idea_title: string; stages: Stage[] };

const STARTUP_KEYWORDS = /startup|incubator|accelerator|founder/i;

export default function StartupHub({ user }: { user: User }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [plan, setPlan] = useState<StartupPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const [oppsRes, savedRes, planRes] = await Promise.all([
      supabase.from("opportunities").select("*").order("deadline", { ascending: true, nullsFirst: false }).limit(300),
      supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id),
      supabase.from("startup_roadmaps").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setOpportunities((oppsRes.data ?? []) as Opportunity[]);
    setSavedIds(new Set((savedRes.data ?? []).map((r) => r.opportunity_id as number)));
    setPlan((planRes.data as StartupPlan) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const startupOpportunities = useMemo(
    () =>
      opportunities.filter(
        (o) => STARTUP_KEYWORDS.test(o.category ?? "") || STARTUP_KEYWORDS.test(o.organization ?? "") || STARTUP_KEYWORDS.test(o.title),
      ),
    [opportunities],
  );

  async function toggleSave(id: number) {
    const supabase = createClient();
    const isSaved = savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    if (isSaved) {
      await supabase.from("saved_opportunities").delete().eq("user_id", user.id).eq("opportunity_id", id);
    } else {
      await supabase.from("saved_opportunities").insert({ user_id: user.id, opportunity_id: id, status: "saved" });
    }
  }

  async function buildPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!ideaTitle.trim()) return;
    setBuilding(true);
    setError(null);
    try {
      const res = await fetch("/api/startup-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea_title: ideaTitle.trim(), idea_description: ideaDescription.trim() }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setPlan(data.plan);
    } finally {
      setBuilding(false);
    }
  }

  async function toggleTask(stageIdx: number, taskIdx: number) {
    if (!plan) return;
    const nextStages = plan.stages.map((s, si) =>
      si !== stageIdx ? s : { ...s, tasks: s.tasks.map((t, ti) => (ti === taskIdx ? { ...t, done: !t.done } : t)) },
    );
    setPlan({ ...plan, stages: nextStages });
    const supabase = createClient();
    await supabase.from("startup_roadmaps").update({ stages: nextStages, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  }

  async function startOver() {
    const supabase = createClient();
    await supabase.from("startup_roadmaps").delete().eq("user_id", user.id);
    setPlan(null);
    setIdeaTitle("");
    setIdeaDescription("");
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <CardSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Startup & Entrepreneurship Hub
      </div>

      {plan ? (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 font-serif text-lg font-semibold break-words text-[var(--heading)]">Founder Mode: {plan.idea_title}</div>
            <button onClick={startOver} className="shrink-0 cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--accent)]">
              Start a different idea
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {plan.stages.map((stage, si) => (
              <div key={stage.title} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
                <div className="text-sm font-semibold text-[var(--heading)]">Stage {si + 1} — {stage.title}</div>
                <div className="mt-3 flex flex-col gap-2">
                  {stage.tasks.map((task, ti) => (
                    <label key={ti} className="flex cursor-pointer items-start gap-2.5 text-sm">
                      <input type="checkbox" checked={task.done} onChange={() => toggleTask(si, ti)} className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--accent)]" />
                      <span className={task.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]"}>{task.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            &quot;I want to build a startup.&quot; Describe your idea and Beacon builds an 8-stage plan:
            Idea → Problem Validation → Market Research → Prototype → MVP → Users → Pitch → Funding.
          </p>
          <form onSubmit={buildPlan} className="mt-5 flex flex-col gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
            <input
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
              placeholder="Idea title, e.g. Study-buddy matching app"
              className="rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
            />
            <textarea
              value={ideaDescription}
              onChange={(e) => setIdeaDescription(e.target.value)}
              placeholder="Briefly describe the idea…"
              rows={3}
              className="resize-none rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={building || !ideaTitle.trim()}
              className="h-[44px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {building ? "Building your plan…" : "Enter Founder Mode"}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </>
      )}

      <div className="mt-8">
        <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {startupOpportunities.length} startup-relevant opportunit{startupOpportunities.length === 1 ? "y" : "ies"}
        </div>
        <div className="mt-3 flex flex-col gap-4">
          {startupOpportunities.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
              No startup-tagged opportunities indexed right now.
            </div>
          ) : (
            startupOpportunities.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} saved={savedIds.has(o.id)} onToggleSave={() => toggleSave(o.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
