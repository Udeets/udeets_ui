"""Fan-out domain notification signals to connected users via Redis pub/sub."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.repositories.memberships import MembershipRepository
from app.notifications.helpers import (
    publish_feed_invalidate,
    publish_member_join_accepted,
    publish_member_pending,
    publish_unread_changed,
)


def _active_member_user_ids(db: Session, hub_id: str, *, exclude_user_id: str | None = None) -> list[str]:
    repo = MembershipRepository(db)
    ids: list[str] = []
    for row in repo.list_hub_members(hub_id):
        user_id = str(getattr(row, "user_id", "") or "")
        if not user_id or user_id == exclude_user_id:
            continue
        ids.append(user_id)
    return ids


def _hub_staff_user_ids(db: Session, hub_id: str) -> list[str]:
    repo = MembershipRepository(db)
    ids: list[str] = []
    for row in repo.list_hub_members(hub_id):
        role = str(getattr(row, "role", "") or "")
        user_id = str(getattr(row, "user_id", "") or "")
        if user_id and role in {"creator", "admin"}:
            ids.append(user_id)
    return ids


def notify_hub_feed_invalidate(
    db: Session,
    hub_id: str,
    *,
    exclude_user_id: str | None = None,
    reason: str = "deet",
) -> None:
    for user_id in _active_member_user_ids(db, hub_id, exclude_user_id=exclude_user_id):
        publish_feed_invalidate(user_id=user_id, reason=reason)


def notify_hub_unread_changed(
    db: Session,
    hub_id: str,
    *,
    exclude_user_id: str | None = None,
) -> None:
    for user_id in _active_member_user_ids(db, hub_id, exclude_user_id=exclude_user_id):
        publish_unread_changed(user_id=user_id, hub_id=hub_id)


def notify_member_pending_to_staff(
    db: Session,
    *,
    hub_id: str,
    requester_user_id: str,
) -> None:
    for user_id in _hub_staff_user_ids(db, hub_id):
        if user_id == requester_user_id:
            continue
        publish_member_pending(
            user_id=user_id,
            hub_id=hub_id,
            requester_user_id=requester_user_id,
        )
        publish_feed_invalidate(user_id=user_id, reason="member_pending")


def notify_member_join_accepted(*, user_id: str, hub_id: str) -> None:
    publish_member_join_accepted(user_id=user_id, hub_id=hub_id)
    publish_feed_invalidate(user_id=user_id, reason="member_join_accepted")
    publish_unread_changed(user_id=user_id, hub_id=hub_id)
