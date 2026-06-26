from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import engine, get_db, Base
from backend.models import Opportunity, SavedOpportunity
from backend.ai import check_eligibility, analyze_resume, recommend_opportunities

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Beacon API")


# Auto-seed the database on startup if it's empty (needed because Render's
# free tier has no Shell to run seed scripts manually).
@app.on_event("startup")
def seed_if_empty():
    from backend.database import SessionLocal
    from backend.seed import seed as seed_opps
    from backend.seed_user import seed_user
    db = SessionLocal()
    try:
        count = db.query(Opportunity).count()
    finally:
        db.close()
    if count == 0:
        print("Database empty — seeding...")
        seed_opps()
        seed_user()
        print("Seeding complete.")
    else:
        print(f"Database already has {count} opportunities — skipping seed.")

DEMO_USER_ID = 1
VALID_STATUSES = {"saved", "applied", "interview", "rejected", "accepted"}


class SaveRequest(BaseModel):
    opportunity_id: int
    status: str = "saved"


class EligibilityRequest(BaseModel):
    opportunity_id: int
    age: str = ""
    education: str = ""
    country: str = ""
    cgpa: str = ""
    skills: str = ""


class ResumeRequest(BaseModel):
    opportunity_id: int
    resume_text: str


@app.get("/")
def read_root():
    return {"message": "Beacon API is running!"}


def opportunity_to_dict(o):
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


@app.post("/save")
def save_opportunity(req: SaveRequest, db: Session = Depends(get_db)):
    if req.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {req.status}")
    opp = db.query(Opportunity).filter(Opportunity.id == req.opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    existing = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == DEMO_USER_ID,
        SavedOpportunity.opportunity_id == req.opportunity_id,
    ).first()
    if existing:
        existing.status = req.status
    else:
        db.add(SavedOpportunity(
            user_id=DEMO_USER_ID, opportunity_id=req.opportunity_id, status=req.status,
        ))
    db.commit()
    return {"message": "Saved", "opportunity_id": req.opportunity_id, "status": req.status}


@app.get("/saved")
def list_saved(db: Session = Depends(get_db)):
    saves = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == DEMO_USER_ID
    ).all()
    result = []
    for s in saves:
        if s.opportunity:
            data = opportunity_to_dict(s.opportunity)
            data["status"] = s.status
            result.append(data)
    return result


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


@app.post("/check-eligibility")
def eligibility(req: EligibilityRequest, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == req.opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    profile = {
        "age": req.age, "education": req.education, "country": req.country,
        "cgpa": req.cgpa, "skills": req.skills,
    }
    opportunity = {
        "title": opp.title, "organization": opp.organization, "type": opp.type,
        "eligibility": opp.eligibility, "location": opp.location,
    }
    return check_eligibility(profile, opportunity)


@app.post("/analyze-resume")
def analyze(req: ResumeRequest, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == req.opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    opportunity = {
        "title": opp.title, "organization": opp.organization, "type": opp.type,
        "eligibility": opp.eligibility, "tags": opp.tags,
    }
    return analyze_resume(req.resume_text, opportunity)


# Pydantic model for the recommendation request.
class RecommendRequest(BaseModel):
    education: str = ""
    skills: str = ""
    interests: str = ""
    goals: str = ""


# POST /recommend — AI ranks the best-fit opportunities for a student profile.
@app.post("/recommend")
def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    rows = db.query(Opportunity).all()
    opportunities = [opportunity_to_dict(o) for o in rows]

    profile = {
        "education": req.education, "skills": req.skills,
        "interests": req.interests, "goals": req.goals,
    }
    result = recommend_opportunities(profile, opportunities)

    # The AI returns ids; hydrate them into full opportunity objects for the UI.
    if "matches" in result:
        by_id = {o["id"]: o for o in opportunities}
        hydrated = []
        for m in result["matches"]:
            opp = by_id.get(m.get("id"))
            if opp:
                enriched = dict(opp)
                enriched["match"] = m.get("match")
                enriched["reason"] = m.get("reason")
                hydrated.append(enriched)
        return {"matches": hydrated}

    return result