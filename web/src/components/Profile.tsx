"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Profile as ProfileRow } from "@/lib/profile";

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

const EMPTY = {
  full_name: "",
  education: "",
  skills: "",
  interests: "",
  career_goal: "",
  location: "",
  work_mode: "",
  age: "",
  cgpa: "",
  country: "",
};

export default function Profile({ user }: { user: User }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else if (data) {
          const row = data as ProfileRow;
          setForm({
            full_name: row.full_name ?? "",
            education: row.education ?? "",
            skills: (row.skills ?? []).join(", "),
            interests: row.interests ?? "",
            career_goal: row.career_goal ?? "",
            location: row.location ?? "",
            work_mode: row.work_mode ?? "",
            age: row.age ?? "",
            cgpa: row.cgpa ?? "",
            country: row.country ?? "",
          });
        }
        setLoading(false);
      });
  }, [user.id]);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: form.full_name || null,
      education: form.education || null,
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      interests: form.interests || null,
      career_goal: form.career_goal || null,
      location: form.location || null,
      work_mode: form.work_mode || null,
      age: form.age || null,
      cgpa: form.cgpa || null,
      country: form.country || null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) setError(error.message);
    else setSaved(true);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="h-48 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Your Profile
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        This is your Beacon Career Twin — saved once, reused automatically across Eligibility, Resume
        Analyzer, and Career Copilot instead of re-typing it every time.
      </p>

      <form
        onSubmit={save}
        className="mt-5 grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:grid-cols-2"
      >
        <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Full name" className={inputClass} />
        <input value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="Age, e.g. 20" className={inputClass} />
        <input value={form.education} onChange={(e) => set("education", e.target.value)} placeholder="Education / Degree, e.g. BCA, 2nd year" className={inputClass} />
        <input value={form.cgpa} onChange={(e) => set("cgpa", e.target.value)} placeholder="CGPA / GPA, e.g. 8.5" className={inputClass} />
        <input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Skills, comma-separated, e.g. python, sql, excel" className={`${inputClass} sm:col-span-2`} />
        <input value={form.interests} onChange={(e) => set("interests", e.target.value)} placeholder="Interests, e.g. AI, web dev, data analytics" className={inputClass} />
        <input value={form.career_goal} onChange={(e) => set("career_goal", e.target.value)} placeholder="Career goal, e.g. land a remote internship" className={inputClass} />
        <input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Country, e.g. India" className={inputClass} />
        <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City/location" className={inputClass} />
        <select
          value={form.work_mode}
          onChange={(e) => set("work_mode", e.target.value)}
          className="cursor-pointer rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] sm:col-span-2"
        >
          <option value="">Preferred work mode</option>
          <option value="Remote">Remote</option>
          <option value="On-site">On-site</option>
          <option value="Hybrid">Hybrid</option>
        </select>

        <button
          type="submit"
          disabled={saving}
          className="h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-4 text-sm text-emerald-700">✓ Profile saved.</p>}
    </div>
  );
}
