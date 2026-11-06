from collections.abc import Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def _build_engine() -> Engine:
    settings = get_settings()
    return create_engine(settings.database_url, pool_pre_ping=True, pool_size=5, max_overflow=10)


def _build_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=_build_engine(), autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    session_factory = _build_session_factory()
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
