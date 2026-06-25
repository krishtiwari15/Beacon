from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from backend.database import engine, get_db, Base
from backend.models import Opportunity

# Make sure all tables exist when the server starts.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Opportunity Radar API")


@app.get("/")
def read_root():
    return {"message": "Opportunity Radar API is running!"}


# A new endpoint: GET /opportunities returns every opportunity as JSON.
# Depends(get_db) hands this function a database session automatically.
@app.get("/opportunities")
def list_opportunities(db: Session = Depends(get_db)):
    # Query the database for all rows in the opportunities table.
    rows = db.query(Opportunity).all()

    # Convert each database row into a plain dictionary so FastAPI can
    # send it as JSON. We split the comma-separated tags back into a list.
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
        }
        for o in rows
    ]