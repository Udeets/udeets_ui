from datetime import UTC, datetime

from sqlalchemy import Select, exists, func, select
from sqlalchemy.orm import Session

from app.db.models.deet import Deet
from app.db.models.hub_member import HubMember


class HubUnreadRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_unread_hub_ids(self, user_id: str) -> list[str]:
        """Hubs with published deets from others newer than membership last_seen_at."""
        unread_deet = exists(
            select(1)
            .select_from(Deet)
            .where(
                Deet.hub_id == HubMember.hub_id,
                Deet.is_published.is_(True),
                Deet.created_at > func.coalesce(
                    HubMember.last_seen_at,
                    datetime(1970, 1, 1, tzinfo=UTC),
                ),
                Deet.created_by.is_distinct_from(HubMember.user_id),
            )
        )
        stmt: Select[tuple[str]] = (
            select(HubMember.hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "active")
            .where(unread_deet)
            .order_by(HubMember.hub_id)
        )
        return list(self.db.scalars(stmt))

    def mark_hub_seen(self, *, hub_id: str, user_id: str) -> bool:
        membership = self.db.scalar(
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "active")
            .limit(1)
        )
        if membership is None:
            return False
        membership.last_seen_at = datetime.now(UTC)
        self.db.commit()
        return True
