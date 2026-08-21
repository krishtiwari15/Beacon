"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Roadmap } from "@/lib/roadmap";
import { Profile } from "@/lib/profile";
import type { SimDay } from "@/lib/services/careerSimulation";

type Simulation = {
  career_title: string;
  days: SimDay[];
  compatibility_score: number | null;
  strengths: string[] | null;
  challenges: string[] | null;
  recommendation: string | null;
  completed_at: string | null;
};

export default function CareerSimulation({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [sim, setSim] = useState<Simulation | null>(null);
  const [careerTitle, setCareerTitle] = useState("");
  const [starting, setStarting] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [responseDraft, setResponseDraft] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("career_simulations").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("roadmaps").select("career_title").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("career_goal").eq("user_id", user.id).maybeSingle(),
    ]).then(([simRes, roadmapRes, profileRes]) => {
      if (simRes.data) setSim(simRes.data as Simulation);
      const roadmap = roadmapRes.data as Pick<Roadmap, "career_title"> | null;
      const profile = profileRes.data as Pick<Profile, "career_goal"> | null;
      setCareerTitle(roadmap?.career_title || profile?.career_goal || "");
      setLoading(false);
    });
  }, [user.id]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!careerTitle.trim()) return;
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/career-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career_title: careerTitle.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSim(data.simulation);
        setDayIndex(0);
        setResponses([]);
        setResponseDraft("");
      }
    } finally {
      setStarting(false);
    }
  }

  function nextDay() {
    const next = [...responses];
    next[dayIndex] = responseDraft;
    setResponses(next);
    setResponseDraft(next[dayIndex + 1] ?? "");
    setDayIndex((d) => d + 1);
  }

  async function finish() {
    const finalResponses = [...responses];
    finalResponses[dayIndex] = responseDraft;
    setFinishing(true);
    setError(null);
    try {
      const res = await fetch("/api/career-simulation/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: finalResponses }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setSim(data.simulation);
    } finally {
      setFinishing(false);
    }
  }

  async function tryDifferent() {
    const supabase = createClient();
    await supabase.from("career_simulations").delete().eq("user_id", user.id);
    setSim(null);
    setDayIndex(0);
    setResponses([]);
    setResponseDraft("");
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="h-48 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  // Completed — show results.
  if (sim?.completed_at) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          Career Simulation Complete
        </div>
        <div className="mt-5 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 text-center backdrop-blur-md">
          <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Exploratory Career Compatibility — {sim.career_title}
          </div>
          <div className="mt-2 text-4xl font-semibold text-[var(--text)]">{sim.compatibility_score}%</div>
          <p className="mt-1 text-xs text-[var(--text-muted)] italic">
            An exploratory self-reflection estimate, not a scientific or psychological assessment.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!!sim.strengths?.length && (
            <div>
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Strengths shown</div>
              {sim.strengths.map((s, i) => (
                <div key={i} className="mt-1 text-sm text-emerald-700">✓ {s}</div>
              ))}
            </div>
          )}
          {!!sim.challenges?.length && (
            <div>
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Challenges</div>
              {sim.challenges.map((c, i) => (
                <div key={i} className="mt-1 text-sm text-amber-700">⚠ {c}</div>
              ))}
            </div>
          )}
        </div>

        {sim.recommendation && (
          <div className="mt-5 rounded-[14px] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4 text-sm text-[var(--text)]">
            💡 {sim.recommendation}
          </div>
        )}

        <button
          onClick={tryDifferent}
          className="mt-5 cursor-pointer rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
        >
          Try a different career
        </button>
      </div>
    );
  }

  // In progress.
  if (sim && !sim.completed_at) {
    const day = sim.days[dayIndex];
    const isLastDay = dayIndex === sim.days.length - 1;

    if (!day) {
      return (
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <p className="text-sm text-red-600">Something went wrong loading this day. Try a different career to restart.</p>
          <button onClick={tryDifferent} className="mt-3 cursor-pointer text-sm text-[var(--accent)] hover:underline">
            Start over
          </button>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          Career Simulation — {sim.career_title}
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Day {day.day} of {sim.days.length}</p>

        <div className="mt-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
          <div className="font-serif text-lg font-semibold text-[var(--heading)]">{day.title}</div>
          <p className="mt-2 text-sm text-[var(--text)]">{day.task}</p>

          <textarea
            value={responseDraft}
            onChange={(e) => setResponseDraft(e.target.value)}
            placeholder="How would you approach this? Write your response…"
            rows={5}
            className="mt-4 w-full resize-none rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
          />

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          {isLastDay ? (
            <button
              onClick={finish}
              disabled={finishing}
              className="mt-4 w-full cursor-pointer rounded-[12px] bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {finishing ? "Assessing your responses…" : "Finish Simulation"}
            </button>
          ) : (
            <button
              onClick={nextDay}
              className="mt-4 w-full cursor-pointer rounded-[12px] bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
            >
              Next day →
            </button>
          )}
        </div>
      </div>
    );
  }

  // No active simulation — start one.
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Career Simulation
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Try a career before committing to it — a 5-day simulated experience with realistic tasks, ending
        in an exploratory compatibility estimate.
      </p>

      <form onSubmit={start} className="mt-5 flex flex-wrap gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
        <input
          value={careerTitle}
          onChange={(e) => setCareerTitle(e.target.value)}
          placeholder="Career to try, e.g. Data Analyst"
          className="flex-1 rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={starting || !careerTitle.trim()}
          className="cursor-pointer rounded-[12px] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? "Building…" : "Start Simulation"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
