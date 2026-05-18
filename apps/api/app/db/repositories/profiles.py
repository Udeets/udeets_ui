from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db.models.deet import Deet
from app.db.models.event import Event
from app.db.models.hub import Hub
from app.db.models.hub_member import HubMember
from app.db.models.profile import Profile
from app.db.models.profile_comment import ProfileComment
from app.db.models.profile_like import ProfileLike
from app.db.models.user_report import UserReport
from app.services.media import extract_storage_key, to_public_media_url


def display_name(row: Profile | None) -> str:
    if row is None:
        return "uDeets user"
    full_name = str(row.full_name or "").strip()
    if full_name:
        return full_name
    email = str(row.email or "").strip()
    if email and "@" in email:
        return email.split("@", 1)[0]
    return "uDeets user"


def relative_time(iso_value: datetime | str | None) -> str:
    if iso_value is None:
        return "just now"
    if isinstance(iso_value, datetime):
        created = iso_value.astimezone(UTC)
    else:
        try:
            created = datetime.fromisoformat(str(iso_value).replace("Z", "+00:00")).astimezone(UTC)
        except ValueError:
            return "just now"
    diff_minutes = max(0, round((datetime.now(UTC) - created).total_seconds() / 60))
    if diff_minutes >= 1440:
        return f"{diff_minutes // 1440}d"
    if diff_minutes >= 60:
        return f"{diff_minutes // 60}h"
    if diff_minutes >= 1:
        return f"{diff_minutes}m"
    return "just now"


class ProfilesRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: str) -> Profile | None:
        return self.db.scalar(select(Profile).where(Profile.id == user_id).limit(1))

    def list_by_ids(self, user_ids: list[str]) -> list[Profile]:
        unique_ids = sorted({value for value in user_ids if value})
        if not unique_ids:
            return []
        return list(self.db.scalars(select(Profile).where(Profile.id.in_(unique_ids))))

    def search(self, query: str, limit: int) -> list[Profile]:
        safe = query.strip()
        if len(safe) < 2:
            return []
        pattern = f"%{safe}%"
        stmt = (
            select(Profile)
            .where(or_(Profile.full_name.ilike(pattern), Profile.email.ilike(pattern)))
            .order_by(Profile.full_name.asc())
            .limit(max(1, min(limit, 50)))
        )
        return list(self.db.scalars(stmt))

    def upsert(
        self,
        *,
        user_id: str,
        full_name: str | None,
        avatar_url: str | None,
        email: str | None,
    ) -> None:
        row = self.get_by_id(user_id)
        normalized_avatar = extract_storage_key(avatar_url) if avatar_url is not None else None
        if row:
            if email is not None:
                row.email = email
            if normalized_avatar is not None:
                row.avatar_url = normalized_avatar
            row.updated_at = datetime.now(UTC)
            self.db.commit()
            return
        self.db.add(
            Profile(
                id=user_id,
                full_name=full_name,
                avatar_url=normalized_avatar,
                email=email,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
        )
        self.db.commit()

    def update(
        self,
        *,
        user_id: str,
        full_name: str | None = None,
        avatar_url: str | None = None,
        email: str | None = None,
        notification_preferences: dict | None = None,
        privacy_settings: dict | None = None,
    ) -> None:
        row = self.get_by_id(user_id)
        if row is None:
            return
        if full_name is not None:
            row.full_name = full_name
        if avatar_url is not None:
            row.avatar_url = extract_storage_key(avatar_url) or avatar_url
        if email is not None:
            row.email = email
        if notification_preferences is not None:
            row.notification_preferences = notification_preferences
        if privacy_settings is not None:
            row.privacy_settings = privacy_settings
        row.updated_at = datetime.now(UTC)
        self.db.commit()

    def count_likes(self, profile_id: str) -> int:
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(ProfileLike)
                .where(ProfileLike.profile_id == profile_id)
            )
            or 0
        )

    def count_comments(self, profile_id: str) -> int:
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(ProfileComment)
                .where(ProfileComment.profile_id == profile_id)
            )
            or 0
        )

    def count_published_posts(self, user_id: str) -> int:
        return int(
            self.db.scalar(
                select(func.count())
                .select_from(Deet)
                .where(Deet.created_by == user_id)
                .where(Deet.is_published.is_(True))
            )
            or 0
        )

    def viewer_has_liked(self, *, profile_id: str, viewer_id: str) -> bool:
        row = self.db.scalar(
            select(ProfileLike.id)
            .where(ProfileLike.profile_id == profile_id)
            .where(ProfileLike.liker_id == viewer_id)
            .limit(1)
        )
        return row is not None

    def toggle_like(self, *, profile_id: str, user_id: str) -> tuple[bool, int]:
        existing = self.db.scalar(
            select(ProfileLike)
            .where(ProfileLike.profile_id == profile_id)
            .where(ProfileLike.liker_id == user_id)
            .limit(1)
        )
        if existing:
            self.db.delete(existing)
            liked = False
        else:
            self.db.add(
                ProfileLike(
                    id=str(uuid4()),
                    profile_id=profile_id,
                    liker_id=user_id,
                    created_at=datetime.now(UTC),
                )
            )
            liked = True
        self.db.commit()
        return liked, self.count_likes(profile_id)

    def list_likers(self, profile_id: str, limit: int) -> list[ProfileLike]:
        stmt = (
            select(ProfileLike)
            .where(ProfileLike.profile_id == profile_id)
            .order_by(ProfileLike.created_at.desc())
            .limit(max(1, min(limit, 200)))
        )
        return list(self.db.scalars(stmt))

    def list_comments(self, profile_id: str, limit: int) -> list[ProfileComment]:
        stmt = (
            select(ProfileComment)
            .where(ProfileComment.profile_id == profile_id)
            .order_by(ProfileComment.created_at.desc())
            .limit(max(1, min(limit, 200)))
        )
        return list(self.db.scalars(stmt))

    def add_comment(self, *, profile_id: str, author_id: str, body: str) -> ProfileComment:
        row = ProfileComment(
            id=str(uuid4()),
            profile_id=profile_id,
            author_id=author_id,
            body=body[:500],
            created_at=datetime.now(UTC),
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def get_comment(self, comment_id: str) -> ProfileComment | None:
        return self.db.scalar(
            select(ProfileComment).where(ProfileComment.id == comment_id).limit(1)
        )

    def delete_comment(self, comment_id: str) -> bool:
        row = self.get_comment(comment_id)
        if row is None:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def report_user(
        self,
        *,
        reporter_id: str,
        reported_user_id: str,
        reason: str,
        context: str | None,
    ) -> None:
        self.db.add(
            UserReport(
                id=str(uuid4()),
                reporter_id=reporter_id,
                reported_user_id=reported_user_id,
                reason=reason[:1000],
                context=(context or "")[:500] or None,
                created_at=datetime.now(UTC),
            )
        )
        self.db.commit()

    def get_header_feed(self, user_id: str) -> dict[str, list[dict[str, Any]]]:
        membership_rows = list(
            self.db.scalars(select(HubMember).where(HubMember.user_id == user_id))
        )
        active_hub_ids = sorted(
            {row.hub_id for row in membership_rows if row.status == "active" and row.hub_id}
        )
        if not active_hub_ids:
            return {"notifications": [], "events": []}

        hubs = list(self.db.scalars(select(Hub).where(Hub.id.in_(active_hub_ids))))
        hub_map = {
            hub.id: {
                "name": hub.name,
                "slug": hub.slug,
                "category": hub.category,
                "image": to_public_media_url(hub.dp_image_url),
                "created_by": hub.created_by,
            }
            for hub in hubs
        }

        recent_deets = list(
            self.db.scalars(
                select(Deet)
                .where(Deet.hub_id.in_(active_hub_ids))
                .where(Deet.is_published.is_(True))
                .order_by(Deet.created_at.desc())
                .limit(30)
            )
        )

        notifications: list[dict[str, Any]] = []
        for row in recent_deets:
            hub = hub_map.get(row.hub_id)
            if not hub:
                continue
            kind = str(row.kind or "")
            notif_type = "Activity"
            if kind in {"Notices", "Alerts"}:
                notif_type = "Tagged"
            elif kind in {"Posts", "Photos", "News"}:
                notif_type = "New Posts"
            body_text = " ".join(str(row.body or "").replace("<", " <").split())
            notifications.append(
                {
                    "id": row.id,
                    "title": row.title or row.author_name or "New post",
                    "body": body_text[:120] or "New post",
                    "meta": relative_time(row.created_at),
                    "hub": hub["name"],
                    "hubImage": hub.get("image"),
                    "type": notif_type,
                    "category": hub["category"],
                    "slug": hub["slug"],
                    "focusId": row.id,
                    "href": f"/hubs/{hub['category']}/{hub['slug']}?tab=Posts&focus={row.id}",
                }
            )

        created_hub_ids = [
            hub_id for hub_id, hub in hub_map.items() if hub.get("created_by") == user_id
        ]
        if created_hub_ids:
            pending_rows = list(
                self.db.scalars(
                    select(HubMember)
                    .where(HubMember.hub_id.in_(created_hub_ids))
                    .where(HubMember.status == "pending")
                    .order_by(HubMember.joined_at.desc())
                    .limit(20)
                )
            )
            requester_ids = [row.user_id for row in pending_rows if row.user_id]
            requester_profiles = {p.id: p for p in self.list_by_ids(requester_ids)}
            for row in pending_rows:
                hub = hub_map.get(row.hub_id)
                if not hub:
                    continue
                requester = requester_profiles.get(row.user_id or "")
                requester_name = display_name(requester)
                notifications.append(
                    {
                        "id": f"join-{row.id}",
                        "title": f"{requester_name} wants to join",
                        "body": f"Pending join request for {hub['name']}",
                        "meta": relative_time(row.joined_at),
                        "hub": hub["name"],
                        "hubImage": hub.get("image"),
                        "type": "Activity",
                        "category": hub["category"],
                        "slug": hub["slug"],
                        "focusId": "",
                        "href": f"/hubs/{hub['category']}/{hub['slug']}?tab=Members",
                    }
                )

        seven_days_ago = datetime.now(UTC) - timedelta(days=7)
        accepted_rows = list(
            self.db.scalars(
                select(HubMember)
                .where(HubMember.user_id == user_id)
                .where(HubMember.status == "active")
                .where(HubMember.joined_at >= seven_days_ago)
                .order_by(HubMember.joined_at.desc())
                .limit(10)
            )
        )
        for row in accepted_rows:
            if row.role == "creator":
                continue
            hub = hub_map.get(row.hub_id)
            if not hub:
                continue
            notifications.append(
                {
                    "id": f"accepted-{row.id}",
                    "title": "You've been accepted!",
                    "body": f"You're now a member of {hub['name']}",
                    "meta": relative_time(row.joined_at),
                    "hub": hub["name"],
                    "hubImage": hub.get("image"),
                    "type": "Activity",
                    "category": hub["category"],
                    "slug": hub["slug"],
                    "focusId": "",
                    "href": f"/hubs/{hub['category']}/{hub['slug']}?tab=About",
                }
            )

        today = datetime.now(UTC).date()
        tomorrow = today + timedelta(days=1)
        week_end = today + timedelta(days=(7 - today.weekday()))
        event_rows = list(
            self.db.scalars(
                select(Event)
                .where(Event.hub_id.in_(active_hub_ids))
                .where(Event.event_date >= today)
                .order_by(Event.event_date.asc())
                .limit(30)
            )
        )
        events: list[dict[str, Any]] = []
        for row in event_rows:
            hub = hub_map.get(row.hub_id)
            if not hub:
                continue
            event_date = row.event_date
            group = "This Week"
            if event_date == today:
                group = "Today"
            elif event_date == tomorrow:
                group = "Tomorrow"
            elif event_date > week_end:
                group = "This Week"
            events.append(
                {
                    "id": row.id,
                    "title": row.title or "Event",
                    "hub": hub["name"],
                    "hubImage": hub.get("image"),
                    "category": hub["category"],
                    "slug": hub["slug"],
                    "dateLabel": event_date.strftime("%b %d").replace(" 0", " "),
                    "time": str(row.start_time or ""),
                    "location": str(row.location or ""),
                    "badge": "My Hubs",
                    "theme": "Community",
                    "description": str(row.description or ""),
                    "focusId": row.id,
                    "href": f"/hubs/{hub['category']}/{hub['slug']}?focus={row.id}",
                    "group": group,
                }
            )
        return {"notifications": notifications, "events": events}
