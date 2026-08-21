// ProofOfSkillService — deterministic, zero-AI evidence scoring per skill.
// "Proficiency" here is explicitly a rough proxy from real, visible
// evidence (projects that mention the skill, mentor registration for it) —
// never an invented mastery level. Each skill's proof list only contains
// things that are actually true.

export type SkillProof = { skill: string; proficiency: number; proof: string[] };

export function computeProofOfSkill(
  skills: string[],
  projects: string[],
  mentorSkills: string[],
  assessmentScores: Map<string, number> = new Map(),
): SkillProof[] {
  const mentorSet = new Set(mentorSkills.map((s) => s.toLowerCase()));

  return skills.map((skill) => {
    const lower = skill.toLowerCase();
    const matchingProjects = projects.filter((p) => p.toLowerCase().includes(lower));
    const isMentorSkill = mentorSet.has(lower);
    const assessmentScore = assessmentScores.get(lower);

    const proof: string[] = [];
    if (matchingProjects.length > 0) {
      proof.push(`${matchingProjects.length} project${matchingProjects.length === 1 ? "" : "s"} mentioning this skill`);
    }
    if (isMentorSkill) {
      proof.push("Registered as a Beacon mentor for this skill");
    }
    if (assessmentScore !== undefined) {
      proof.push(`Self-assessment score: ${assessmentScore}% (informal, unproctored)`);
    }

    // Base credit for listing the skill at all, plus real evidence on top —
    // capped at 100, never claims more certainty than the evidence supports.
    const proficiency = Math.min(
      100,
      40 + matchingProjects.length * 20 + (isMentorSkill ? 15 : 0) + (assessmentScore !== undefined ? Math.round(assessmentScore * 0.25) : 0),
    );

    return { skill, proficiency, proof };
  });
}
