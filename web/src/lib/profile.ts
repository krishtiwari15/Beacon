export type Profile = {
  user_id: string;
  full_name: string | null;
  education: string | null;
  skills: string[];
  projects: string[];
  interests: string | null;
  career_goal: string | null;
  location: string | null;
  work_mode: string | null;
  age: string | null;
  cgpa: string | null;
  country: string | null;
  updated_at: string;
};

export type ProfileDraft = Omit<Profile, "user_id" | "updated_at" | "skills"> & { skills: string };
