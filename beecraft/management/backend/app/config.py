from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "BeeCraft Gestão"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://beecraft:beecraft@localhost:5433/beecraft_management"
    secret_key: str = Field(default="development-only-change-me", min_length=20)
    access_token_expire_minutes: int = 480
    cors_origins: str = "http://localhost:5174"
    bootstrap_owner_email: str | None = None
    bootstrap_owner_password: str | None = None
    store_api_url: str = "http://host.docker.internal:3000"
    store_admin_key: str | None = None

    @property
    def allowed_origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
