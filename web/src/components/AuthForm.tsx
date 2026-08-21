"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "signup";

const inputClass =
  "rounded-[12px] border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors duration-200 placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20";

export default function AuthForm() {
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
    <div>
      <div className="flex gap-1 rounded-[12px] bg-white/5 p-1">
        {(["login", "signup"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 cursor-pointer rounded-[9px] py-1.5 text-sm font-[450] transition-colors duration-200 ${
              tab === t ? "bg-[#E9E9E9] text-[#0A0707]" : "text-white/60 hover:text-white"
            }`}
          >
            {t === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex flex-col gap-3"
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

        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 h-[46px] cursor-pointer rounded-[12px] bg-[#E9E9E9] text-sm font-[450] text-[#0A0707] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
