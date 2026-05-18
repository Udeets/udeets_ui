from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models.event import Event
from app.db.models.event_rsvp import EventRsvp
from app.db.models.hub import Hub
from app.db.models.hub_member import HubMember
from app.db.repositories.memberships import MembershipRepository


def event_to_dto(event: Event, hub_name: str | None = None) -> dict:
    payload: dict[str, object] = {
        "id": str(event.id),
        "hubId": str(event.hub_id),
        "title": str(event.title or ""),
        "description": event.description,
        "eventDate": event.event_date.isoformat() if event.event_date else "",
        "startTime": event.start_time.isoformat() if event.start_time else None,
        "endTime": event.end_time.isoformat() if event.end_time else None,
        "location": event.location,
        "coverImageUrl": event.cover_image_url,
        "createdBy": str(event.created_by or ""),
        "createdAt": event.created_at.isoformat() if event.created_at else "",
    }
    if hub_name is not None:
        payload["hubName"] = hub_name
    return payload


class EventsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.memberships = MembershipRepository(db)

    def get_by_id(self, event_id: str) -> Event | None:
        return self.db.scalar(select(Event).where(Event.id == event_id).limit(1))

    def list_by_hub(self, hub_id: str) -> list[Event]:
        stmt = (
            select(Event)
            .where(Event.hub_id == hub_id)
            .order_by(Event.event_date.asc())
        )
        return list(self.db.scalars(stmt))

    def list_by_hub_date_range(
        self, hub_id: str, start_date: date, end_date: date
    ) -> list[Event]:
        stmt = (
            select(Event)
            .where(Event.hub_id == hub_id)
            .where(Event.event_date >= start_date)
            .where(Event.event_date <= end_date)
            .order_by(Event.event_date.asc())
        )
        return list(self.db.scalars(stmt))

    def list_upcoming_for_user(
        self, user_id: str, today: date, limit: int
    ) -> list[tuple[Event, str]]:
        hub_ids_stmt = (
            select(HubMember.hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "active")
        )
        hub_ids = [str(value) for value in self.db.scalars(hub_ids_stmt).all() if value]
        if not hub_ids:
            return []

        hub_names = {
            str(row.id): str(row.name or "Hub")
            for row in self.db.scalars(select(Hub).where(Hub.id.in_(hub_ids))).all()
        }
        events = list(
            self.db.scalars(
                select(Event)
                .where(Event.hub_id.in_(hub_ids))
                .where(Event.event_date >= today)
                .order_by(Event.event_date.asc())
                .limit(limit)
            ).all()
        )
        return [(event, hub_names.get(str(event.hub_id), "Hub")) for event in events]

    def create_event(self, *, user_id: str, payload: dict) -> Event:
        now = datetime.now(UTC)
        event = Event(
            id=str(uuid4()),
            hub_id=str(payload["hub_id"]),
            title=str(payload["title"]),
            description=payload.get("description"),
            event_date=payload["event_date"],
            start_time=payload.get("start_time"),
            end_time=payload.get("end_time"),
            location=payload.get("location"),
            cover_image_url=payload.get("cover_image_url"),
            created_by=user_id,
            created_at=now,
            updated_at=now,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def update_event(self, event: Event, payload: dict) -> Event:
        mapping = {
            "title": "title",
            "description": "description",
            "event_date": "event_date",
            "start_time": "start_time",
            "end_time": "end_time",
            "location": "location",
            "cover_image_url": "cover_image_url",
        }
        for key, attr in mapping.items():
            if key in payload:
                setattr(event, attr, payload[key])
        event.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete_event(self, event: Event) -> None:
        self.db.delete(event)
        self.db.commit()

    def get_rsvp(self, event_id: str, user_id: str) -> EventRsvp | None:
        return self.db.scalar(
            select(EventRsvp)
            .where(EventRsvp.event_id == event_id)
            .where(EventRsvp.user_id == user_id)
            .limit(1)
        )

    def list_rsvps(self, event_id: str) -> list[EventRsvp]:
        return list(self.db.scalars(select(EventRsvp).where(EventRsvp.event_id == event_id)))

    def upsert_rsvp(self, event_id: str, user_id: str, status_value: str) -> EventRsvp:
        row = self.get_rsvp(event_id, user_id)
        now = datetime.now(UTC)
        if row is None:
            row = EventRsvp(
                event_id=event_id,
                user_id=user_id,
                status=status_value,
                created_at=now,
            )
            self.db.add(row)
        else:
            row.status = status_value
        self.db.commit()
        self.db.refresh(row)
        return row

    def delete_rsvp(self, event_id: str, user_id: str) -> None:
        row = self.get_rsvp(event_id, user_id)
        if row is None:
            return
        self.db.delete(row)
        self.db.commit()

    def rsvp_status_counts(self, event_id: str) -> dict[str, int]:
        rows = self.db.execute(
            select(EventRsvp.status, func.count())
            .where(EventRsvp.event_id == event_id)
            .group_by(EventRsvp.status)
        ).all()
        counts = {"going": 0, "maybe": 0, "notGoing": 0}
        for status_value, count in rows:
            if status_value == "going":
                counts["going"] = int(count)
            elif status_value == "maybe":
                counts["maybe"] = int(count)
            elif status_value == "not_going":
                counts["notGoing"] = int(count)
        return counts
