from functools import lru_cache

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", enable_decoding=False
    )

    app_name: str = "POS System API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(
        "sqlite:///./pos_system.db",
        validation_alias="DATABASE_URL",
    )
    supabase_url: str | None = Field(None, validation_alias="SUPABASE_URL")
    supabase_key: str | None = Field(None, validation_alias="SUPABASE_KEY")
    supabase_service_role_key: str | None = Field(None, validation_alias="SUPABASE_SERVICE_ROLE_KEY")
    jwt_secret_key: SecretStr = Field(
        SecretStr("development-only-change-me"),
        validation_alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    backend_cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    )
    log_level: str = "INFO"
    rate_limit_per_minute: int = 120
    max_request_body_bytes: int = 1_048_576

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
