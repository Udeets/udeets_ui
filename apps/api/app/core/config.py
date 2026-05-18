from functools import lru_cache
from typing import Literal
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "udeets-api"
    env: str = "development"
    api_v1_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/udeets"
    cron_secret: str | None = None
    db_provider: Literal["rds_primary"] = "rds_primary"
    media_provider: Literal["s3_primary"] = "s3_primary"
    auth_provider: Literal["cognito"] = "cognito"
    aws_region: str = "us-east-1"
    s3_bucket_name: str | None = None
    s3_media_prefix: str = ""
    s3_public_base_url: str | None = None
    s3_upload_url_ttl_seconds: int = 900
    cognito_user_pool_id: str | None = None
    cognito_jwks_url: str | None = None
    cognito_app_client_id: str | None = None
    redis_url: str | None = None
    chat_realtime_enabled: bool = False
    chat_redis_subscribe_mode: Literal["per_room", "pattern"] = "per_room"
    chat_pubsub_channel_prefix: str = "chat:room:"
    chat_typing_ttl_seconds: int = 9
    chat_typing_started_rate_limit_seconds: int = 4

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local", "../web/.env.local", "../web/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def normalized_database_url(self) -> str:
        url = self.database_url.strip()
        if url.startswith("postgresql://"):
            return "postgresql+psycopg://" + url[len("postgresql://") :]
        return url

    @property
    def database_is_local_default(self) -> bool:
        parsed = urlparse(self.normalized_database_url)
        host = (parsed.hostname or "").lower()
        return host in {"localhost", "127.0.0.1"} and parsed.port == 5432

    @property
    def is_rds_enabled(self) -> bool:
        return True


@lru_cache
def get_settings() -> Settings:
    return Settings()
