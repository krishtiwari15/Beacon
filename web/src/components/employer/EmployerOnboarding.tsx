"use client";

import { useState } from "react";
import type { Company } from "@/lib/employer";

const inputClass =
  "rounded-[12px] border border-[var(--border)] bg-black/[0.02] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export default function EmployerOnboarding({ onDone }: { onDone: (company: Company) => void }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/employer/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        website,
        industry,
        size,
        description,
        full_name: fullName,
        title,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't create your company profile.");
      return;
    }
    onDone(data.company);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
      <span className="font-serif text-2xl font-semibold tracking-tight text-[var(--heading)]">Set up your company</span>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        This creates your Beacon Employer profile — you&apos;ll be the owner and can invite other recruiters later.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-md">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" required className={inputClass} />
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Company website (optional)" className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry" className={inputClass} />
          <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Company size, e.g. 50-200" className={inputClass} />
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief company description" rows={3} className={`${inputClass} resize-none`} />
        <div className="mt-2 border-t border-[var(--border)] pt-3 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Your details</div>
        <div className="grid grid-cols-2 gap-3">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputClass} />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Your title, e.g. Talent Lead" className={inputClass} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="mt-1 h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create company profile"}
        </button>
      </form>
    </div>
  );
}
