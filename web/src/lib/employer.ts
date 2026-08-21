export type VerificationStatus = "unverified" | "pending" | "verified";

export type Company = {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  logo_url: string | null;
  description: string | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Recruiter = {
  id: number;
  user_id: string;
  company_id: number;
  role: "owner" | "recruiter";
  full_name: string | null;
  title: string | null;
  created_at: string;
};

export type JobType = "internship" | "job" | "apprenticeship";
export type JobStatus = "draft" | "active" | "closed";

export type Job = {
  id: number;
  company_id: number;
  posted_by: string;
  title: string;
  type: JobType;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  eligibility: string | null;
  experience_level: string | null;
  location: string | null;
  work_mode: string | null;
  compensation: string | null;
  application_deadline: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
};

export type ApplicationStatus = "applied" | "shortlisted" | "interview" | "rejected" | "offered" | "hired";

export type JobApplication = {
  id: number;
  job_id: number;
  student_user_id: string;
  status: ApplicationStatus;
  recruiter_notes: string | null;
  applied_at: string;
  updated_at: string;
};

export const APPLICATION_STAGES: { id: ApplicationStatus; label: string }[] = [
  { id: "applied", label: "Applied" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "offered", label: "Offered" },
  { id: "hired", label: "Hired" },
  { id: "rejected", label: "Rejected" },
];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  internship: "Internship",
  job: "Full-time Job",
  apprenticeship: "Apprenticeship",
};
