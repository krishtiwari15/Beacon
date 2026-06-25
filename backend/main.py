from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from backend.database import engine, get_db, Base
from backend.models import Opportunity

# Make sure all tables exist when the server starts.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Beacon API")


@app.get("/")
def read_root():
    return {"message": "Beacon API is running!"}


# GET /opportunities returns every opportunity as JSON.
@app.get("/opportunities")
def list_opportunities(db: Session = Depends(get_db)):
    rows = db.query(Opportunity).all()

    return [
        {
            "id": o.id,
            "title": o.title,
            "type": o.type,
            "category": o.category,
            "organization": o.organization,
            "location": o.location,
            "eligibility": o.eligibility,
            "deadline": o.deadline.isoformat() if o.deadline else None,
            "source_url": o.source_url,
            "tags": o.tags.split(",") if o.tags else [],
            # --- NEW fields, now sent to the frontend ---
            "stipend": o.stipend,
            "difficulty": o.difficulty,
            "work_mode": o.work_mode,
            "logo_url": o.logo_url,
        }
        for o in rows
    ]