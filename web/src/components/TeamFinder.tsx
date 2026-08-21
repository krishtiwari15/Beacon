"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type TeamRequest = {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  purpose: string;
  looking_for: string[];
  skills_offered: string[];
  status: string;
  created_at: string;
};

type Interest = { id: number; user_id: string; message: string | null; created_at: string };

const inputClass =
  "rounded-md border border-[var(--border)] bg-black/[0.02] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)]";

const PURPOSE_LABELS: Record<string, string> = {
  hackathon: "🏆 Hackathon",
  project: "🛠️ Project",
  competition: "🎯 Competition",
  startup: "🚀 Startup",
  research: "🔬 Research",
};

export default function TeamFinder({ user }: { user: User }) {
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("project");
  const [lookingFor, setLookingFor] = useState("");
  const [skillsOffered, setSkillsOffered] = useState("");
  const [posting, setPosting] = useState(false);
  const [interestsByRequest, setInterestsByRequest] = useState<Record<number, Interest[]>>({});
  const [expressForm, setExpressForm] = useState<number | null>(null);
  const [interestMessage, setInterestMessage] = useState("");
  const [myInterestIds, setMyInterestIds] = useState<Set<number>>(new Set());
  const [postError, setPostError] = useState<string | null>(null);

  async function load() {
    const supabase = createClient();
    const [reqRes, profileRes, interestRes] = await Promise.all([
      supabase.from("team_requests").select("*").eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("profiles").select("skills").eq("user_id", user.id).maybeSingle(),
      supabase.from("team_interests").select("request_id").eq("user_id", user.id),
    ]);
    setRequests((reqRes.data ?? []) as TeamRequest[]);
    setProfileSkills((profileRes.data?.skills as string[] | undefined) ?? []);
    setMyInterestIds(new Set((interestRes.data ?? []).map((r) => r.request_id as number)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const knownSkills = useMemo(() => new Set(profileSkills.map((s) => s.toLowerCase())), [profileSkills]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setPosting(true);
    setPostError(null);
    const res = await fetch("/api/team-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        purpose,
        looking_for: lookingFor.split(",").map((s) => s.trim()).filter(Boolean),
        skills_offered: skillsOffered.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      setPostError(data.error ?? "Couldn't post your request.");
      return;
    }
    setTitle("");
    setDescription("");
    setLookingFor("");
    setSkillsOffered("");
    setFormOpen(false);
    load();
  }

  async function closeRequest(id: number) {
    const supabase = createClient();
    await supabase.from("team_requests").update({ status: "closed" }).eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  async function loadInterests(requestId: number) {
    const supabase = createClient();
    const { data } = await supabase
      .from("team_interests")
      .select("id, user_id, message, created_at")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });
    setInterestsByRequest((prev) => ({ ...prev, [requestId]: (data ?? []) as Interest[] }));
  }

  async function expressInterest(requestId: number) {
    const supabase = createClient();
    const { error } = await supabase
      .from("team_interests")
      .insert({ request_id: requestId, user_id: user.id, message: interestMessage.trim() || null });
    if (!error) {
      setMyInterestIds((prev) => new Set(prev).add(requestId));
      setExpressForm(null);
      setInterestMessage("");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="h-48 animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--surface)] backdrop-blur-md" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
          Find Teammates
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
        >
          {formOpen ? "Cancel" : "+ Post a team request"}
        </button>
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Real requests from real Beacon students. Expressing interest sends a message only — nothing about
        you is shared beyond that until you choose to share it.
      </p>

      {formOpen && (
        <form onSubmit={post} className="mt-4 grid grid-cols-1 gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md sm:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title, e.g. Building a climate-tech hackathon project" required className={`${inputClass} sm:col-span-2`} />
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={`${inputClass} cursor-pointer`}>
            {Object.entries(PURPOSE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} placeholder="Looking for, comma-separated, e.g. UI Designer, ML Engineer" className={inputClass} />
          <input value={skillsOffered} onChange={(e) => setSkillsOffered(e.target.value)} placeholder="Skills you bring, comma-separated" className={`${inputClass} sm:col-span-2`} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className={`${inputClass} resize-none sm:col-span-2`} />
          <button type="submit" disabled={posting} className="h-[44px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">
            {posting ? "Posting…" : "Post request"}
          </button>
          {postError && <p className="text-sm text-red-600 sm:col-span-2">{postError}</p>}
        </form>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {requests.length === 0 ? (
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-12 text-center text-sm text-[var(--text-muted)] backdrop-blur-md">
            No open team requests yet — be the first to post one.
          </div>
        ) : (
          requests.map((r) => {
            const isOwner = r.user_id === user.id;
            const matches = r.looking_for.some((role) => knownSkills.has(role.toLowerCase()));
            const alreadyInterested = myInterestIds.has(r.id);
            return (
              <div key={r.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 font-serif text-lg font-semibold break-words text-[var(--heading)]">{r.title}</span>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">{PURPOSE_LABELS[r.purpose] ?? r.purpose}</span>
                </div>
                {r.description && <p className="mt-2 text-sm text-[var(--text)]">{r.description}</p>}

                {matches && !isOwner && (
                  <div className="mt-2 inline-block rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    🤝 Your skills match what they need
                  </div>
                )}

                {r.looking_for.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.looking_for.map((role) => (
                      <span key={role} className="rounded border border-[var(--accent)]/30 px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                        Looking for: {role}
                      </span>
                    ))}
                  </div>
                )}
                {r.skills_offered.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.skills_offered.map((s) => (
                      <span key={s} className="rounded border border-[var(--border)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {isOwner ? (
                  <div className="mt-4">
                    <button
                      onClick={() => loadInterests(r.id)}
                      className="cursor-pointer text-xs font-medium text-[var(--accent)] hover:underline"
                    >
                      View interested students →
                    </button>
                    <button
                      onClick={() => closeRequest(r.id)}
                      className="ml-3 cursor-pointer text-xs font-medium text-red-600 hover:underline"
                    >
                      Close this request
                    </button>
                    {interestsByRequest[r.id] && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {interestsByRequest[r.id].length === 0 ? (
                          <p className="text-xs text-[var(--text-muted)]">No interest yet.</p>
                        ) : (
                          interestsByRequest[r.id].map((i) => (
                            <div key={i.id} className="rounded-[12px] border border-[var(--border)] px-3 py-2 text-xs">
                              <p className="text-[var(--text)]">{i.message || "(no message)"}</p>
                              <p className="mt-0.5 text-[var(--text-muted)]">{new Date(i.created_at).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : alreadyInterested ? (
                  <p className="mt-4 text-xs text-emerald-700">✓ You&apos;ve expressed interest.</p>
                ) : expressForm === r.id ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <textarea
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      placeholder="Say why you'd be a good fit…"
                      rows={2}
                      className={`${inputClass} resize-none`}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => expressInterest(r.id)} className="cursor-pointer rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]">
                        Send
                      </button>
                      <button onClick={() => setExpressForm(null)} className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setExpressForm(r.id)}
                    className="mt-4 cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
                  >
                    Express interest
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
