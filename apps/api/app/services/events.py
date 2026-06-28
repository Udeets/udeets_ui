from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.events import EventsRepository, event_to_dto


class EventsService:
    def __init__(self, db: Session) -> None:
        self.repo = EventsRepository(db)

    def _require_active_member(self, user_id: str, hub_id: str) -> None:
        if not self.repo.memberships.get_active_membership(hub_id=hub_id, user_id=user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this hub.",
            )

    def _require_hub_staff(self, user_id: str, hub_id: str) -> None:
        if not self.repo.memberships.can_manage_hub(hub_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only hub creators/admins can manage events.",
            )

    def _event_or_404(self, event_id: str):
        event = self.repo.get_by_id(event_id)
        if event is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
        return event

    def list_hub_events(self, user_id: str, hub_id: str) -> dict:
        self._require_active_member(user_id, hub_id)
        rows = self.repo.list_by_hub(hub_id)
        return {"events": [event_to_dto(row) for row in rows]}

    def list_month_events(self, user_id: str, hub_id: str, start_date: str, end_date: str) -> dict:
        self._require_active_member(user_id, hub_id)
        rows = self.repo.list_by_hub_date_range(
            hub_id,
            date.fromisoformat(start_date),
            date.fromisoformat(end_date),
        )
        return {"events": [event_to_dto(row) for row in rows]}

    def list_my_upcoming_events(self, user_id: str, today: str, limit: int = 50) -> dict:
        rows = self.repo.list_upcoming_for_user(
            user_id=user_id,
            today=date.fromisoformat(today),
            limit=limit,
        )
        return {"events": [event_to_dto(event, hub_name=hub_name) for event, hub_name in rows]}

    def create_event(self, user_id: str, payload: dict) -> dict:
        hub_id = str(payload.get("hubId") or "")
        if not hub_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="hubId is required."
            )
        self._require_hub_staff(user_id, hub_id)
        title = str(payload.get("title") or "").strip()
        event_date_raw = str(payload.get("eventDate") or "").strip()
        if not title or not event_date_raw:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="title and eventDate are required.",
            )
        created = self.repo.create_event(
            user_id=user_id,
            payload={
                "hub_id": hub_id,
                "title": title,
                "description": payload.get("description"),
                "event_date": date.fromisoformat(event_date_raw),
                "start_time": payload.get("startTime"),
                "end_time": payload.get("endTime"),
                "location": payload.get("location"),
                "cover_image_url": payload.get("coverImageUrl"),
            },
        )
        return {"event": event_to_dto(created)}

    def update_event(self, user_id: str, event_id: str, payload: dict) -> dict:
        event = self._event_or_404(event_id)
        self._require_hub_staff(user_id, str(event.hub_id))
        update_doc: dict[str, object] = {}
        mapping = {
            "title": "title",
            "description": "description",
            "eventDate": "event_date",
            "startTime": "start_time",
            "endTime": "end_time",
            "location": "location",
            "coverImageUrl": "cover_image_url",
        }
        for source_key, target_key in mapping.items():
            if source_key in payload:
                value = payload.get(source_key)
                if target_key == "event_date" and isinstance(value, str):
                    update_doc[target_key] = date.fromisoformat(value)
                else:
                    update_doc[target_key] = value
        if not update_doc:
            return {"event": event_to_dto(event)}
        updated = self.repo.update_event(event, update_doc)
        return {"event": event_to_dto(updated)}

    def delete_event(self, user_id: str, event_id: str) -> dict:
        event = self._event_or_404(event_id)
        actor_is_creator = str(event.created_by or "") == user_id
        is_staff = self.repo.memberships.can_manage_hub(str(event.hub_id), user_id)
        if not is_staff and not actor_is_creator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only hub staff or the event creator can delete this event.",
            )
        self.repo.delete_event(event)
        return {"ok": True}

    def upsert_rsvp(self, user_id: str, event_id: str, status_value: str) -> dict:
        if status_value not in {"going", "maybe", "not_going"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid RSVP status."
            )
        event = self._event_or_404(event_id)
        self._require_active_member(user_id, str(event.hub_id))
        row = self.repo.upsert_rsvp(event_id, user_id, status_value)
        return {
            "rsvp": {
                "eventId": str(row.event_id),
                "userId": str(row.user_id),
                "status": str(row.status),
            }
        }

    def get_my_rsvp(self, user_id: str, event_id: str) -> dict:
        event = self._event_or_404(event_id)
        self._require_active_member(user_id, str(event.hub_id))
        row = self.repo.get_rsvp(event_id, user_id)
        if row is None:
            return {"rsvp": None}
        return {
            "rsvp": {
                "eventId": str(row.event_id),
                "userId": str(row.user_id),
                "status": str(row.status),
            }
        }

    def list_rsvps(self, user_id: str, event_id: str) -> dict:
        event = self._event_or_404(event_id)
        self._require_active_member(user_id, str(event.hub_id))
        rows = self.repo.list_rsvps(event_id)
        return {
            "rsvps": [
                {
                    "eventId": str(row.event_id),
                    "userId": str(row.user_id),
                    "status": str(row.status),
                }
                for row in rows
            ]
        }

    def remove_my_rsvp(self, user_id: str, event_id: str) -> dict:
        event = self._event_or_404(event_id)
        self._require_active_member(user_id, str(event.hub_id))
        self.repo.delete_rsvp(event_id, user_id)
        return {"ok": True}

    def rsvp_counts(self, user_id: str, event_id: str) -> dict:
        event = self._event_or_404(event_id)
        self._require_active_member(user_id, str(event.hub_id))
        return {"counts": self.repo.rsvp_status_counts(event_id)}
