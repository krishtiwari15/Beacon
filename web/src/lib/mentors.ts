export type Mentor = {
  user_id: string;
  name: string;
  role: string;
  industry: string;
  skills: string[];
  experience: string | null;
  location: string | null;
  bio: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
};

export function scoreMentorMatch(mentor: Mentor, profileSkills: string[], profileInterests: string, careerGoal: string): number {
  const haystack = `${profileInterests} ${careerGoal}`.toLowerCase();
  const skillOverlap = mentor.skills.filter((s) => profileSkills.some((ps) => ps.toLowerCase() === s.toLowerCase())).length;
  const textOverlap = mentor.skills.filter((s) => haystack.includes(s.toLowerCase())).length;
  const industryHit = haystack.includes(mentor.industry.toLowerCase()) ? 1 : 0;
  return skillOverlap * 3 + textOverlap + industryHit;
}
