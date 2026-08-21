"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import { Profile } from "@/lib/profile";
import OpportunityCard from "@/components/OpportunityCard";

type Match = Opportunity & { match: number; reason: string };

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export default function Copilot({ user }: { user: User }) {
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [goals, setGoals] = useState("");
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [fromProfile, setFromProfile] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const p = data as Profile;
        setEducation(p.education ?? "");
        setSkills((p.skills ?? []).join(", "));
        setInterests(p.interests ?? "");
        setGoals(p.career_goal ?? "");
        setFromProfile(true);
      });
  }, [user.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMatches(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ education, skills, interests, goals }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setMatches(data.matches ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function save(opportunityId: number) {
    const supabase = createClient();
    setSavedIds((prev) => new Set(prev).add(opportunityId));
    await supabase.from("saved_opportunities").insert({ user_id: user.id, opportunity_id: opportunityId, status: "saved" });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Career Copilot
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {fromProfile
          ? "Pre-filled from your saved profile — edit anything below, and the AI will scan all opportunities to find your best-fit matches."
          : "Tell us about yourself, and the AI will scan all opportunities to find your best-fit matches. Tip: save this info once on the Profile tab and it'll be pre-filled here next time."}
      </p>

      <form
        onSubmit={submit}
        className="mt-5 grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:grid-cols-2"
      >
        <input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Education / Degree, e.g. BCA, 2nd year" className={inputClass} />
        <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Your skills, e.g. python, html, sql" className={inputClass} />
        <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Your interests, e.g. AI, web dev" className={inputClass} />
        <input value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Your goals, e.g. land a remote internship" className={inputClass} />
        <button
          type="submit"
          disabled={busy}
          className="h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          {busy ? "AI is scanning all opportunities…" : "Find my best matches"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {matches && matches.length === 0 && !error && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">No strong matches found. Try adding more detail to your skills and interests.</p>
      )}

      {!!matches?.length && (
        <div className="mt-5">
          <div className="border-l-2 border-[var(--accent)] pl-3 text-xs font-semibold tracking-widest text-[var(--text)] uppercase">
            Your top matches
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {matches.map((m) => (
              <div key={m.id}>
                <OpportunityCard opportunity={m} saved={savedIds.has(m.id)} onToggleSave={() => save(m.id)} />
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-xs font-semibold text-white">
                    {m.match}% MATCH
                  </span>
                  <span className="text-sm text-[var(--text-muted)] italic">{m.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
