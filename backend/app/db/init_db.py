from sqlalchemy import text

from app.db.session import _build_engine


def check_database_connection() -> bool:
    engine = _build_engine()
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True
