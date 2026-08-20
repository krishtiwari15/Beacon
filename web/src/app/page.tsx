"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import AuthScreen from "@/components/AuthScreen";
import Discover from "@/components/Discover";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#0d0d0d]">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const name = (user.user_metadata?.name as string | undefined) || user.email || "Explorer";

  return (
    <div className="flex flex-1 flex-col bg-[#0d0d0d]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-8">
        <div className="rounded border border-[#262626] border-t-4 border-t-[#f5c518] bg-[#131313] px-6 py-5">
          <h1 className="text-2xl font-black tracking-widest text-[#f5c518] uppercase">
            🛰️ Beacon
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">
            // Welcome back, {name.toUpperCase()}.
          </p>
        </div>
        <button
          onClick={() => createClient().auth.signOut()}
          className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:border-[#f5c518] hover:text-[#f5c518]"
        >
          🚪 Log out
        </button>
      </header>
      <Discover user={user} />
    </div>
  );
}
