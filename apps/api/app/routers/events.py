from datetime import UTC, datetime

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.auth import CurrentUser, get_current_user
from app.dependencies.db import get_db
from app.services.events import EventsService

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
def list_events(
    hub_id: str = Query(alias="hubId"),
    month_start: str | None = Query(default=None, alias="monthStart"),
    month_end: str | None = Query(default=None, alias="monthEnd"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    if month_start and month_end:
        return service.list_month_events(
            user_id=current_user.user_id,
            hub_id=hub_id,
            start_date=month_start,
            end_date=month_end,
        )
    return service.list_hub_events(user_id=current_user.user_id, hub_id=hub_id)


@router.get("/feed")
def events_feed(
    limit: int = Query(default=50, ge=1, le=200),
    today: str | None = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    today_value = today or datetime.now(UTC).date().isoformat()
    return service.list_my_upcoming_events(
        user_id=current_user.user_id,
        today=today_value,
        limit=limit,
    )


@router.post("")
def create_event(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    return service.create_event(user_id=current_user.user_id, payload=payload)


@router.patch("/{event_id}")
def update_event(
    event_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    return service.update_event(user_id=current_user.user_id, event_id=event_id, payload=payload)


@router.delete("/{event_id}")
def delete_event(
    event_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    return service.delete_event(user_id=current_user.user_id, event_id=event_id)


@router.get("/{event_id}/rsvps")
def list_event_rsvps(
    event_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    return service.list_rsvps(user_id=current_user.user_id, event_id=event_id)


@router.get("/{event_id}/rsvps/me")
def get_my_rsvp(
    event_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    return service.get_my_rsvp(user_id=current_user.user_id, event_id=event_id)


@router.put("/{event_id}/rsvps/me")
def put_my_rsvp(
    event_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    return service.upsert_rsvp(
        user_id=current_user.user_id,
        event_id=event_id,
        status_value=str(payload.get("status") or ""),
    )


@router.delete("/{event_id}/rsvps/me")
def delete_my_rsvp(
    event_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    return service.remove_my_rsvp(user_id=current_user.user_id, event_id=event_id)


@router.get("/{event_id}/rsvps/counts")
def get_rsvp_counts(
    event_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = EventsService(db)
    return service.rsvp_counts(user_id=current_user.user_id, event_id=event_id)
