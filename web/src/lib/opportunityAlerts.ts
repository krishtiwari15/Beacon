// OpportunityAlertService — deterministic, zero-AI, categorized in-app
// alerts. No push/email involved (deliberately, given how fragile
// transactional email delivery has proven for this project) — this is a
// feed the student sees when they open Beacon, respecting their own
// per-category preferences, capped so it never turns into spam.

import { Opportunity, daysUntil } from "@/lib/opportunities";

export type AlertPreferences = {
  high_match: boolean;
  deadline: boolean;
  new: boolean;
  funded: boolean;
  remote: boolean;
};

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  high_match: true,
  deadline: true,
  new: true,
  funded: true,
  remote: true,
};

export type Alert = { opportunity: Opportunity; category: keyof AlertPreferences; label: string };

const MAX_PER_CATEGORY = 2;
const MAX_TOTAL = 6;

export function generateAlerts(
  opportunities: Opportunity[],
  matchScores: Map<number, number>,
  savedIds: Set<number>,
  prefs: AlertPreferences,
): Alert[] {
  const buckets: Record<keyof AlertPreferences, Alert[]> = {
    high_match: [],
    deadline: [],
    new: [],
    funded: [],
    remote: [],
  };

  const threeDaysAgo = Date.now() - 3 * 86_400_000;

  for (const o of opportunities) {
    if (savedIds.has(o.id)) continue;

    const score = matchScores.get(o.id);
    if (prefs.high_match && score !== undefined && score >= 85 && buckets.high_match.length < MAX_PER_CATEGORY) {
      buckets.high_match.push({ opportunity: o, category: "high_match", label: `${score}% match` });
    }

    const d = daysUntil(o.deadline);
    if (prefs.deadline && d !== null && d >= 0 && d <= 3 && buckets.deadline.length < MAX_PER_CATEGORY) {
      buckets.deadline.push({ opportunity: o, category: "deadline", label: d === 0 ? "Closes today" : `${d} day${d === 1 ? "" : "s"} left` });
    }

    if (prefs.new && new Date(o.created_at).getTime() >= threeDaysAgo && buckets.new.length < MAX_PER_CATEGORY) {
      buckets.new.push({ opportunity: o, category: "new", label: "Newly discovered" });
    }

    const stipend = o.stipend || "";
    if (prefs.funded && stipend && !/unpaid|volunteer|not specified|free/i.test(stipend) && buckets.funded.length < MAX_PER_CATEGORY) {
      buckets.funded.push({ opportunity: o, category: "funded", label: "Funded" });
    }

    if (prefs.remote && o.work_mode === "Remote" && buckets.remote.length < MAX_PER_CATEGORY) {
      buckets.remote.push({ opportunity: o, category: "remote", label: "Remote" });
    }
  }

  const seen = new Set<number>();
  const all = [...buckets.high_match, ...buckets.deadline, ...buckets.new, ...buckets.funded, ...buckets.remote];
  const deduped = all.filter((a) => {
    if (seen.has(a.opportunity.id)) return false;
    seen.add(a.opportunity.id);
    return true;
  });

  return deduped.slice(0, MAX_TOTAL);
}
