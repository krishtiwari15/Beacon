# Opportunity Radar 🎯

A platform that automatically finds and recommends opportunities students would otherwise miss — internships, scholarships, fellowships, remote jobs, hackathons, competitions, and research programs.

## Tech Stack
- **Backend:** FastAPI (Python)
- **Database:** SQLite + SQLAlchemy (ORM)
- **Frontend:** Streamlit *(in progress)*

## Features
- [x] REST API serving opportunities from a relational database
- [x] Three-table schema with many-to-many relationships
- [ ] Search and filtering
- [ ] User accounts and profiles
- [ ] Personalized recommendations
- [ ] Deadline tracking

## Running Locally
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m backend.seed
uvicorn backend.main:app --reload
```
Then visit http://127.0.0.1:8000/docs