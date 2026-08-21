# 🛰️ Beacon

**An AI-powered Career OS for students** — discover opportunities, get AI-scored matches, build a personalized career roadmap, and get a persistent AI advisor that actually knows your profile.

🔗 **Live app:** https://beacon-delta-jade.vercel.app

---

## What is Beacon?

Beacon started as a simple opportunity aggregator and grew into a full career platform. It answers five questions for every student: *Who am I? What can I become? What do I need to learn? What opportunities can I get? What should I do next?*

---

## Features

- **Home** — a "so what" dashboard: profile strength, career goal, roadmap progress, top-matched opportunities, next actions, deadline alerts, and rule-based career insights, all in one place.
- **Discover** — search/filter real opportunities (type, work mode, difficulty, paid/funded only), with AI match scores against your saved profile.
- **Global Map** — explore opportunities grouped by real location data.
- **Planner** — deadline urgency dashboard.
- **My Applications** — a five-stage tracker (Saved → Applied → Interview → Rejected → Accepted) with live stats.
- **Career & Roadmap** — a career-discovery quiz that recommends career paths by compatibility %, then generates a 6-stage roadmap with checkbox progress tracking.
- **Project Generator** — pick a career, get Beginner/Intermediate/Advanced project ideas with tech stack, step-by-step roadmap, and portfolio advice.
- **Skill Graph** — real skill tags pulled from real opportunities; click one to see how many opportunities it unlocks plus AI-suggested learning resources.
- **AI Eligibility** — 🟢/🟡/🔴 eligibility verdicts, pre-filled from your saved profile.
- **Resume Analyzer** — match your resume against a specific opportunity, or run a general Profile Strength analysis that saves extracted skills into your profile.
- **Mentors** — a real, student-run mentor directory (register yourself, others find you ranked by relevance).
- **Career Copilot** — a persistent, context-aware AI chat advisor grounded in your actual profile, roadmap, and saved opportunities.
- **Profile ("Beacon Career Twin")** — the persistent data layer everything else reads from, plus full transparency into what interaction data is logged, with a one-click clear.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Backend/DB** | Supabase (Postgres, Auth, Row-Level Security) |
| **AI** | Groq (OpenAI-compatible chat completions), modular service layer |
| **Hosting** | Vercel (frontend + serverless API routes + Cron) |
| **Data sources** | Remotive, Himalayas, Arbeitnow, Grants.gov (all free, real APIs); USAJobs (optional, needs your own free key) |

---

## Architecture

- **Next.js App Router** — one Vercel deployment serves the UI and all API routes.
- **Supabase Auth** — handles accounts natively; no custom password hashing.
- **Row-Level Security** — every table is scoped so users can only read/write their own data; the service-role key (used only by the collector) never reaches the browser.
- **AI service layer** (`web/src/lib/services/`) — each AI feature (matching, resume analysis, career recommendations, roadmap generation, the Copilot, skill resources, project generation) is its own module with its own prompt, not inlined into UI components.
- **Collector** (`/api/collect`, Vercel Cron) — an adapter-pattern ETL pipeline: each source has its own fetcher normalizing into a common shape, dedupes across sources, and automatically removes expired opportunities (except any a student has saved/tracked).

---

## Running it locally

**Prerequisites:** Node 20+, a free [Supabase](https://supabase.com) project, a free [Groq API key](https://console.groq.com/keys).

```bash
# 1. Clone the repo
git clone https://github.com/krishtiwari15/Beacon.git
cd Beacon/web

# 2. Install dependencies
npm install

# 3. Set up environment variables (.env.local)
#    NEXT_PUBLIC_SUPABASE_URL=...
#    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#    SUPABASE_SERVICE_ROLE_KEY=...
#    GROQ_API_KEY=...

# 4. Run the Supabase migrations
#    Paste each file in supabase/migrations/ (in order) into the
#    Supabase SQL Editor, or use the Supabase CLI.

# 5. Run the dev server
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Status

All core features above are live and working. This project has gone through several architecture migrations (originally a Streamlit + FastAPI + Render stack) and is now fully on Vercel + Supabase.
