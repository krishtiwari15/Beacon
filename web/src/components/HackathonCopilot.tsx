"use client";

import { useState } from "react";
import type { HackathonKit } from "@/lib/services/hackathonCopilot";

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]";

export default function HackathonCopilot() {
  const [theme, setTheme] = useState("");
  const [teamSkills, setTeamSkills] = useState("");
  const [hours, setHours] = useState(24);
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [busy, setBusy] = useState(false);
  const [kit, setKit] = useState<HackathonKit | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!theme.trim()) return;
    setBusy(true);
    setError(null);
    setKit(null);
    try {
      const res = await fetch("/api/hackathon-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, team_skills: teamSkills, hours_available: hours, difficulty }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setKit(data);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Hackathon Copilot
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Enter your hackathon theme and team skills to get an idea, a build plan, a pitch structure, and a
        submission checklist.
      </p>

      <form onSubmit={generate} className="mt-5 grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:grid-cols-2">
        <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Hackathon theme, e.g. Climate Tech" className={`${inputClass} sm:col-span-2`} />
        <input value={teamSkills} onChange={(e) => setTeamSkills(e.target.value)} placeholder="Team skills, e.g. React, Python, UI design" className={`${inputClass} sm:col-span-2`} />
        <input type="number" min={1} max={72} value={hours} onChange={(e) => setHours(Number(e.target.value))} placeholder="Hours available" className={inputClass} />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={`${inputClass} cursor-pointer`}>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <button
          type="submit"
          disabled={busy || !theme.trim()}
          className="h-[44px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          {busy ? "Building your kit…" : "Generate Hackathon Kit"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {kit && (
        <div className="mt-6 flex flex-col gap-6">
          {!!kit.ideas?.length && (
            <div>
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">💡 Project ideas</div>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {kit.ideas.map((idea) => (
                  <div key={idea.title} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
                    <div className="font-serif text-base font-semibold text-[var(--heading)]">{idea.title}</div>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{idea.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!!kit.team_plan?.length && (
            <div>
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">👥 Team plan</div>
              <div className="mt-2 flex flex-col gap-1.5">
                {kit.team_plan.map((t) => (
                  <div key={t.role} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm backdrop-blur-md">
                    <span className="font-medium text-[var(--text)]">{t.role}</span>
                    <span className="text-[var(--text-muted)]">{t.responsibility}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!!kit.build_plan?.length && (
            <div>
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">🛠️ Build plan</div>
              <div className="mt-2 flex flex-col gap-2">
                {kit.build_plan.map((phase, i) => (
                  <div key={i} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
                    <div className="text-sm font-semibold text-[var(--text)]">{phase.phase} <span className="text-[var(--text-muted)]">— {phase.hours}</span></div>
                    <ul className="mt-1 list-disc pl-5">
                      {phase.tasks.map((t, ti) => (
                        <li key={ti} className="text-sm text-[var(--text-muted)]">{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {kit.pitch && (
            <div>
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">🎤 Pitch assistant</div>
              <div className="mt-2 grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md sm:grid-cols-2">
                <div><b className="text-[var(--text)]">Problem:</b> <span className="text-[var(--text-muted)]">{kit.pitch.problem}</span></div>
                <div><b className="text-[var(--text)]">Solution:</b> <span className="text-[var(--text-muted)]">{kit.pitch.solution}</span></div>
                <div><b className="text-[var(--text)]">Market:</b> <span className="text-[var(--text-muted)]">{kit.pitch.market}</span></div>
                <div><b className="text-[var(--text)]">Innovation:</b> <span className="text-[var(--text-muted)]">{kit.pitch.innovation}</span></div>
                <div className="sm:col-span-2"><b className="text-[var(--text)]">Demo flow:</b> <span className="text-[var(--text-muted)]">{kit.pitch.demo_flow}</span></div>
                {!!kit.pitch.pitch_structure?.length && (
                  <div className="sm:col-span-2">
                    <b className="text-[var(--text)]">Pitch structure:</b>
                    <ol className="mt-1 list-decimal pl-5 text-sm text-[var(--text-muted)]">
                      {kit.pitch.pitch_structure.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {!!kit.submission_checklist?.length && (
            <div>
              <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">✅ Submission checklist</div>
              <div className="mt-2 flex flex-col gap-1">
                {kit.submission_checklist.map((c, i) => (
                  <label key={i} className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text)]">
                    <input type="checkbox" className="h-4 w-4 cursor-pointer accent-[var(--accent)]" />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
