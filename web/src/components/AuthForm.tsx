"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "signup" | "forgot";

const inputClass =
  "rounded-[12px] border border-[var(--border)] bg-black/[0.02] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export default function AuthForm() {
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Forgot-password is a manually-typed 6-digit code, not a clickable link —
  // corporate/email-provider security scanners auto-click links and burn the
  // one-time token before the real user ever sees it (very common issue),
  // which is why reset links were appearing to "expire within a minute".
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function submit() {
    setError(null);
    setInfo(null);
    setBusy(true);
    const supabase = createClient();
    try {
      if (tab === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setError(error.message);
        else setCodeSent(true);
      } else if (tab === "login") {
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

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "recovery",
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setInfo("✓ Password updated. You're now logged in.");
    } finally {
      setBusy(false);
    }
  }

  function backToLogin() {
    setTab("login");
    setCodeSent(false);
    setCode("");
    setNewPassword("");
    setError(null);
    setInfo(null);
  }

  if (tab === "forgot") {
    if (codeSent) {
      return (
        <div>
          <button onClick={backToLogin} className="cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            ← Back to log in
          </button>

          <p className="mt-3 text-sm text-[var(--text-muted)]">
            We sent a 6-digit code to <b>{email}</b>. Enter it below along with your new password. (Ignore
            any reset link in that email — the code is what to use.)
          </p>

          <form className="mt-4 flex flex-col gap-3" onSubmit={submitCode}>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-emerald-700">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Updating…" : "Reset password"}
            </button>
          </form>
        </div>
      );
    }

    return (
      <div>
        <button onClick={backToLogin} className="cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Back to log in
        </button>

        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Enter your email and we&apos;ll send you a 6-digit code to reset your password.
        </p>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send reset code"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 rounded-[12px] bg-black/5 p-1">
        {(["login", "signup"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 cursor-pointer rounded-[9px] py-1.5 text-sm font-medium transition-colors duration-200 ${
              tab === t ? "bg-[var(--accent)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text)]"
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

        {tab === "login" && (
          <button
            type="button"
            onClick={() => {
              setTab("forgot");
              setError(null);
              setInfo(null);
            }}
            className="-mt-1 cursor-pointer self-end text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Forgot password?
          </button>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
