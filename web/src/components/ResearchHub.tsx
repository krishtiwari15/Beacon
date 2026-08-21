"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Opportunity } from "@/lib/opportunities";
import { Profile } from "@/lib/profile";
import { Mentor } from "@/lib/mentors";
import OpportunityCard from "@/components/OpportunityCard";
import CardSkeleton from "@/components/CardSkeleton";

const RESEARCH_TYPES = new Set(["research", "fellowship", "grant"]);

export default function ResearchHub({ user }: { user: User }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const supabase = createClient();
    const [oppsRes, savedRes, profileRes, mentorsRes] = await Promise.all([
      supabase.from("opportunities").select("*").order("deadline", { ascending: true, nullsFirst: false }).limit(300),
      supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", user.id),
      supabase.from("profiles").select("research_interests").eq("user_id", user.id).maybeSingle(),
      supabase.from("mentors").select("*").limit(200),
    ]);
    setOpportunities((oppsRes.data ?? []) as Opportunity[]);
    setSavedIds(new Set((savedRes.data ?? []).map((r) => r.opportunity_id as number)));
    setInterests((profileRes.data as Pick<Profile, "research_interests"> | null)?.research_interests ?? "");
    setMentors((mentorsRes.data ?? []) as Mentor[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const researchOpportunities = useMemo(
    () => opportunities.filter((o) => RESEARCH_TYPES.has(o.type ?? "") || /research/i.test(o.category ?? "")),
    [opportunities],
  );

  // Real registered Beacon mentors/students whose bio, skills, or industry
  // text mentions the student's research interests — a plain keyword match
  // among real people, never an invented professor or lab.
  const relatedMentors = useMemo(() => {
    if (!interests.trim()) return [];
    const keywords = interests.toLowerCase().split(/[,;]+/).map((k) => k.trim()).filter(Boolean);
    if (keywords.length === 0) return [];
    return mentors.filter((m) => {
      const haystack = `${m.bio ?? ""} ${m.skills.join(" ")} ${m.industry}`.toLowerCase();
      return keywords.some((k) => haystack.includes(k));
    });
  }, [mentors, interests]);

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

  async function saveInterests(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").upsert({ user_id: user.id, research_interests: interests || null });
    setSaving(false);
    setSaved(true);
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
        Research Opportunities
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Real research internships, fellowships, and funding indexed by Beacon. Beacon doesn&apos;t have a
        professor or lab directory, so &quot;find researchers&quot; here means real, registered Beacon
        mentors and students with related interests — never an invented academic.
      </p>

      <form onSubmit={saveInterests} className="mt-5 flex flex-wrap gap-2 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-md">
        <input
          value={interests}
          onChange={(e) => {
            setInterests(e.target.value);
            setSaved(false);
          }}
          placeholder="Your research interests, comma-separated, e.g. machine learning, public health"
          className="flex-1 rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-[12px] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <p className="w-full text-xs text-emerald-700">✓ Saved.</p>}
      </form>

      {relatedMentors.length > 0 && (
        <div className="mt-6">
          <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Beacon mentors & students with related interests
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {relatedMentors.map((m) => (
              <div key={m.user_id} className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm backdrop-blur-md">
                <div className="font-medium text-[var(--text)]">{m.name} — {m.role}</div>
                <div className="text-xs text-[var(--text-muted)]">{m.bio}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {researchOpportunities.length} research-relevant opportunit{researchOpportunities.length === 1 ? "y" : "ies"}
        </div>
        <div className="mt-3 flex flex-col gap-4">
          {researchOpportunities.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
              No research-tagged opportunities indexed right now.
            </div>
          ) : (
            researchOpportunities.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} saved={savedIds.has(o.id)} onToggleSave={() => toggleSave(o.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
