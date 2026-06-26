from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import engine, get_db, Base
from backend.models import Opportunity, SavedOpportunity

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Beacon API")

# For the single-user tracker, everything attaches to this fixed user.
# When we add login later, this gets replaced by the real logged-in user's id.
DEMO_USER_ID = 1

# The five valid application stages (from the roadmap).
VALID_STATUSES = {"saved", "applied", "interview", "rejected", "accepted"}


# Pydantic model: defines the shape of the JSON body for the /save request.
# FastAPI uses this to validate incoming data automatically.
class SaveRequest(BaseModel):
    opportunity_id: int
    status: str = "saved"


@app.get("/")
def read_root():
    return {"message": "Beacon API is running!"}


def opportunity_to_dict(o):
    """Helper: turn an Opportunity row into a JSON-friendly dict.
    Defined once so both /opportunities and /saved can reuse it."""
    return {
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
        "stipend": o.stipend,
        "difficulty": o.difficulty,
        "work_mode": o.work_mode,
        "logo_url": o.logo_url,
    }


@app.get("/opportunities")
def list_opportunities(db: Session = Depends(get_db)):
    rows = db.query(Opportunity).all()
    return [opportunity_to_dict(o) for o in rows]


# POST /save — save an opportunity, or update its status if already saved.
@app.post("/save")
def save_opportunity(req: SaveRequest, db: Session = Depends(get_db)):
    # Validate the status is one of our five allowed stages.
    if req.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {req.status}")

    # Make sure the opportunity actually exists.
    opp = db.query(Opportunity).filter(Opportunity.id == req.opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Is it already saved by this user? If so, just update the status.
    existing = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == DEMO_USER_ID,
        SavedOpportunity.opportunity_id == req.opportunity_id,
    ).first()

    if existing:
        existing.status = req.status
    else:
        new_save = SavedOpportunity(
            user_id=DEMO_USER_ID,
            opportunity_id=req.opportunity_id,
            status=req.status,
        )
        db.add(new_save)

    db.commit()
    return {"message": "Saved", "opportunity_id": req.opportunity_id, "status": req.status}


# GET /saved — all saved opportunities for the demo user, with their status.
@app.get("/saved")
def list_saved(db: Session = Depends(get_db)):
    saves = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == DEMO_USER_ID
    ).all()

    result = []
    for s in saves:
        # s.opportunity is the linked Opportunity row (via the relationship).
        if s.opportunity:
            data = opportunity_to_dict(s.opportunity)
            data["status"] = s.status          # attach the tracking status
            result.append(data)
    return result


# DELETE /save/{opportunity_id} — remove an opportunity from the tracker.
@app.delete("/save/{opportunity_id}")
def unsave_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    existing = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == DEMO_USER_ID,
        SavedOpportunity.opportunity_id == opportunity_id,
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Not in your saved list")

    db.delete(existing)
    db.commit()
    return {"message": "Removed", "opportunity_id": opportunity_id}