import logging
from collections.abc import Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _build_engine() -> Engine:
    settings = get_settings()
    db_url = settings.database_url
    if db_url.startswith("sqlite"):
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
        )

    try:
        engine = create_engine(db_url, pool_pre_ping=True, pool_size=5, max_overflow=10)
        with engine.connect():
            pass
        return engine
    except Exception as exc:
        logger.warning(
            "PostgreSQL database connection failed (%s). "
            "Falling back to local SQLite pos_system.db",
            exc,
        )
        return create_engine(
            "sqlite:///./pos_system.db",
            connect_args={"check_same_thread": False},
        )


def _build_session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=_build_engine(), autoflush=False, autocommit=False)


SessionLocal = _build_session_factory()


def get_db() -> Generator[Session, None, None]:
    session_factory = _build_session_factory()
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
