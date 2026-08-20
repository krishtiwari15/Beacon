export type Renewal = {
  id: number;
  user_id: string;
  name: string;
  category: string;
  expiry: string; // YYYY-MM-DD
  notes: string;
};

export const CATEGORY_ICONS: Record<string, string> = {
  Warranty: "🧾",
  Insurance: "🛡️",
  "Driving Licence": "🚗",
  FASTag: "🛣️",
  "AMC / Service": "🔧",
  Domain: "🌐",
  Subscription: "💳",
  Document: "📄",
  Other: "📌",
};

export const CATEGORIES = Object.keys(CATEGORY_ICONS);
export const HORIZON = 90;

export function daysLeft(expiry: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiry}T00:00:00`);
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000);
}

export function styleFor(days: number): {
  label: string;
  color: string;
  tint: string;
} {
  if (days < 0) return { label: "🔴 Expired", color: "#d64545", tint: "#fdecec" };
  if (days <= 7) return { label: "🟠 Due soon", color: "#e08a1e", tint: "#fdf3e3" };
  if (days <= 30) return { label: "🟡 Coming up", color: "#c9a227", tint: "#fbf8e3" };
  return { label: "🟢 On track", color: "#2e9e5b", tint: "#e9f7ef" };
}

export function progressPct(days: number): number {
  if (days <= 0) return 100;
  if (days >= HORIZON) return 0;
  return Math.round(((HORIZON - days) / HORIZON) * 100);
}

export function makeIcs(item: Renewal): string {
  const dt = item.expiry.replace(/-/g, "");
  const summary = `Renew: ${item.name}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RenewalTracker//EN",
    "BEGIN:VEVENT",
    `UID:${item.id}@renewaltracker`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${item.category} renewal reminder`,
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${summary} (7 days left)`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\n");
}
