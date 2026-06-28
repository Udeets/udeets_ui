from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.db.models.hub import Hub
from app.db.models.hub_invitation import HubInvitation
from app.db.models.hub_member import HubMember


class HubRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_hubs(self, category: str | None = None) -> list[Hub | Mapping[str, Any]]:
        stmt: Select[tuple[Hub]] = select(Hub).order_by(Hub.created_at.desc())
        if category:
            stmt = stmt.where(func.lower(Hub.category) == category.lower().strip())
        return list(self.db.scalars(stmt))

    def get_hub_by_id(self, hub_id: str) -> Hub | Mapping[str, Any] | None:
        stmt: Select[tuple[Hub]] = select(Hub).where(Hub.id == hub_id)
        return self.db.scalar(stmt)

    def get_hub_by_slug(self, category: str, slug: str) -> Hub | Mapping[str, Any] | None:
        stmt: Select[tuple[Hub]] = (
            select(Hub)
            .where(func.lower(Hub.category) == category.lower().strip())
            .where(func.lower(Hub.slug) == slug.lower().strip())
        )
        return self.db.scalar(stmt)

    def create_hub(self, payload: dict[str, Any], created_by: str) -> Hub:
        now = datetime.now(UTC)
        hub = Hub(
            id=str(uuid4()),
            name=str(payload.get("name") or "").strip(),
            slug=str(payload.get("slug") or "").strip().lower(),
            category=str(payload.get("category") or "").strip(),
            visibility=(
                str(payload.get("visibility")).strip()
                if payload.get("visibility")
                else "public"
            ),
            tagline=payload.get("tagline"),
            description=payload.get("description"),
            city=payload.get("city"),
            state=payload.get("state"),
            country=payload.get("country"),
            cover_image_url=payload.get("cover_image_url"),
            dp_image_url=payload.get("dp_image_url"),
            website_url=payload.get("website_url"),
            gallery_image_urls=[],
            created_by=created_by,
            created_at=now,
            updated_at=now,
        )
        self.db.add(hub)
        self.db.add(
            HubMember(
                id=str(uuid4()),
                hub_id=hub.id,
                user_id=created_by,
                role="creator",
                status="active",
                joined_at=now,
            )
        )
        self.db.commit()
        self.db.refresh(hub)
        return hub

    def update_hub(
        self,
        *,
        hub_id: str,
        actor_user_id: str,
        payload: dict[str, Any],
    ) -> Hub | None:
        hub = self.db.scalar(
            select(Hub).where(Hub.id == hub_id).where(Hub.created_by == actor_user_id)
        )
        if not hub:
            return None
        for key, value in payload.items():
            if not hasattr(hub, key):
                continue
            setattr(hub, key, value)
        hub.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(hub)
        return hub

    def delete_hub(self, *, hub_id: str, actor_user_id: str) -> bool:
        hub = self.db.scalar(
            select(Hub).where(Hub.id == hub_id).where(Hub.created_by == actor_user_id)
        )
        if not hub:
            return False
        self.db.delete(hub)
        self.db.commit()
        return True

    def invite_user_to_hub(
        self, *, hub_id: str, invited_by: str, invited_user_id: str
    ) -> str:
        can_manage = self.db.scalar(
            select(Hub)
            .where(Hub.id == hub_id)
            .where(Hub.created_by == invited_by)
        )
        if not can_manage:
            admin_member = self.db.scalar(
                select(HubMember)
                .where(HubMember.hub_id == hub_id)
                .where(HubMember.user_id == invited_by)
                .where(HubMember.status == "active")
            )
            if not admin_member or admin_member.role not in {"creator", "admin"}:
                return "error"

        existing_member = self.db.scalar(
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == invited_user_id)
            .where(HubMember.status == "active")
        )
        if existing_member:
            return "already_member"

        existing_invite = self.db.scalar(
            select(HubInvitation)
            .where(HubInvitation.hub_id == hub_id)
            .where(HubInvitation.invited_user_id == invited_user_id)
            .where(HubInvitation.status == "pending")
        )
        if existing_invite:
            return "already_invited"

        self.db.add(
            HubInvitation(
                id=str(uuid4()),
                hub_id=hub_id,
                invited_by=invited_by,
                invited_user_id=invited_user_id,
                status="pending",
                created_at=datetime.now(UTC),
            )
        )
        self.db.commit()
        return "invited"
