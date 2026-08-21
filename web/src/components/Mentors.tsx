"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/profile";
import { DEMO_MENTORS, scoreMentorMatch } from "@/lib/mentors";

export default function Mentors({ user }: { user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile((data as Profile) ?? null);
        setLoading(false);
      });
  }, [user.id]);

  const ranked = [...DEMO_MENTORS].sort(
    (a, b) =>
      scoreMentorMatch(b, profile?.skills ?? [], profile?.interests ?? "", profile?.career_goal ?? "") -
      scoreMentorMatch(a, profile?.skills ?? [], profile?.interests ?? "", profile?.career_goal ?? ""),
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="h-48 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Mentor Matching
      </div>
      <div className="mt-3 rounded-[12px] border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-800">
        ⚠️ Demo mentors for preview only — this directory isn&apos;t connected to real people yet. Matching
        against your saved profile is real; the mentors themselves are sample data.
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {ranked.map((m) => (
          <div key={m.name} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-serif text-lg font-semibold text-[var(--heading)]">{m.name}</span>
              <span className="text-xs text-[var(--text-muted)]">{m.experience} · {m.location}</span>
            </div>
            <div className="mt-1 text-sm text-[var(--text-muted)]">{m.role} · {m.industry}</div>
            <p className="mt-2 text-sm text-[var(--text)]">{m.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {m.skills.map((s) => (
                <span key={s} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                  {s}
                </span>
              ))}
            </div>
            <button
              onClick={() => setRequested((prev) => new Set(prev).add(m.name))}
              disabled={requested.has(m.name)}
              className="mt-4 cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {requested.has(m.name) ? "Requested (demo)" : "Request intro (demo)"}
            </button>
            {requested.has(m.name) && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                This is a demo — mentor introductions aren&apos;t wired to a real notification system yet.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
