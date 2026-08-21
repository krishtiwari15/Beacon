"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/track";
import { Roadmap, roadmapProgress } from "@/lib/roadmap";
import type { CareerRecommendation } from "@/lib/services/careerRecommendation";
import type { QuizAnswers } from "@/lib/services/careerRecommendation";

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

const SELECT_OPTIONS = ["Low", "Medium", "High"];

const EMPTY_ANSWERS: QuizAnswers = {
  interests: "",
  strengths: "",
  workingStyle: "",
  problemSolving: "",
  techInterest: "",
  businessInterest: "",
  researchInterest: "",
  lifestyle: "",
  goals: "",
};

export default function Career({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY_ANSWERS);
  const [busy, setBusy] = useState(false);
  const [careers, setCareers] = useState<CareerRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRoadmap((data as Roadmap) ?? null);
        setLoading(false);
      });
  }, [user.id]);

  function set<K extends keyof QuizAnswers>(key: K, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function submitQuiz(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCareers(null);
    try {
      const res = await fetch("/api/career-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setCareers(data.careers ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function buildRoadmap(careerTitle: string) {
    setBuilding(careerTitle);
    setError(null);
    track("career_view", careerTitle);
    try {
      const res = await fetch("/api/career-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career_title: careerTitle }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setRoadmap(data.roadmap as Roadmap);
    } finally {
      setBuilding(null);
    }
  }

  async function toggleTask(stageIdx: number, taskIdx: number) {
    if (!roadmap) return;
    const previous = roadmap;
    const now = new Date().toISOString();
    const nextStages = roadmap.stages.map((stage, si) =>
      si !== stageIdx
        ? stage
        : {
            ...stage,
            tasks: stage.tasks.map((t, ti) =>
              // done_at makes completions genuinely dateable for the Weekly
              // Career Review — never set for un-checking, only when a task
              // is actually marked done.
              ti === taskIdx ? { ...t, done: !t.done, done_at: !t.done ? now : undefined } : t,
            ),
          },
    );
    const next = { ...roadmap, stages: nextStages };
    setRoadmap(next);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("roadmaps")
      .update({ stages: nextStages, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (updateError) {
      setRoadmap(previous);
      setError("Couldn't save that change — please try again.");
    }
  }

  async function startOver() {
    const supabase = createClient();
    await supabase.from("roadmaps").delete().eq("user_id", user.id);
    setRoadmap(null);
    setCareers(null);
    setAnswers(EMPTY_ANSWERS);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="h-48 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  if (roadmap) {
    const progress = roadmapProgress(roadmap);
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 break-words border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
            Goal: {roadmap.career_title}
          </div>
          <button
            onClick={startOver}
            className="shrink-0 cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--text)]"
          >
            Choose a different career
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            <span>Roadmap progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {roadmap.stages.map((stage, si) => (
            <div key={stage.title} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
              <div className="text-sm font-semibold text-[var(--heading)]">
                Stage {si + 1} — {stage.title}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {stage.tasks.map((task, ti) => (
                  <label key={ti} className="flex cursor-pointer items-start gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(si, ti)}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--accent)]"
                    />
                    <span className={task.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]"}>
                      {task.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Career Discovery
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Don&apos;t know what career you want yet? Answer a few questions and Beacon will suggest career
        paths ranked by compatibility, then build you a step-by-step roadmap.
      </p>

      <form
        onSubmit={submitQuiz}
        className="mt-5 grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md"
      >
        <input value={answers.interests} onChange={(e) => set("interests", e.target.value)} placeholder="Interests / subjects you enjoy" className={inputClass} />
        <input value={answers.strengths} onChange={(e) => set("strengths", e.target.value)} placeholder="Your strengths" className={inputClass} />
        <select value={answers.workingStyle} onChange={(e) => set("workingStyle", e.target.value)} className={`${inputClass} cursor-pointer`}>
          <option value="">Preferred working style</option>
          <option value="Working with people">Working with people</option>
          <option value="Working with technology/data">Working with technology/data</option>
          <option value="A mix of both">A mix of both</option>
        </select>
        <select value={answers.problemSolving} onChange={(e) => set("problemSolving", e.target.value)} className={`${inputClass} cursor-pointer`}>
          <option value="">Problem-solving preference</option>
          <option value="Creative / design-driven">Creative / design-driven</option>
          <option value="Analytical / logical">Analytical / logical</option>
          <option value="Structured / process-driven">Structured / process-driven</option>
        </select>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select value={answers.techInterest} onChange={(e) => set("techInterest", e.target.value)} className={`${inputClass} cursor-pointer`}>
            <option value="">Technology interest</option>
            {SELECT_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select value={answers.businessInterest} onChange={(e) => set("businessInterest", e.target.value)} className={`${inputClass} cursor-pointer`}>
            <option value="">Business interest</option>
            {SELECT_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select value={answers.researchInterest} onChange={(e) => set("researchInterest", e.target.value)} className={`${inputClass} cursor-pointer`}>
            <option value="">Research interest</option>
            {SELECT_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <input value={answers.lifestyle} onChange={(e) => set("lifestyle", e.target.value)} placeholder="Desired lifestyle / work environment, e.g. remote, flexible hours" className={inputClass} />
        <input value={answers.goals} onChange={(e) => set("goals", e.target.value)} placeholder="Career goals" className={inputClass} />

        <button
          type="submit"
          disabled={busy}
          className="h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Thinking…" : "Find my career paths"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!!careers?.length && (
        <div className="mt-5">
          <div className="border-l-2 border-[var(--accent)] pl-3 text-xs font-semibold tracking-widest text-[var(--text)] uppercase">
            Your potential career paths
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {careers.map((c) => (
              <div key={c.title} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="min-w-0 break-words font-serif text-lg font-semibold text-[var(--heading)]">{c.title}</span>
                  <span className="shrink-0 rounded-full border border-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                    {c.compatibility}% compatibility
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{c.why}</p>
                {!!c.skills_required?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.skills_required.map((s) => (
                      <span key={s} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-[var(--text-muted)] sm:grid-cols-2">
                  <span><b>Salary:</b> {c.salary_range}</span>
                  <span><b>Education:</b> {c.education_requirements}</span>
                </div>
                <button
                  onClick={() => buildRoadmap(c.title)}
                  disabled={building === c.title}
                  className="mt-4 cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {building === c.title ? "Building your roadmap…" : "Build my roadmap for this"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
