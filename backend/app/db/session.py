from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache
def _build_engine() -> Engine:
    settings = get_settings()
    url = settings.database_url.strip()

    # Automatically format postgres / supabase URLs for psycopg 3
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]

    if "sqlite" in url:
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
        )

    # PostgreSQL / Supabase pool configuration
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


@lru_cache
def _build_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=_build_engine(), autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    session_factory = _build_session_factory()
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
