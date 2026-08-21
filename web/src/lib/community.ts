export type CommunityCategory =
  | "careers"
  | "coding"
  | "data"
  | "design"
  | "business"
  | "research"
  | "entrepreneurship"
  | "study_abroad"
  | "scholarships"
  | "hackathons";

export const CATEGORY_LABELS: Record<CommunityCategory, string> = {
  careers: "Careers",
  coding: "Coding",
  data: "Data",
  design: "Design",
  business: "Business",
  research: "Research",
  entrepreneurship: "Entrepreneurship",
  study_abroad: "Study Abroad",
  scholarships: "Scholarships",
  hackathons: "Hackathons",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as CommunityCategory[];

export type CommunityPost = {
  id: number;
  user_id: string;
  category: CommunityCategory;
  title: string;
  body: string;
  hidden: boolean;
  created_at: string;
};

export type CommunityComment = {
  id: number;
  post_id: number;
  user_id: string;
  body: string;
  created_at: string;
};

// Real, server-enforced anti-spam levers.
export const MAX_POSTS_PER_HOUR = 5;
export const MAX_COMMENTS_PER_HOUR = 20;
export const MAX_TEAM_REQUESTS_PER_HOUR = 5;
export const REPORTS_TO_AUTO_HIDE = 3;
