"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";

type ChatMessage = { role: "user" | "assistant"; content: string; at: string };

const STARTERS = [
  "What career should I choose?",
  "What skills should I learn?",
  "What should I do this month?",
  "Why am I not getting selected?",
];

export default function Copilot({ user }: { user: User }) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/career-copilot")
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages ?? []);
        setLoading(false);
      });
  }, [user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed, at: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await fetch("/api/career-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply, at: new Date().toISOString() }]);
      }
    } finally {
      setSending(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-8">
      <div className="border-l-2 border-[var(--accent)] pl-3 text-sm font-semibold tracking-widest text-[var(--text)] uppercase">
        Career Copilot
      </div>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Your persistent AI career advisor — it knows your saved profile, roadmap progress, and saved
        opportunities.
      </p>

      <div className="mt-5 flex min-h-[420px] flex-1 flex-col rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]">
            Loading your conversation…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Ask anything about your career, skills, resume, or what to do next.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-[14px] px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--border)] bg-white/70 text-[var(--text)]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-[14px] border border-[var(--border)] bg-white/70 px-4 py-2.5 text-sm text-[var(--text-muted)]">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your Career Copilot anything…"
          className="flex-1 rounded-[12px] border border-[var(--border)] bg-black/[0.02] px-4 py-2.5 text-sm text-[var(--text)] outline-none transition-colors duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="cursor-pointer rounded-[12px] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
