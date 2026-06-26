# seed_user.py — creates a single demo user (id=1) for the single-user tracker.
# Run once with:  python -m backend.seed_user
# When we add real login later, this fixed user gets replaced by real accounts.

from backend.database import SessionLocal, engine, Base
from backend.models import User

Base.metadata.create_all(bind=engine)


def seed_user():
    db = SessionLocal()
    try:
        # Only create the demo user if it doesn't already exist.
        existing = db.query(User).filter(User.id == 1).first()
        if existing:
            print("Demo user already exists.")
            return
        demo = User(
            id=1,
            name="Demo Student",
            email="demo@beacon.app",
            country="India",
            education_level="Undergraduate",
            skills="python,sql",
            interests="ai,web",
        )
        db.add(demo)
        db.commit()
        print("Demo user created (id=1).")
    finally:
        db.close()


if __name__ == "__main__":
    seed_user()