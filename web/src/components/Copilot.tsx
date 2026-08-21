"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import OpportunityCard from "@/components/OpportunityCard";

type Match = Opportunity & { match: number; reason: string };

const inputClass =
  "rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors duration-200 focus:border-white/40 focus:ring-2 focus:ring-white/20";

export default function Copilot({ user }: { user: User }) {
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [goals, setGoals] = useState("");
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

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
      <div className="border-l-2 border-white pl-3 text-sm font-[450] tracking-widest text-white uppercase">
        Career Copilot
      </div>
      <p className="mt-2 text-sm text-white/50">
        Tell us about yourself, and the AI will scan all opportunities to find your best-fit matches.
      </p>

      <form
        onSubmit={submit}
        className="mt-5 grid grid-cols-1 gap-3 rounded-[16px] border border-white/[0.08] bg-[rgba(17,16,15,0.35)] p-5 backdrop-blur-[20px] sm:grid-cols-2"
      >
        <input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Education / Degree, e.g. BCA, 2nd year" className={inputClass} />
        <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Your skills, e.g. python, html, sql" className={inputClass} />
        <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Your interests, e.g. AI, web dev" className={inputClass} />
        <input value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Your goals, e.g. land a remote internship" className={inputClass} />
        <button
          type="submit"
          disabled={busy}
          className="h-[46px] cursor-pointer rounded-[12px] bg-[#E9E9E9] text-sm font-[450] text-[#0A0707] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          {busy ? "AI is scanning all opportunities…" : "Find my best matches"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {matches && matches.length === 0 && !error && (
        <p className="mt-4 text-sm text-white/50">No strong matches found. Try adding more detail to your skills and interests.</p>
      )}

      {!!matches?.length && (
        <div className="mt-5">
          <div className="border-l-2 border-white pl-3 text-xs font-[450] tracking-widest text-white uppercase">
            Your top matches
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {matches.map((m) => (
              <div key={m.id}>
                <OpportunityCard opportunity={m} saved={savedIds.has(m.id)} onToggleSave={() => save(m.id)} />
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-[#E9E9E9] px-2 py-0.5 text-xs font-[450] text-[#0A0707]">
                    {m.match}% MATCH
                  </span>
                  <span className="text-sm text-white/50 italic">{m.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
