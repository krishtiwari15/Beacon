// ProofOfSkillService — deterministic, zero-AI evidence scoring per skill.
// "Proficiency" here is explicitly a rough proxy from real, visible
// evidence (projects that mention the skill, mentor registration for it) —
// never an invented mastery level. Each skill's proof list only contains
// things that are actually true.

export type SkillProof = { skill: string; proficiency: number; proof: string[] };

export function computeProofOfSkill(skills: string[], projects: string[], mentorSkills: string[]): SkillProof[] {
  const mentorSet = new Set(mentorSkills.map((s) => s.toLowerCase()));

  return skills.map((skill) => {
    const lower = skill.toLowerCase();
    const matchingProjects = projects.filter((p) => p.toLowerCase().includes(lower));
    const isMentorSkill = mentorSet.has(lower);

    const proof: string[] = [];
    if (matchingProjects.length > 0) {
      proof.push(`${matchingProjects.length} project${matchingProjects.length === 1 ? "" : "s"} mentioning this skill`);
    }
    if (isMentorSkill) {
      proof.push("Registered as a Beacon mentor for this skill");
    }

    // Base credit for listing the skill at all, plus real evidence on top —
    // capped at 100, never claims more certainty than the evidence supports.
    const proficiency = Math.min(100, 40 + matchingProjects.length * 25 + (isMentorSkill ? 20 : 0));

    return { skill, proficiency, proof };
  });
}
