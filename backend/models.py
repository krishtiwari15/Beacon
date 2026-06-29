# models.py — defines our database tables as Python classes.

from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


# ---------- Table 1: users ----------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    # The user's password, stored as a one-way HASH (never the real password).
    # Nullable so existing/demo rows and Google-login users (later) don't need one.
    password_hash = Column(String, nullable=True)
    country = Column(String)
    education_level = Column(String)
    skills = Column(String)
    interests = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    saved = relationship("SavedOpportunity", back_populates="user")


# ---------- Table 2: opportunities ----------
class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, index=True)
    category = Column(String)
    organization = Column(String)
    location = Column(String)
    eligibility = Column(String)
    deadline = Column(Date, index=True)
    source_url = Column(String)
    tags = Column(String)

    stipend = Column(String)
    difficulty = Column(String, index=True)
    work_mode = Column(String, index=True)
    logo_url = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)

    saved_by = relationship("SavedOpportunity", back_populates="opportunity")


# ---------- Table 3: saved_opportunities (the link table) ----------
class SavedOpportunity(Base):
    __tablename__ = "saved_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"))
    status = Column(String, default="saved")
    saved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved")
    opportunity = relationship("Opportunity", back_populates="saved_by")