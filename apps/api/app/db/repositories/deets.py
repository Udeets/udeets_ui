from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.models.deet import Deet
from app.db.repositories.memberships import MembershipRepository
from app.services.media import extract_storage_key, to_public_media_url


def _normalize_media_attachment(attachment: object) -> object:
    if not isinstance(attachment, dict):
        return attachment
    out = dict(attachment)
    for key in ("url", "src", "image", "imageUrl", "previewUrl"):
        raw_value = out.get(key)
        if isinstance(raw_value, str):
            out[key] = extract_storage_key(raw_value) or raw_value
    previews = out.get("previews")
    if isinstance(previews, list):
        out["previews"] = [
            extract_storage_key(value) or value if isinstance(value, str) else value
            for value in previews
        ]
    return out


def _normalize_media_for_write(doc: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(doc)
    preview = normalized.get("preview_image_url")
    if isinstance(preview, str):
        normalized["preview_image_url"] = extract_storage_key(preview) or preview
    previews = normalized.get("preview_image_urls")
    if isinstance(previews, list):
        normalized["preview_image_urls"] = [
            (extract_storage_key(item) or item) if isinstance(item, str) else item
            for item in previews
        ]
    attachments = normalized.get("attachments")
    if isinstance(attachments, list):
        normalized["attachments"] = [_normalize_media_attachment(item) for item in attachments]
    return normalized


def _resolve_media_attachment(attachment: object) -> object:
    if not isinstance(attachment, dict):
        return attachment
    out = dict(attachment)
    for key in ("url", "src", "image", "imageUrl", "previewUrl"):
        raw_value = out.get(key)
        if isinstance(raw_value, str):
            out[key] = to_public_media_url(raw_value) or raw_value
    previews = out.get("previews")
    if isinstance(previews, list):
        out["previews"] = [
            (to_public_media_url(value) or value) if isinstance(value, str) else value
            for value in previews
        ]
    return out


def deet_row_to_dict(row: Deet) -> dict[str, Any]:
    attachments = row.attachments if isinstance(row.attachments, list) else []
    return {
        "id": row.id,
        "hub_id": row.hub_id,
        "author_name": row.author_name,
        "title": row.title,
        "body": row.body,
        "kind": row.kind,
        "preview_image_url": to_public_media_url(row.preview_image_url),
        "preview_image_urls": [
            to_public_media_url(value) or value
            for value in (row.preview_image_urls or [])
            if isinstance(value, str)
        ],
        "attachments": [_resolve_media_attachment(item) for item in attachments],
        "created_by": row.created_by,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "like_count": row.like_count,
        "comment_count": row.comment_count,
        "view_count": row.view_count,
        "share_count": row.share_count,
        "allow_comments": row.allow_comments,
        "is_published": row.is_published,
    }


class DeetsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.memberships = MembershipRepository(db)

    def list_deets(
        self,
        *,
        user_id: str,
        hub_ids: list[str] | None = None,
        kinds: list[str] | None = None,
        limit: int | None = None,
        published_only: bool | None = None,
        drafts_only: bool | None = False,
    ) -> list[Deet]:
        stmt: Select[tuple[Deet]] = select(Deet).order_by(Deet.created_at.desc())

        if hub_ids:
            allowed = self.memberships.list_active_hub_ids_for_user(user_id)
            filtered = sorted({hub_id for hub_id in hub_ids if hub_id in allowed})
            if not filtered:
                return []
            stmt = stmt.where(Deet.hub_id.in_(filtered))

        if kinds:
            stmt = stmt.where(Deet.kind.in_(kinds))

        if drafts_only:
            stmt = stmt.where(Deet.is_published.is_(False)).where(Deet.created_by == user_id)
        elif published_only is not False:
            stmt = stmt.where(Deet.is_published.is_(True))

        if limit is not None:
            stmt = stmt.limit(max(1, min(limit, 500)))

        return list(self.db.scalars(stmt))

    def get_by_id(self, deet_id: str) -> Deet | None:
        return self.db.scalar(select(Deet).where(Deet.id == deet_id).limit(1))

    def create_deet(self, *, user_id: str, payload: dict[str, Any]) -> Deet:
        now = datetime.now(UTC)
        doc = _normalize_media_for_write(
            {
                "hub_id": str(payload.get("hubId") or ""),
                "author_name": str(payload.get("authorName") or "").strip(),
                "title": str(payload.get("title") or "").strip(),
                "body": str(payload.get("body") or ""),
                "kind": str(payload.get("kind") or "Posts"),
                "preview_image_url": payload.get("previewImageUrl"),
                "preview_image_urls": payload.get("previewImageUrls") or [],
                "attachments": payload.get("attachments") or [],
                "created_by": user_id,
                "is_published": bool(payload.get("isPublished", True)),
                "allow_comments": payload.get("allowComments")
                if isinstance(payload.get("allowComments"), bool)
                else True,
            }
        )
        row = Deet(
            id=str(uuid4()),
            hub_id=str(doc["hub_id"]),
            author_name=str(doc["author_name"]),
            title=str(doc["title"]),
            body=str(doc["body"]),
            kind=str(doc["kind"]),
            preview_image_url=doc.get("preview_image_url"),  # type: ignore[arg-type]
            preview_image_urls=doc.get("preview_image_urls"),  # type: ignore[arg-type]
            attachments=doc.get("attachments"),  # type: ignore[arg-type]
            created_by=user_id,
            created_at=now,
            updated_at=now,
            is_published=bool(doc.get("is_published", True)),
            allow_comments=bool(doc.get("allow_comments", True)),
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def update_deet(self, *, deet_id: str, payload: dict[str, Any]) -> Deet | None:
        row = self.get_by_id(deet_id)
        if row is None:
            return None
        mappings = {
            "title": "title",
            "body": "body",
            "kind": "kind",
            "previewImageUrl": "preview_image_url",
            "previewImageUrls": "preview_image_urls",
            "attachments": "attachments",
            "allowComments": "allow_comments",
            "isPublished": "is_published",
        }
        update_doc: dict[str, Any] = {}
        for source_key, target_key in mappings.items():
            if source_key in payload:
                update_doc[target_key] = payload.get(source_key)
        if not update_doc:
            return row

        normalized = _normalize_media_for_write(update_doc)
        for key, value in normalized.items():
            if hasattr(row, key):
                setattr(row, key, value)
        row.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(row)
        return row

    def delete_deet(self, deet_id: str) -> bool:
        row = self.get_by_id(deet_id)
        if row is None:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def assert_can_write_deet(self, *, user_id: str, hub_id: str, deet: Deet) -> bool:
        if str(deet.created_by or "") == user_id:
            return True
        return self.memberships.can_manage_hub(hub_id, user_id)

    def assert_active_member(self, *, user_id: str, hub_id: str) -> bool:
        membership = self.memberships.get_active_membership(hub_id=hub_id, user_id=user_id)
        return membership is not None
