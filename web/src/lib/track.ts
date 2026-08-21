// Fire-and-forget interaction logging — never blocks the UI action it's
// attached to (e.g. an "Apply" link navigating away). See §22
// "Personalization Engine": non-sensitive product interactions only.

export type InteractionType = "apply_click" | "skill_view" | "career_view";

export function track(type: InteractionType, target: string) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, target }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let tracking failures affect the UI.
  }
}
