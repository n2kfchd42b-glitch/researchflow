from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.database import Base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./researchflow.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables():
    Base.metadata.create_all(bind=engine)


def run_migrations():
    """
    Lightweight schema migrations — adds any new columns to existing tables
    without dropping data. Safe to run on every startup.
    """
    if not DATABASE_URL.startswith("sqlite"):
        return  # only handle SQLite here; use Alembic for Postgres etc.

    db_path = (
        DATABASE_URL
        .replace("sqlite:///./", "")
        .replace("sqlite:///", "")
    )
    if not os.path.isabs(db_path):
        db_path = os.path.join(os.getcwd(), db_path)

    import sqlite3
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Fetch existing columns for 'users'
        cursor.execute("PRAGMA table_info(users)")
        existing_cols = {row[1] for row in cursor.fetchall()}

        new_cols = [
            ("password_hash", "TEXT"),
            ("institution",   "TEXT DEFAULT ''"),
            ("country",       "TEXT DEFAULT ''"),
        ]
        for col_name, col_def in new_cols:
            if col_name not in existing_cols:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                print(f"[migration] Added column users.{col_name}")

        conn.commit()
        conn.close()
    except Exception as exc:
        print(f"[migration] Warning: {exc}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
