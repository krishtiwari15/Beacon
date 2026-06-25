# collector.py — fetches real internships from the Remotive API and adds
# any new ones to our database. Run manually with:  python -m backend.collector
#
# This is an ETL pipeline:
#   Extract  -> call the Remotive API
#   Transform-> reshape each job into OUR opportunity format
#   Load     -> save new ones to the database (skipping duplicates)

import requests
from datetime import date
from backend.database import SessionLocal, engine, Base
from backend.models import Opportunity

# Make sure tables exist (safe to run).
Base.metadata.create_all(bind=engine)

# Remotive's free public API. We ask only for software-dev jobs and limit
# the count, to stay polite (their docs ask for few requests per day).
REMOTIVE_URL = "https://remotive.com/api/remote-jobs?category=software-dev&limit=20"


def extract():
    """EXTRACT: fetch the raw job list from Remotive's API."""
    print("Fetching jobs from Remotive...")
    response = requests.get(REMOTIVE_URL, timeout=20)
    response.raise_for_status()          # error out if the request failed
    data = response.json()
    jobs = data.get("jobs", [])
    print(f"  Received {len(jobs)} jobs from the API.")
    return jobs


def transform(job):
    """TRANSFORM: turn one Remotive job into OUR opportunity dictionary.
    Remotive's field names differ from ours, so we map them across."""

    # Remotive marks some jobs as "internship" in job_type; default to remote_job.
    job_type = "internship" if job.get("job_type") == "internship" else "remote_job"

    # Their tags come as a list; we store a comma-separated string like our seed data.
    tags_list = job.get("tags", []) or []
    tags = ",".join(tags_list[:5])       # keep it to the first 5 tags

    return {
        "title": job.get("title", "Untitled Role"),
        "type": job_type,
        "category": job.get("category", "Tech"),
        "organization": job.get("company_name", "Unknown"),
        "location": job.get("candidate_required_location", "Remote"),
        "eligibility": "Open to applicants",
        "deadline": None,                # Remotive doesn't give a deadline
        "source_url": job.get("url", ""),
        "tags": tags,
        "stipend": job.get("salary") or "Not specified",
        "difficulty": "Intermediate",    # API doesn't say; sensible default
        "work_mode": "Remote",           # Remotive is a remote-only board
        "logo_url": job.get("company_logo", ""),
    }


def load(opportunities_data):
    """LOAD: save new opportunities, skipping ones we already have.
    We use source_url as the unique fingerprint to avoid duplicates."""
    db = SessionLocal()
    added = 0
    skipped = 0
    try:
        for data in opportunities_data:
            url = data["source_url"]
            if not url:
                continue   # skip jobs with no link

            # DEDUPLICATION: does an opportunity with this URL already exist?
            exists = db.query(Opportunity).filter(Opportunity.source_url == url).first()
            if exists:
                skipped += 1
                continue

            db.add(Opportunity(**data))
            added += 1

        db.commit()
        print(f"  Added {added} new opportunities. Skipped {skipped} duplicates.")
    finally:
        db.close()


def collect():
    """Run the full pipeline: Extract -> Transform -> Load."""
    jobs = extract()
    transformed = [transform(job) for job in jobs]
    load(transformed)
    print("Collection complete.")


if __name__ == "__main__":
    collect()