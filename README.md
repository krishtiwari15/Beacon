# 🛰️ Beacon

**A full-stack platform that helps students discover opportunities, track their applications, and get AI-powered guidance — all in one place.**

🔗 **Live app:** https://beacon-frontend-1qfs.onrender.com
*(Hosted on Render's free tier — the first load may take ~50 seconds while the server wakes up.)*

---

## What is Beacon?

Students miss out on internships, scholarships, fellowships, and hackathons simply because opportunities are scattered across dozens of sites and easy to lose track of. Beacon brings them together into a single, searchable hub — then adds an application tracker and four AI-powered tools to help students find the *right* opportunities and put their best foot forward.

It's not just a list. Beacon aggregates live opportunities from multiple sources automatically, and uses a real large language model (Google Gemini) to assess eligibility, review résumés, and recommend personalized matches.

---

## Features

### 🔍 Discover
Search and filter opportunities by type, work mode, and difficulty. Each listing shows a colour-coded deadline countdown, stipend, eligibility, and source logo.

### 📋 Application Tracker
Save opportunities and track them through a five-stage pipeline (Saved → Applied → Interview → Rejected → Accepted), with a live dashboard showing totals and acceptance rate.

### 🤖 AI Eligibility Checker
Enter your profile and get an AI verdict — Eligible, Partially Eligible, or Not Eligible — with specific reasons and suggestions, powered by Google Gemini.

### 📄 AI Résumé Analyzer
Upload your résumé (PDF) and receive an AI match score out of 10 against any opportunity, with strengths, gaps, and actionable improvements.

### 🧭 Career Copilot
Describe your skills, interests, and goals, and the AI scans every opportunity in the database to recommend your best-fit matches — each with a match percentage and a reason.

### 📅 Planner
An at-a-glance digest and deadline timeline across all opportunities, colour-coded by urgency, so nothing slips through the cracks.

### ⚙️ Live Collection Engine
A multi-source ETL pipeline that automatically pulls real opportunities from three live job APIs (Remotive, Himalayas, Arbeitnow), normalizes them into a unified format, and deduplicates across sources.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI (Python) |
| **Frontend** | Streamlit |
| **Database** | PostgreSQL (production) / SQLite (local) via SQLAlchemy ORM |
| **AI** | Google Gemini API |
| **Data sources** | Remotive, Himalayas, Arbeitnow APIs |
| **Hosting** | Render (backend, frontend, database) |
| **PDF parsing** | pypdf |

---

## Architecture

Beacon is built as three connected services:

- **FastAPI backend** — exposes a REST API for opportunities, the application tracker, and all AI features. Handles database access and all Gemini calls.
- **Streamlit frontend** — the user interface, which talks to the backend over HTTP.
- **PostgreSQL database** — stores opportunities, users, and saved applications.

The backend keeps all AI logic in one module and all database configuration environment-aware, so the same codebase runs locally on SQLite and in production on PostgreSQL with no code changes.

---

## Running it locally

**Prerequisites:** Python 3.12+, a free [Google Gemini API key](https://aistudio.google.com/app/apikey).

```bash
# 1. Clone the repo
git clone https://github.com/krishtiwari15/Opportunity-Radar.git
cd Opportunity-Radar

# 2. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Add your Gemini key to a .env file in the project root
#    (this file is gitignored and never committed)
echo GEMINI_API_KEY=your_key_here > .env

# 5. Set up the database
python -m backend.seed         # add starter opportunities
python -m backend.seed_user    # add the demo user
python -m backend.collector    # pull live opportunities (optional)

# 6. Run the backend (terminal 1)
uvicorn backend.main:app --reload

# 7. Run the frontend (terminal 2)
streamlit run frontend/app.py
```

The app will open at `http://localhost:8501`.

---

## Engineering highlights

A few things I'm proud of in this build:

- **Secure secret management** — the Gemini API key lives in environment variables (a gitignored `.env` locally, a host secret in production) and never touches the codebase or version control.
- **Multi-source aggregation with the adapter pattern** — each external API has its own fetcher that translates its data into a common schema, with per-source error handling so one failing source doesn't break the others.
- **Environment-aware database** — automatically uses SQLite locally and PostgreSQL in production based on a single environment variable.
- **Graceful AI error handling** — rate limits and API errors are caught and translated into calm, user-facing messages.

---

## Roadmap

- [x] Opportunity discovery with search & filters
- [x] Application tracker with dashboard
- [x] Live multi-source collection engine
- [x] AI eligibility checker
- [x] AI résumé analyzer
- [x] AI career recommendations
- [x] Deadline planner
- [x] Live deployment
- [ ] User accounts & authentication
- [ ] Automated scheduled collection
- [ ] Email deadline reminders

---

## About

Beacon was built as a learning project to bring together full-stack development, real third-party API integration, and applied AI in a single product students could actually use.