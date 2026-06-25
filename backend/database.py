# database.py — sets up the connection between our code and the database.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The "address" of our database. For SQLite it's just a file path.
# This creates a file called radar.db in your project root.
DATABASE_URL = "sqlite:///./radar.db"

# The "engine" is the core connection to the database.
# check_same_thread=False is a SQLite-specific setting that lets
# FastAPI (which handles many requests) talk to the database safely.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# A "session" is a single conversation with the database — you open one,
# do your reads/writes, then close it. SessionLocal is a factory that
# produces a fresh session whenever we need one.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is the parent class our table-models will inherit from.
# SQLAlchemy uses it to keep track of every table we define.
Base = declarative_base()


# This helper hands a database session to an endpoint, then guarantees
# the session is closed afterwards — even if something errors.
# (The "yield" makes this a generator FastAPI knows how to use.)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()