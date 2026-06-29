import os
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import engine, get_db, Base
from backend.models import Opportunity, SavedOpportunity, User
from backend.ai import check_eligibility, analyze_resume, recommend_opportunities
from backend.auth import hash_password, verify_password

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Beacon API")


@app.on_event("startup")
def startup_tasks():
    from sqlalchemy import text, inspect
    from backend.database import SessionLocal
    from backend.seed import seed as seed_opps
    from backend.seed_user import seed_user

    # --- 1. Add the password_hash column if it's missing (for existing databases) ---
    try:
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("users")]
        if "password_hash" not in columns:
            print("Adding missing password_hash column...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
                conn.commit()
            print("Column added.")
    except Exception as e:
        print(f"Column check skipped: {e}")

    # --- 2. Seed opportunities if the database is empty ---
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
        

VALID_STATUSES = {"saved", "applied", "interview", "rejected", "accepted"}


# ---------- Request models ----------
class SaveRequest(BaseModel):
    user_id: int
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


class RecommendRequest(BaseModel):
    education: str = ""
    skills: str = ""
    interests: str = ""
    goals: str = ""


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ---------- Auth endpoints ----------
@app.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Basic validation.
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if "@" not in req.email:
        raise HTTPException(status_code=400, detail="Please enter a valid email.")

    # Is this email already registered?
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        name=req.name.strip(),
        email=req.email.lower().strip(),
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email}


@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    # Same generic message whether email is missing or password is wrong —
    # this avoids leaking which emails are registered (a security best practice).
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"id": user.id, "name": user.name, "email": user.email}


# ---------- Core endpoints ----------
@app.api_route("/", methods=["GET", "HEAD"])
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
        SavedOpportunity.user_id == req.user_id,
        SavedOpportunity.opportunity_id == req.opportunity_id,
    ).first()
    if existing:
        existing.status = req.status
    else:
        db.add(SavedOpportunity(
            user_id=req.user_id, opportunity_id=req.opportunity_id, status=req.status,
        ))
    db.commit()
    return {"message": "Saved", "opportunity_id": req.opportunity_id, "status": req.status}


@app.get("/saved")
def list_saved(user_id: int, db: Session = Depends(get_db)):
    saves = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == user_id
    ).all()
    result = []
    for s in saves:
        if s.opportunity:
            data = opportunity_to_dict(s.opportunity)
            data["status"] = s.status
            result.append(data)
    return result


@app.delete("/save/{opportunity_id}")
def unsave_opportunity(opportunity_id: int, user_id: int, db: Session = Depends(get_db)):
    existing = db.query(SavedOpportunity).filter(
        SavedOpportunity.user_id == user_id,
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


@app.post("/recommend")
def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    rows = db.query(Opportunity).all()
    opportunities = [opportunity_to_dict(o) for o in rows]
    profile = {
        "education": req.education, "skills": req.skills,
        "interests": req.interests, "goals": req.goals,
    }
    result = recommend_opportunities(profile, opportunities)
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


_last_collection = {"time": None}


@app.api_route("/run-collector", methods=["GET", "HEAD"])
def run_collector(key: str = ""):
    import time
    if key != os.getenv("COLLECTOR_KEY", "changeme"):
        raise HTTPException(status_code=403, detail="Forbidden")
    COOLDOWN_SECONDS = 12 * 60 * 60
    now = time.time()
    last = _last_collection["time"]
    if last is not None and (now - last) < COOLDOWN_SECONDS:
        remaining = int((COOLDOWN_SECONDS - (now - last)) / 60)
        return {"message": f"Skipped — last ran recently. Next run in ~{remaining} min."}
    from backend.collector import collect
    collect()
    _last_collection["time"] = now
    return {"message": "Collection run complete"}