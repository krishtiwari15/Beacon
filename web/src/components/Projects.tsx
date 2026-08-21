"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/profile";
import { Roadmap } from "@/lib/roadmap";
import type { ProjectIdea, ProjectTiers } from "@/lib/services/projectGenerator";

const inputClass =
  "flex-1 rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

function TierColumn({ label, projects }: { label: string; projects?: ProjectIdea[] }) {
  if (!projects?.length) return null;
  return (
    <div>
      <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
      <div className="mt-3 flex flex-col gap-3">
        {projects.map((p) => (
          <div key={p.title} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
            <div className="font-serif text-base font-semibold text-[var(--heading)]">{p.title}</div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{p.objective}</p>

            {p.tech_stack?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.tech_stack.map((t) => (
                  <span key={t} className="rounded border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {p.roadmap?.length > 0 && (
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-[var(--text)]">
                {p.roadmap.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}

            {p.dataset_suggestions?.length > 0 && (
              <div className="mt-2 text-xs text-[var(--text-muted)]">
                <b>Data:</b> {p.dataset_suggestions.join(", ")}
              </div>
            )}
            {p.portfolio_advice && (
              <div className="mt-2 text-xs text-[var(--text-muted)]">💡 {p.portfolio_advice}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Projects({ user }: { user: User }) {
  const [careerTitle, setCareerTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProjectTiers | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("roadmaps").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([roadmapRes, profileRes]) => {
      const roadmap = roadmapRes.data as Roadmap | null;
      const profile = profileRes.data as Profile | null;
      setCareerTitle(roadmap?.career_title || profile?.career_goal || "");
      setSkills(profile?.skills ?? []);
      setLoading(false);
    });
  }, [user.id]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!careerTitle.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/project-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career_title: careerTitle.trim(), skills }),
      });
      setResult(await res.json());
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="h-32 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Project Generator
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Pick a career and get project ideas across three difficulty tiers, tailored to your saved skills.
      </p>

      <form onSubmit={generate} className="mt-5 flex flex-wrap gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
        <input
          value={careerTitle}
          onChange={(e) => setCareerTitle(e.target.value)}
          placeholder="Career, e.g. Data Analyst"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy || !careerTitle.trim()}
          className="cursor-pointer rounded-[12px] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate projects"}
        </button>
      </form>

      {result?.error && <p className="mt-4 text-sm text-red-600">{result.error}</p>}

      {result && !result.error && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <TierColumn label="Beginner" projects={result.beginner} />
          <TierColumn label="Intermediate" projects={result.intermediate} />
          <TierColumn label="Advanced" projects={result.advanced} />
        </div>
      )}
    </div>
  );
}
