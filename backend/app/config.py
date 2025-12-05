from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env."""

    app_name: str = Field(default="DigiTwin Backend")
    environment: str = Field(default="development")
    debug: bool = Field(default=True)

    # Firebase
    firebase_project_id: str = Field(default="", alias="FIREBASE_PROJECT_ID")
    firebase_storage_bucket: str = Field(default="", alias="FIREBASE_STORAGE_BUCKET")
    firebase_credentials_file: Optional[str] = Field(
        default=None, alias="FIREBASE_CREDENTIALS_FILE"
    )

    # CORS
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8001",
            "http://127.0.0.1:8001",
            "https://localhost:5173",
            "https://127.0.0.1:5173",
            "https://localhost:8000",
            "https://127.0.0.1:8000"
        ]
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()


