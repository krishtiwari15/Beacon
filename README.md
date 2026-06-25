# Opportunity Radar 🎯

A platform that automatically finds and recommends opportunities students would otherwise miss — internships, scholarships, fellowships, remote jobs, hackathons, competitions, and research programs.

## Why this project?

Students miss out on opportunities every day because they're scattered across hundreds of websites, newsletters, and Discord servers. Opportunity Radar brings them into one place and surfaces the ones that fit your profile.

## Tech Stack

- **Backend:** FastAPI (Python)
- **Database:** SQLite + SQLAlchemy (ORM)
- **Frontend:** Streamlit *(in progress)*
- **Version control:** Git + GitHub

## Features

- [x] REST API serving opportunities from a relational database
- [x] Three-table schema with many-to-many relationships (users, opportunities, saved)
- [x] Database seeded with 30 real opportunities
- [ ] Search and filtering (by type, location, deadline)
- [ ] User accounts and profiles
- [ ] Personalized recommendations
- [ ] Deadline tracking and reminders

## Running Locally

```bash
# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with sample opportunities
python -m backend.seed

# Start the server
uvicorn backend.main:app --reload
```

Then visit **http://127.0.0.1:8000/docs** to explore the API.

## Project Status

🚧 Actively in development — building the frontend next.
