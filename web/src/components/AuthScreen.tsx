"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "signup";

const inputClass =
  "rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/30";

export default function AuthScreen() {
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setInfo(null);
    setBusy(true);
    const supabase = createClient();
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) {
          setError(error.message);
        } else if (!data.session) {
          setInfo("Check your email to confirm your account, then log in.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#0a0a0a] px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.3em] text-zinc-600 uppercase">
          <span className="glow-pulse h-1.5 w-1.5 rounded-full bg-[#f5c518]" />
          Signal locked
        </div>
        <h1 className="glow-text font-display text-5xl font-black tracking-[0.15em] text-[#f5c518] uppercase sm:text-6xl">
          🛰️ Beacon
        </h1>
        <p className="mt-3 font-mono text-sm text-zinc-500">
          // Every opportunity, tracked, scored, and never missed.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <div className="glow-border rounded border border-[#262626] border-t-4 border-t-[#f5c518] bg-[#131313] p-8">
          <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 cursor-pointer rounded-md py-1.5 text-sm font-medium transition-colors duration-200 ${
                  tab === t ? "bg-[#f5c518] text-black" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t === "login" ? "🔑 Log in" : "✨ Sign up"}
              </button>
            ))}
          </div>

          <form
            className="mt-5 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {tab === "signup" && (
              <input
                type="text"
                required
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />

            {error && <p className="text-sm text-red-400">⚠️ {error}</p>}
            {info && <p className="text-sm text-emerald-400">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 cursor-pointer rounded-md bg-[#f5c518] py-2 text-sm font-bold text-black transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_18px_rgba(245,197,24,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
