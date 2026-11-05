from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from jose import JWTError, jwt

from app.core.config import Settings

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except Exception:
        return False


def create_access_token(subject: str, settings: Settings) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    return str(
        jwt.encode(
            {"sub": subject, "type": "access", "exp": expires_at},
            settings.jwt_secret_key.get_secret_value(),
            algorithm=settings.jwt_algorithm,
        )
    )


def create_refresh_token(subject: str, settings: Settings) -> str:
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    return str(
        jwt.encode(
            {"sub": subject, "type": "refresh", "exp": expires_at},
            settings.jwt_secret_key.get_secret_value(),
            algorithm=settings.jwt_algorithm,
        )
    )


def decode_token(token: str, settings: Settings) -> dict[str, object]:
    try:
        return dict(
            jwt.decode(
                token,
                settings.jwt_secret_key.get_secret_value(),
                algorithms=[settings.jwt_algorithm],
            )
        )
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
