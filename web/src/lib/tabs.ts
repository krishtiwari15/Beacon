import {
  LayoutDashboard,
  Compass,
  ClipboardList,
  Sparkles,
  FileText,
  MessagesSquare,
  CalendarClock,
  UserCircle,
  Route,
  Network,
  Globe2,
  Users,
  Hammer,
  FlaskConical,
  Microscope,
  Trophy,
  UsersRound,
  Rocket,
  MessageCircle,
  FileBarChart,
  CalendarCheck2,
  Briefcase,
} from "lucide-react";

// Flat tab list (single source of truth for TabId), then grouped separately
// for nav display (§19: "avoid overcrowding, use dropdowns or grouped
// sections where necessary") instead of one flat 12-item list. Lives in its
// own module (not app/page.tsx) so components like FeatureTour can import it
// without creating a circular import with the page itself.
export const TABS = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "jobs", label: "Direct Jobs", icon: Briefcase },
  { id: "map", label: "Global Map", icon: Globe2 },
  { id: "research", label: "Research", icon: Microscope },
  { id: "planner", label: "Planner", icon: CalendarClock },
  { id: "tracker", label: "My Applications", icon: ClipboardList },
  { id: "career", label: "Career & Roadmap", icon: Route },
  { id: "simulation", label: "Career Simulation", icon: FlaskConical },
  { id: "projects", label: "Project Generator", icon: Hammer },
  { id: "hackathon", label: "Hackathon Copilot", icon: Trophy },
  { id: "startup", label: "Startup Hub", icon: Rocket },
  { id: "skills", label: "Skill Graph", icon: Network },
  { id: "eligibility", label: "AI Eligibility", icon: Sparkles },
  { id: "resume", label: "Resume Analyzer", icon: FileText },
  { id: "mentors", label: "Mentors", icon: Users },
  { id: "team", label: "Find Teammates", icon: UsersRound },
  { id: "community", label: "Community", icon: MessageCircle },
  { id: "copilot", label: "Career Copilot", icon: MessagesSquare },
  { id: "report", label: "Career Report", icon: FileBarChart },
  { id: "weekly", label: "Weekly Review", icon: CalendarCheck2 },
  { id: "profile", label: "Profile", icon: UserCircle },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export const NAV_GROUPS: { label: string | null; ids: TabId[] }[] = [
  { label: null, ids: ["home"] },
  { label: "Opportunities", ids: ["discover", "jobs", "map", "research", "planner", "tracker"] },
  { label: "Career", ids: ["career", "simulation", "projects", "hackathon", "startup", "skills", "eligibility", "resume"] },
  { label: "Connect", ids: ["mentors", "team", "community"] },
  { label: "AI & You", ids: ["copilot", "report", "weekly", "profile"] },
];
