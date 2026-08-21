"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "rounded-[12px] border border-[var(--border)] bg-black/[0.02] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)]/60 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // The reset-link redirect establishes a recovery session automatically
    // (createBrowserClient detects it from the URL) — just wait for it.
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 1500);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm rounded-[16px] border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-lg">
        <h1 className="font-serif text-xl font-semibold text-[var(--heading)]">Reset your password</h1>

        {!ready ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">Loading…</p>
        ) : !hasSession ? (
          <p className="mt-4 text-sm text-red-600">
            This reset link is invalid or has expired. Request a new one from the log in screen.
          </p>
        ) : done ? (
          <p className="mt-4 text-sm text-emerald-700">✓ Password updated. Redirecting you to Beacon…</p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <input
              type="password"
              required
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <input
              type="password"
              required
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-1 h-[46px] cursor-pointer rounded-[12px] bg-[var(--accent)] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
