"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  daysLeft,
  type Renewal,
} from "@/lib/renewals";
import RenewalCard from "./RenewalCard";
import MonthlyChart from "./MonthlyChart";

export default function Dashboard({ user }: { user: User }) {
  const supabase = createClient();
  const [items, setItems] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string[]>(CATEGORIES);

  async function loadRenewals() {
    const { data, error } = await supabase
      .from("renewals")
      .select("*")
      .order("expiry", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setItems(data as Renewal[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from("renewals")
        .select("*")
        .order("expiry", { ascending: true });
      if (ignore) return;
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setItems(data as Renewal[]);
      }
      setLoading(false);
    })();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addRenewal(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (name.trim() === "" || expiry === "") {
      setAddError("Please fill in a name and expiry date.");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("renewals").insert({
      user_id: user.id,
      name: name.trim(),
      category,
      expiry,
      notes: notes.trim(),
    });
    setAdding(false);
    if (error) {
      setAddError(error.message);
      return;
    }
    setName("");
    setNotes("");
    setExpiry("");
    await loadRenewals();
  }

  async function deleteRenewal(id: number) {
    await supabase.from("renewals").delete().eq("id", id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function toggleCategory(cat: string) {
    setCatFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  const visible = useMemo(
    () =>
      items.filter(
        (it) =>
          catFilter.includes(it.category) &&
          it.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, catFilter, search],
  );

  const sortedVisible = useMemo(
    () => [...visible].sort((a, b) => daysLeft(a.expiry) - daysLeft(b.expiry)),
    [visible],
  );

  const overdue = items.filter((it) => daysLeft(it.expiry) < 0).length;
  const soon = items.filter((it) => {
    const d = daysLeft(it.expiry);
    return d >= 0 && d <= 7;
  }).length;

  const monthlyCounts = useMemo(() => {
    const upcoming = items.filter((it) => daysLeft(it.expiry) >= 0);
    const counts = new Map<string, number>();
    for (const it of upcoming) {
      const month = it.expiry.slice(0, 7);
      counts.set(month, (counts.get(month) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [items]);

  const allCaughtUp =
    visible.length > 0 && visible.every((it) => daysLeft(it.expiry) > 7);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 gap-8 px-6 py-8">
      <aside className="w-64 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          ➕ Add a renewal
        </h2>
        <form onSubmit={addRenewal} className="mt-3 flex flex-col gap-2">
          <input
            placeholder="What is it? e.g. Bike Insurance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <button
            type="submit"
            disabled={adding}
            className="mt-1 rounded-md bg-zinc-900 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </form>

        <hr className="my-5 border-zinc-200 dark:border-zinc-800" />

        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          🔎 Filter
        </h2>
        <input
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-3 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="mt-3 flex flex-col gap-1.5">
          {CATEGORIES.map((c) => (
            <label
              key={c}
              className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <input
                type="checkbox"
                checked={catFilter.includes(c)}
                onChange={() => toggleCategory(c)}
              />
              {c}
            </label>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600">Could not load renewals: {error}</p>
        ) : (
          <>
            {items.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Stat label="Tracked" value={items.length} />
                  <Stat label="Due ≤ 7 days" value={soon} />
                  <Stat label="Expired" value={overdue} />
                </div>
                <MonthlyChart counts={monthlyCounts} />
              </>
            )}

            <hr className="my-5 border-zinc-200 dark:border-zinc-800" />

            {items.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Nothing yet. Add your first renewal from the sidebar 👈
              </p>
            ) : visible.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No renewals match your filters.
              </p>
            ) : (
              <>
                {allCaughtUp && (
                  <p className="mb-3 text-sm text-emerald-600">
                    ✅ Nothing urgent — you&apos;re all caught up!
                  </p>
                )}
                {sortedVisible.map((it) => (
                  <RenewalCard key={it.id} item={it} onDelete={deleteRenewal} />
                ))}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}
