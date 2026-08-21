"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/profile";
import { Mentor, scoreMentorMatch } from "@/lib/mentors";

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

const EMPTY_FORM = {
  name: "",
  role: "",
  industry: "",
  skills: "",
  experience: "",
  location: "",
  bio: "",
  contact_email: "",
};

export default function Mentors({ user }: { user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [ownListing, setOwnListing] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const supabase = createClient();
    const [{ data: profileData }, { data: mentorRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("mentors").select("*").order("created_at", { ascending: false }),
    ]);
    setProfile((profileData as Profile) ?? null);
    const all = (mentorRows ?? []) as Mentor[];
    const mine = all.find((m) => m.user_id === user.id) ?? null;
    setOwnListing(mine);
    setMentors(all.filter((m) => m.user_id !== user.id));
    if (mine) {
      setForm({
        name: mine.name,
        role: mine.role,
        industry: mine.industry,
        skills: mine.skills.join(", "),
        experience: mine.experience ?? "",
        location: mine.location ?? "",
        bio: mine.bio ?? "",
        contact_email: mine.contact_email ?? "",
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function saveListing(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    await supabase.from("mentors").upsert({
      user_id: user.id,
      name: form.name,
      role: form.role,
      industry: form.industry,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      experience: form.experience || null,
      location: form.location || null,
      bio: form.bio || null,
      contact_email: form.contact_email || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    load();
  }

  async function removeListing() {
    const supabase = createClient();
    await supabase.from("mentors").delete().eq("user_id", user.id);
    setForm(EMPTY_FORM);
    setOwnListing(null);
    setFormOpen(false);
    load();
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="h-48 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  const ranked = [...mentors].sort(
    (a, b) =>
      scoreMentorMatch(b, profile?.skills ?? [], profile?.interests ?? "", profile?.career_goal ?? "") -
      scoreMentorMatch(a, profile?.skills ?? [], profile?.interests ?? "", profile?.career_goal ?? ""),
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          Mentors
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
        >
          {ownListing ? "Edit your mentor listing" : "Become a mentor"}
        </button>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        A real, student-run mentor directory — anyone on Beacon can register as a mentor for others.
        Ranked below by relevance to your saved profile.
      </p>

      {formOpen && (
        <form
          onSubmit={saveListing}
          className="mt-4 grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:grid-cols-2"
        >
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" required className={inputClass} />
          <input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Role, e.g. Senior Data Scientist" required className={inputClass} />
          <input value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Industry, e.g. Tech" required className={inputClass} />
          <input value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="Experience, e.g. 5 yrs" className={inputClass} />
          <input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Skills, comma-separated" className={`${inputClass} sm:col-span-2`} />
          <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Location" className={inputClass} />
          <input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="Contact email (optional, shown publicly)" type="email" className={inputClass} />
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Short bio — how you can help mentees" rows={3} className={`${inputClass} sm:col-span-2 resize-none`} />

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="h-[44px] flex-1 cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save my mentor listing"}
            </button>
            {ownListing && (
              <button
                type="button"
                onClick={removeListing}
                className="h-[44px] cursor-pointer rounded-[12px] border border-red-500/40 px-4 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-500/10"
              >
                Remove listing
              </button>
            )}
          </div>
          {saved && <p className="text-sm text-emerald-700 sm:col-span-2">✓ Saved — you&apos;re now listed as a mentor.</p>}
        </form>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {ranked.length === 0 ? (
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
            No mentors have registered yet — be the first with &quot;Become a mentor&quot; above.
          </div>
        ) : (
          ranked.map((m) => (
            <div key={m.user_id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-serif text-lg font-semibold text-[var(--heading)]">{m.name}</span>
                {(m.experience || m.location) && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {[m.experience, m.location].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-[var(--text-muted)]">{m.role} · {m.industry}</div>
              {m.bio && <p className="mt-2 text-sm text-[var(--text)]">{m.bio}</p>}
              {m.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.skills.map((s) => (
                    <span key={s} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {m.contact_email ? (
                <a
                  href={`mailto:${m.contact_email}`}
                  className="mt-4 inline-block cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
                >
                  Email {m.name.split(" ")[0]}
                </a>
              ) : (
                <p className="mt-3 text-xs text-[var(--text-muted)]">This mentor hasn&apos;t shared contact info.</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
