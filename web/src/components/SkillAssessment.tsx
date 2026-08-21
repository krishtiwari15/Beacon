"use client";

import { useState } from "react";
import type { Question } from "@/lib/services/skillAssessment";

export default function SkillAssessment({ skill }: { skill: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setOpen(true);
    setScore(null);
    setError(null);
    if (questions) return;
    setLoading(true);
    try {
      const res = await fetch("/api/skill-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill }),
      });
      const data = await res.json();
      if (data.error || !Array.isArray(data.questions) || data.questions.length === 0) {
        setError(data.error ?? "The AI returned an unexpected response. Please try again.");
      } else {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(-1));
      }
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!questions) return;
    const correct = questions.filter((q, i) => answers[i] === q.correctIndex).length;
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    await fetch("/api/skill-assessment/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, score: pct }),
    });
  }

  if (!open) {
    return (
      <button
        onClick={start}
        className="cursor-pointer rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)]"
      >
        🎓 Take a quick self-assessment
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-[14px] border border-[var(--border)] bg-black/[0.015] p-4">
      <p className="text-xs text-[var(--text-muted)]">
        Informal, unproctored self-check — not an official certification.
      </p>

      {loading && <p className="mt-2 text-sm text-[var(--text-muted)]">Building your quiz…</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {questions && score === null && (
        <div className="mt-3 flex flex-col gap-4">
          {questions.map((q, qi) => (
            <div key={qi}>
              <div className="text-sm font-medium text-[var(--text)]">{qi + 1}. {q.question}</div>
              <div className="mt-1.5 flex flex-col gap-1">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-muted)]">
                    <input
                      type="radio"
                      name={`q${qi}`}
                      checked={answers[qi] === oi}
                      onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                      className="cursor-pointer accent-[var(--accent)]"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={submit}
            disabled={answers.some((a) => a === -1)}
            className="cursor-pointer rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit answers
          </button>
        </div>
      )}

      {score !== null && (
        <div className="mt-3 text-center">
          <div className="text-2xl font-semibold text-[var(--text)]">{score}%</div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Saved to your Proof-of-Skill profile.</p>
        </div>
      )}
    </div>
  );
}
