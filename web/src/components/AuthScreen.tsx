"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "signup";

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
    <div className="flex flex-1 items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded border border-[#262626] border-t-4 border-t-[#f5c518] bg-[#131313] p-8">
          <h1 className="font-display text-3xl font-black tracking-widest text-[#f5c518] uppercase">
            🛰️ Beacon
          </h1>
          <p className="mt-2 font-mono text-sm text-zinc-500">
            // Sign in to track your opportunities.
          </p>

          <div className="mt-6 flex gap-1 rounded-lg bg-zinc-900 p-1">
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError(null);
                  setInfo(null);
                }}
                className={`flex-1 cursor-pointer rounded-md py-1.5 text-sm font-medium transition-colors duration-200 ${
                  tab === t
                    ? "bg-[#f5c518] text-black"
                    : "text-zinc-400 hover:text-zinc-200"
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
                className="rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-[#f5c518] focus:ring-2 focus:ring-[#f5c518]/30"
              />
            )}
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#f5c518]"
            />
            <input
              type="password"
              required
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#f5c518]"
            />

            {error && <p className="text-sm text-red-400">⚠️ {error}</p>}
            {info && <p className="text-sm text-emerald-400">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 cursor-pointer rounded-md bg-[#f5c518] py-2 text-sm font-bold text-black transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
