from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from server.config.settings import settings
import logging

logger = logging.getLogger("estateflow.database")

# Smart database engine initialization with SQLite fallback if PostgreSQL is unavailable
try:
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=settings.ENVIRONMENT == "development",
        )
    else:
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=settings.ENVIRONMENT == "development",
        )
        # Test connection
        with engine.connect() as conn:
            pass
        print("Connected to PostgreSQL Database.")
except Exception as e:
    print(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database.")
    sqlite_url = "sqlite:///./estateflow.db"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
        echo=settings.ENVIRONMENT == "development",
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
