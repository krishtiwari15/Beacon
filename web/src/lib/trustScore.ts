// TrustScore — deterministic, rule-based, computed entirely client-side
// from fields already on the opportunity. No AI, no fabrication: every
// checkmark is traceable to a real field. If something can't be verified
// from available data, it's shown as unverifiable, never guessed.

import type { Opportunity } from "@/lib/opportunities";

export type TrustCheck = { label: string; passed: boolean };
export type TrustResult = {
  score: number;
  tier: "Highly Trusted" | "Trusted" | "Needs Verification" | "Low Confidence";
  checks: TrustCheck[];
};

const KNOWN_SOURCE_DOMAINS = [
  "grants.gov",
  "usajobs.gov",
  "remotive.com",
  "himalayas.app",
  "arbeitnow.com",
];

function domainOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function looksOfficial(opportunity: Opportunity): boolean {
  const domain = domainOf(opportunity.source_url);
  if (!domain) return false;
  if (KNOWN_SOURCE_DOMAINS.some((d) => domain.endsWith(d))) return true;
  if (domain.endsWith(".gov") || domain.endsWith(".edu")) return true;
  // Organization name appears in the domain (e.g. "Vercel" -> vercel.com).
  const org = (opportunity.organization ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return org.length > 2 && domain.toLowerCase().replace(/[^a-z0-9.]/g, "").includes(org);
}

export function computeTrustScore(opportunity: Opportunity): TrustResult {
  const checks: TrustCheck[] = [
    { label: "Organization identified", passed: !!opportunity.organization && opportunity.organization !== "Unknown" },
    { label: "Application domain looks official", passed: looksOfficial(opportunity) },
    {
      label: "Specific eligibility criteria",
      passed: !!opportunity.eligibility && opportunity.eligibility.length > 20 && !/^open to (applicants|everyone)\.?$/i.test(opportunity.eligibility.trim()),
    },
    { label: "Clear deadline", passed: !!opportunity.deadline },
    {
      label: "Compensation disclosed",
      passed: !!opportunity.stipend && !/not specified/i.test(opportunity.stipend),
    },
    { label: "Organization branding present", passed: !!opportunity.logo_url },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  let tier: TrustResult["tier"];
  if (score >= 90) tier = "Highly Trusted";
  else if (score >= 75) tier = "Trusted";
  else if (score >= 50) tier = "Needs Verification";
  else tier = "Low Confidence";

  return { score, tier, checks };
}
