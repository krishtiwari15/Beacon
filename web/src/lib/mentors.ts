// DEMO mentor directory — clearly marked as preview/demo data in the UI.
// There is no real mentor data source wired up yet; this exists so the
// matching UX itself is real and testable, per "clearly marked mock/demo
// functionality" rather than fabricating fake real-looking listings.

export type Mentor = {
  name: string;
  role: string;
  industry: string;
  skills: string[];
  experience: string;
  location: string;
  bio: string;
};

export const DEMO_MENTORS: Mentor[] = [
  { name: "Priya Nair", role: "Senior Data Scientist", industry: "Tech", skills: ["python", "ml", "sql", "statistics"], experience: "8 yrs", location: "Bengaluru, India", bio: "Leads a fraud-detection ML team; enjoys mentoring students breaking into data science." },
  { name: "Daniel Osei", role: "Founder", industry: "Startups", skills: ["product", "fundraising", "leadership"], experience: "12 yrs", location: "Remote", bio: "Two-time founder; mentors early-career students on product thinking and startup life." },
  { name: "Wei Chen", role: "Frontend Engineer", industry: "Tech", skills: ["react", "typescript", "nextjs", "css"], experience: "5 yrs", location: "Remote", bio: "Works on developer tools; enjoys code review mentoring for React/TS beginners." },
  { name: "Amara Okoye", role: "UX Researcher", industry: "Design", skills: ["ux", "research", "design", "figma"], experience: "6 yrs", location: "Lagos, Nigeria", bio: "Runs user research for a fintech app; mentors students on portfolio building." },
  { name: "Lucas Fernandes", role: "Machine Learning Researcher", industry: "Research", skills: ["ml", "deep learning", "python", "research"], experience: "PhD candidate", location: "Remote", bio: "PhD student in NLP; mentors undergrads exploring research career paths." },
  { name: "Sofia Marchetti", role: "Product Designer", industry: "Design", skills: ["design", "figma", "ux", "prototyping"], experience: "7 yrs", location: "Milan, Italy", bio: "Design lead at a mid-size SaaS company; mentors on design systems and career growth." },
  { name: "Rahul Mehta", role: "Backend Engineer", industry: "Tech", skills: ["python", "sql", "systems", "backend"], experience: "9 yrs", location: "Remote", bio: "Infrastructure engineer; enjoys mentoring on system design fundamentals." },
  { name: "Grace Kim", role: "Senior CS Student", industry: "Tech", skills: ["python", "react", "opensource"], experience: "4th year", location: "Remote", bio: "About to graduate; mentors first- and second-year students on internship applications." },
];

export function scoreMentorMatch(mentor: Mentor, profileSkills: string[], profileInterests: string, careerGoal: string): number {
  const haystack = `${profileInterests} ${careerGoal}`.toLowerCase();
  const skillOverlap = mentor.skills.filter((s) => profileSkills.some((ps) => ps.toLowerCase() === s.toLowerCase())).length;
  const textOverlap = mentor.skills.filter((s) => haystack.includes(s.toLowerCase())).length;
  const industryHit = haystack.includes(mentor.industry.toLowerCase()) ? 1 : 0;
  return skillOverlap * 3 + textOverlap + industryHit;
}
