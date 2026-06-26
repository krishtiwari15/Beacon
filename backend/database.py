# database.py — sets up the connection between our code and the database.
# Works BOTH locally (SQLite) and in production (Postgres), chosen automatically
# via the DATABASE_URL environment variable.

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Read DATABASE_URL from the environment. On Render (production) we'll set this
# to a Postgres URL. Locally it's unset, so we fall back to the SQLite file.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./radar.db")

# Render/Heroku give Postgres URLs starting with "postgres://", but SQLAlchemy
# needs "postgresql://". Fix that automatically if needed.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs a special connect arg; Postgres does not. Apply it only for SQLite.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()