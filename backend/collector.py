# collector.py — fetches real opportunities from MULTIPLE free job APIs and adds
# new ones to our database. Run manually with:  python -m backend.collector
#
# ETL pipeline with the ADAPTER pattern: each source has its own fetcher that
# translates that API's data into OUR common opportunity format. One shared
# loader then saves everything, deduplicating by source_url.
#
# Sources (all free, no API key):
#   - Remotive   (remote software jobs)
#   - Himalayas  (verified remote jobs)        — asks: link back & credit Himalayas
#   - Arbeitnow  (Europe / remote tech jobs)

import requests
from backend.database import SessionLocal, engine, Base
from backend.models import Opportunity

Base.metadata.create_all(bind=engine)

REMOTIVE_URL = "https://remotive.com/api/remote-jobs?category=software-dev&limit=20"
HIMALAYAS_URL = "https://himalayas.app/jobs/api?limit=20"
ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"


def _tags_to_str(tags_list, limit=5):
    """Turn a list of tags into our comma-separated string (first N)."""
    tags_list = tags_list or []
    return ",".join(str(t) for t in tags_list[:limit])


# ---------------------------------------------------------------------
# FETCHERS — one per source. Each returns a list of OUR opportunity dicts.
# Each is wrapped so that if one source is down, the others still work.
# ---------------------------------------------------------------------

def fetch_remotive():
    print("Fetching from Remotive...")
    try:
        r = requests.get(REMOTIVE_URL, timeout=20)
        r.raise_for_status()
        jobs = r.json().get("jobs", [])
        print(f"  Remotive: {len(jobs)} jobs.")
        out = []
        for job in jobs:
            job_type = "internship" if job.get("job_type") == "internship" else "remote_job"
            out.append({
                "title": job.get("title", "Untitled Role"),
                "type": job_type,
                "category": job.get("category", "Tech"),
                "organization": job.get("company_name", "Unknown"),
                "location": job.get("candidate_required_location", "Remote"),
                "eligibility": "Open to applicants",
                "deadline": None,
                "source_url": job.get("url", ""),
                "tags": _tags_to_str(job.get("tags")),
                "stipend": job.get("salary") or "Not specified",
                "difficulty": "Intermediate",
                "work_mode": "Remote",
                "logo_url": job.get("company_logo", ""),
            })
        return out
    except requests.exceptions.RequestException as e:
        print(f"  Remotive failed: {e}")
        return []


def fetch_himalayas():
    print("Fetching from Himalayas...")
    try:
        r = requests.get(HIMALAYAS_URL, timeout=20)
        r.raise_for_status()
        jobs = r.json().get("jobs", [])
        print(f"  Himalayas: {len(jobs)} jobs.")
        out = []
        for job in jobs:
            # Himalayas fields differ; map what we can, default the rest.
            locations = job.get("locationRestrictions") or []
            location = ", ".join(locations) if locations else "Remote"
            out.append({
                "title": job.get("title", "Untitled Role"),
                "type": "remote_job",
                "category": (job.get("categories") or ["Tech"])[0] if job.get("categories") else "Tech",
                "organization": job.get("companyName", "Unknown"),
                "location": location,
                "eligibility": "Open to applicants",
                "deadline": None,
                "source_url": job.get("applicationLink") or job.get("guid", ""),
                "tags": _tags_to_str(job.get("categories")),
                "stipend": "Not specified",
                "difficulty": "Intermediate",
                "work_mode": "Remote",
                "logo_url": job.get("companyLogo", ""),
            })
        return out
    except requests.exceptions.RequestException as e:
        print(f"  Himalayas failed: {e}")
        return []


def fetch_arbeitnow():
    print("Fetching from Arbeitnow...")
    try:
        r = requests.get(ARBEITNOW_URL, timeout=20)
        r.raise_for_status()
        jobs = r.json().get("data", [])
        # Arbeitnow returns many; cap to 20 to stay light and balanced.
        jobs = jobs[:20]
        print(f"  Arbeitnow: {len(jobs)} jobs.")
        out = []
        for job in jobs:
            remote = job.get("remote", False)
            out.append({
                "title": job.get("title", "Untitled Role"),
                "type": "remote_job" if remote else "internship",
                "category": (job.get("job_types") or ["Tech"])[0] if job.get("job_types") else "Tech",
                "organization": job.get("company_name", "Unknown"),
                "location": job.get("location", "Europe"),
                "eligibility": "Open to applicants",
                "deadline": None,
                "source_url": job.get("url", ""),
                "tags": _tags_to_str(job.get("tags")),
                "stipend": "Not specified",
                "difficulty": "Intermediate",
                "work_mode": "Remote" if remote else "On-site",
                "logo_url": "",
            })
        return out
    except requests.exceptions.RequestException as e:
        print(f"  Arbeitnow failed: {e}")
        return []


# ---------------------------------------------------------------------
# LOAD — shared saver with dedup by source_url.
# ---------------------------------------------------------------------

def load(opportunities_data):
    db = SessionLocal()
    added = 0
    skipped = 0
    try:
        for data in opportunities_data:
            url = data.get("source_url")
            if not url:
                continue
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
    """Run the full pipeline across all sources."""
    all_jobs = []
    all_jobs += fetch_remotive()
    all_jobs += fetch_himalayas()
    all_jobs += fetch_arbeitnow()

    print(f"Total fetched across all sources: {len(all_jobs)}")
    load(all_jobs)
    print("Collection complete.")


if __name__ == "__main__":
    collect()