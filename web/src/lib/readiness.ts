// Deterministic, zero-AI readiness estimate from real tag overlap — used
// to identify "Almost Ready" opportunities across a whole list cheaply.
// The richer AI-backed readiness (with strategy/prep advice) still comes
// from the Application Strategist when a student opens one specific
// opportunity; this is just the fast filter that decides which ones are
// worth showing in that list at all.

export function quickReadiness(profileSkills: string[], tags: string[]): { score: number; missing: string[] } {
  if (tags.length === 0) return { score: 100, missing: [] };
  const lower = new Set(profileSkills.map((s) => s.toLowerCase()));
  const missing = tags.filter((t) => !lower.has(t.toLowerCase()));
  const score = Math.round(((tags.length - missing.length) / tags.length) * 100);
  return { score, missing };
}
