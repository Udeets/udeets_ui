from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import boto3
from fastapi import HTTPException, status

from app.core.config import get_settings

MediaVisibility = Literal["public", "private"]

KNOWN_MEDIA_PREFIXES = ("avatars/", "hub-media/", "deet-media/", "chat-media/")


@dataclass
class PreparedUpload:
    bucket: str
    storage_key: str
    signed_upload_url: str
    token: str | None
    public_url: str | None


def with_s3_prefix(storage_key: str) -> str:
    settings = get_settings()
    prefix = settings.s3_media_prefix.strip("/")
    key = storage_key.lstrip("/")
    return f"{prefix}/{key}" if prefix else key


def strip_s3_prefix(storage_key: str) -> str:
    settings = get_settings()
    prefix = settings.s3_media_prefix.strip("/")
    key = storage_key.lstrip("/")
    if prefix and key.startswith(f"{prefix}/"):
        return key[len(prefix) + 1 :]
    return key


def looks_like_storage_key(value: str) -> bool:
    candidate = (value or "").strip().lstrip("/")
    return any(candidate.startswith(prefix) for prefix in KNOWN_MEDIA_PREFIXES)


def extract_storage_key(value: str | None) -> str | None:
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    if looks_like_storage_key(raw):
        return raw.lstrip("/")

    settings = get_settings()
    if raw.startswith("s3://"):
        bucket = settings.s3_bucket_name
        suffix = raw[len("s3://") :]
        if bucket and suffix.startswith(f"{bucket}/"):
            return strip_s3_prefix(suffix[len(bucket) + 1 :])
        return strip_s3_prefix(suffix.split("/", 1)[-1] if "/" in suffix else suffix)

    if settings.s3_public_base_url:
        public_base = settings.s3_public_base_url.rstrip("/")
        if raw.startswith(f"{public_base}/"):
            maybe_key = raw[len(public_base) + 1 :]
            return strip_s3_prefix(maybe_key)
    return None


def to_public_media_url(value: str | None) -> str | None:
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    if raw.startswith("http://") or raw.startswith("https://") or raw.startswith("s3://"):
        key = extract_storage_key(raw)
        if not key:
            return raw
        return get_storage_adapter().resolve_public_url(storage_key=key)
    if looks_like_storage_key(raw):
        return get_storage_adapter().resolve_public_url(storage_key=raw.lstrip("/"))
    return raw


class MediaStorageAdapter:
    def prepare_upload(
        self,
        storage_key: str,
        mime_type: str,
        *,
        visibility: MediaVisibility,
    ) -> PreparedUpload:
        raise NotImplementedError

    def resolve_public_url(self, storage_key: str) -> str:
        raise NotImplementedError

    def create_download_url(
        self,
        storage_key: str,
        *,
        expires_in: int,
        visibility: MediaVisibility,
    ) -> str:
        if visibility == "public":
            return self.resolve_public_url(storage_key=storage_key)
        raise NotImplementedError


class S3StorageAdapter(MediaStorageAdapter):
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.s3_bucket_name:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 bucket is not configured.",
            )
        self._bucket = settings.s3_bucket_name
        self._upload_ttl = settings.s3_upload_url_ttl_seconds
        self._public_base_url = settings.s3_public_base_url
        client_kwargs: dict = {"region_name": settings.aws_region}
        if settings.aws_endpoint_url:
            client_kwargs["endpoint_url"] = settings.aws_endpoint_url
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            client_kwargs["aws_access_key_id"] = settings.aws_access_key_id
            client_kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        self._client = boto3.client("s3", **client_kwargs)

    def prepare_upload(
        self,
        storage_key: str,
        mime_type: str,
        *,
        visibility: MediaVisibility,
    ) -> PreparedUpload:
        key = with_s3_prefix(storage_key)
        signed_url = self._client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": self._bucket,
                "Key": key,
                "ContentType": mime_type,
            },
            ExpiresIn=self._upload_ttl,
        )
        public_url = self.resolve_public_url(storage_key) if visibility == "public" else None
        return PreparedUpload(
            bucket=self._bucket,
            storage_key=storage_key,
            signed_upload_url=signed_url,
            token=None,
            public_url=public_url,
        )

    def resolve_public_url(self, storage_key: str) -> str:
        key = with_s3_prefix(storage_key)
        if self._public_base_url:
            return f"{self._public_base_url.rstrip('/')}/{key}"
        return f"s3://{self._bucket}/{key}"

    def create_download_url(
        self,
        storage_key: str,
        *,
        expires_in: int,
        visibility: MediaVisibility,
    ) -> str:
        if visibility == "public":
            return self.resolve_public_url(storage_key=storage_key)
        key = with_s3_prefix(storage_key)
        return self._client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expires_in,
        )


def get_storage_adapter() -> MediaStorageAdapter:
    return S3StorageAdapter()
