from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.models.hub import Hub
from app.db.models.hub_member import HubMember


class MembershipRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_hub_members(self, hub_id: str) -> list[HubMember | Mapping[str, Any]]:
        stmt: Select[tuple[HubMember]] = (
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.status == "active")
            .order_by(HubMember.joined_at.desc())
        )
        return list(self.db.scalars(stmt))

    def list_active_hub_ids_for_user(self, user_id: str) -> set[str]:
        stmt: Select[tuple[str]] = (
            select(HubMember.hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "active")
        )
        return {str(value) for value in self.db.scalars(stmt) if value}

    def cancel_pending_request(self, *, user_id: str, membership_id: str) -> bool:
        row = self.db.scalar(
            select(HubMember)
            .where(HubMember.id == membership_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "pending")
            .limit(1)
        )
        if row is None:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def list_my_memberships(self, user_id: str) -> list[HubMember | Mapping[str, Any]]:
        stmt: Select[tuple[HubMember]] = (
            select(HubMember)
            .where(HubMember.user_id == user_id)
            .order_by(HubMember.joined_at.desc())
        )
        return list(self.db.scalars(stmt))

    def list_pending_requests(self, hub_id: str) -> list[HubMember | Mapping[str, Any]]:
        stmt: Select[tuple[HubMember]] = (
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.status == "pending")
            .order_by(HubMember.joined_at.asc())
        )
        return list(self.db.scalars(stmt))

    def can_manage_hub(self, hub_id: str, actor_user_id: str) -> bool:
        return self._can_manage_hub(hub_id, actor_user_id)

    def get_active_membership(
        self, *, hub_id: str, user_id: str
    ) -> HubMember | Mapping[str, Any] | None:
        stmt: Select[tuple[HubMember]] = (
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "active")
            .limit(1)
        )
        return self.db.scalar(stmt)

    def _can_manage_hub(self, hub_id: str, actor_user_id: str) -> bool:
        hub = self.db.scalar(select(Hub).where(Hub.id == hub_id))
        if not hub:
            return False
        if hub.created_by == actor_user_id:
            return True
        membership = self.db.scalar(
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == actor_user_id)
            .where(HubMember.status == "active")
        )
        return bool(membership and membership.role in {"creator", "admin"})

    def approve_member_request(self, *, hub_id: str, user_id: str, actor_user_id: str) -> bool:
        if not self._can_manage_hub(hub_id=hub_id, actor_user_id=actor_user_id):
            return False
        row = self.db.scalar(
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "pending")
        )
        if not row:
            return False
        row.status = "active"
        self.db.commit()
        return True

    def reject_member_request(self, *, hub_id: str, user_id: str, actor_user_id: str) -> bool:
        if not self._can_manage_hub(hub_id=hub_id, actor_user_id=actor_user_id):
            return False
        row = self.db.scalar(
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "pending")
        )
        if not row:
            return False
        row.status = "rejected"
        self.db.commit()
        return True

    def leave_hub(self, *, hub_id: str, user_id: str) -> bool:
        row = self.db.scalar(
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "active")
        )
        if not row:
            return False
        row.status = "left"
        self.db.commit()
        return True

    def get_my_membership(
        self, *, hub_id: str, user_id: str
    ) -> HubMember | Mapping[str, Any] | None:
        stmt: Select[tuple[HubMember]] = (
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == user_id)
            .limit(1)
        )
        return self.db.scalar(stmt)

    def join_hub(self, *, hub_id: str, user_id: str) -> HubMember | None:
        hub = self.db.scalar(select(Hub).where(Hub.id == hub_id).limit(1))
        if not hub:
            return None

        membership = self.db.scalar(
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == user_id)
            .limit(1)
        )
        now = datetime.now(UTC)
        desired_status = (
            "active"
            if str(getattr(hub, "visibility", "public")).lower().strip() == "public"
            else "pending"
        )

        if membership:
            if membership.role in {"creator", "admin"} or membership.status == "active":
                membership.status = "active"
            else:
                membership.status = desired_status
                membership.role = membership.role or "member"
            if membership.joined_at is None:
                membership.joined_at = now
            self.db.commit()
            self.db.refresh(membership)
            return membership

        membership = HubMember(
            id=str(uuid4()),
            hub_id=hub_id,
            user_id=user_id,
            role="member",
            status=desired_status,
            joined_at=now,
        )
        self.db.add(membership)
        self.db.commit()
        self.db.refresh(membership)
        return membership
