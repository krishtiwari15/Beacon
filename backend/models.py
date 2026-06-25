# models.py — defines our database tables as Python classes.

from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


# ---------- Table 1: users ----------
class User(Base):
    __tablename__ = "users"  # the actual table name in the database

    # primary_key=True makes this the unique ID for each row.
    # index=True speeds up lookups on this column.
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)  # no two users share an email
    country = Column(String)
    education_level = Column(String)
    # We store lists (skills, interests) as comma-separated text for now,
    # e.g. "python,sql,ml". It's a deliberate simplification we'll improve later.
    skills = Column(String)
    interests = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # This is NOT a column — it's a convenient link to a user's saved rows.
    saved = relationship("SavedOpportunity", back_populates="user")


# ---------- Table 2: opportunities ----------
class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, index=True)        # internship / scholarship / hackathon ...
    category = Column(String)                # e.g. "Tech", "Research"
    organization = Column(String)
    location = Column(String)                # e.g. "Remote", "India", "Global"
    eligibility = Column(String)
    deadline = Column(Date, index=True)      # a real date, so we can sort/filter by it
    source_url = Column(String)
    tags = Column(String)                    # comma-separated, e.g. "ai,python"
    created_at = Column(DateTime, default=datetime.utcnow)

    saved_by = relationship("SavedOpportunity", back_populates="opportunity")


# ---------- Table 3: saved_opportunities (the link table) ----------
# This connects users to opportunities — the many-to-many relationship.
# One user saves many opportunities; one opportunity is saved by many users.
class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    # ForeignKey points at another table's id — this is how rows "connect".
    user_id = Column(Integer, ForeignKey("users.id"))
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"))
    status = Column(String, default="saved")  # "saved" or "applied"
    saved_at = Column(DateTime, default=datetime.utcnow)

    # These let us hop from a saved-row back to the full user / opportunity.
    user = relationship("User", back_populates="saved")
    opportunity = relationship("Opportunity", back_populates="saved_by")