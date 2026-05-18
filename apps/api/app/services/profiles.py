from sqlalchemy.orm import Session

from app.db.repositories.memberships import MembershipRepository
from app.db.repositories.profiles import ProfilesRepository, display_name
from app.services.media import to_public_media_url


class ProfilesService:
    def __init__(self, db: Session) -> None:
        self.repo = ProfilesRepository(db)
        self.memberships = MembershipRepository(db)

    def get_me(self, user_id: str) -> dict:
        row = self.repo.get_by_id(user_id)
        if row is None:
            return {"profile": None}
        return {
            "profile": {
                "id": row.id,
                "full_name": row.full_name,
                "avatar_url": to_public_media_url(row.avatar_url),
                "email": row.email,
                "app_role": row.app_role,
                "notification_preferences": row.notification_preferences,
                "privacy_settings": row.privacy_settings,
            }
        }

    def list_brief(self, user_ids: list[str]) -> dict:
        rows = self.repo.list_by_ids(user_ids)
        return {
            "profiles": [
                {
                    "id": row.id,
                    "full_name": row.full_name,
                    "avatar_url": to_public_media_url(row.avatar_url),
                    "email": row.email,
                }
                for row in rows
            ]
        }

    def get_summary(self, viewer_id: str, user_id: str) -> dict | None:
        row = self.repo.get_by_id(user_id)
        if row is None:
            return None
        return {
            "id": row.id,
            "fullName": display_name(row),
            "avatarUrl": to_public_media_url(row.avatar_url),
            "email": row.email,
            "joinedAt": row.created_at.isoformat() if row.created_at else None,
            "likeCount": self.repo.count_likes(user_id),
            "commentCount": self.repo.count_comments(user_id),
            "postCount": self.repo.count_published_posts(user_id),
            "viewerHasLiked": self.repo.viewer_has_liked(
                profile_id=user_id, viewer_id=viewer_id
            ),
        }

    def search(self, query: str, limit: int) -> dict:
        rows = self.repo.search(query, limit)
        return {
            "profiles": [
                {
                    "id": row.id,
                    "fullName": display_name(row),
                    "avatarUrl": to_public_media_url(row.avatar_url),
                    "email": row.email,
                }
                for row in rows
            ]
        }

    def toggle_like(self, user_id: str, profile_id: str) -> dict:
        liked, count = self.repo.toggle_like(profile_id=profile_id, user_id=user_id)
        return {"liked": liked, "count": count}

    def list_likers(self, viewer_id: str, profile_id: str, limit: int) -> dict:
        rows = self.repo.list_likers(profile_id, limit)
        profiles = {p.id: p for p in self.repo.list_by_ids([row.liker_id for row in rows])}
        likers = []
        for row in rows:
            profile = profiles.get(row.liker_id)
            likers.append(
                {
                    "userId": row.liker_id,
                    "fullName": display_name(profile),
                    "avatarUrl": to_public_media_url(profile.avatar_url if profile else None),
                    "likedAt": row.created_at.isoformat() if row.created_at else None,
                    "isOwn": row.liker_id == viewer_id,
                }
            )
        return {"likers": likers}

    def list_comments(self, viewer_id: str, profile_id: str, limit: int) -> dict:
        rows = self.repo.list_comments(profile_id, limit)
        profiles = {p.id: p for p in self.repo.list_by_ids([row.author_id for row in rows])}
        comments = []
        for row in rows:
            author = profiles.get(row.author_id)
            comments.append(
                {
                    "id": row.id,
                    "profileId": row.profile_id,
                    "authorId": row.author_id,
                    "authorName": display_name(author),
                    "authorAvatar": to_public_media_url(author.avatar_url if author else None),
                    "body": row.body,
                    "createdAt": row.created_at.isoformat() if row.created_at else None,
                    "isOwn": row.author_id == viewer_id,
                }
            )
        return {"comments": comments}

    def add_comment(self, user_id: str, profile_id: str, body: str) -> dict | None:
        trimmed = body.strip()
        if not trimmed:
            return None
        row = self.repo.add_comment(profile_id=profile_id, author_id=user_id, body=trimmed)
        author = self.repo.get_by_id(user_id)
        return {
            "id": row.id,
            "profileId": row.profile_id,
            "authorId": user_id,
            "authorName": display_name(author),
            "authorAvatar": to_public_media_url(author.avatar_url if author else None),
            "body": row.body,
            "createdAt": row.created_at.isoformat() if row.created_at else None,
            "isOwn": True,
        }

    def delete_comment(self, user_id: str, comment_id: str) -> dict:
        row = self.repo.get_comment(comment_id)
        if row is None:
            return {"ok": False}
        if user_id not in {row.author_id, row.profile_id}:
            return {"ok": False}
        return {"ok": self.repo.delete_comment(comment_id)}

    def report_user(
        self,
        reporter_id: str,
        reported_user_id: str,
        reason: str,
        context: str | None,
    ) -> dict:
        trimmed = reason.strip()
        if not trimmed or reporter_id == reported_user_id:
            return {"ok": False}
        self.repo.report_user(
            reporter_id=reporter_id,
            reported_user_id=reported_user_id,
            reason=trimmed,
            context=context,
        )
        return {"ok": True}

    def upsert_me(
        self,
        user_id: str,
        full_name: str | None,
        avatar_url: str | None,
        email: str | None,
    ) -> dict:
        self.repo.upsert(
            user_id=user_id,
            full_name=full_name,
            avatar_url=avatar_url,
            email=email,
        )
        return {"ok": True}

    def update_me(
        self,
        user_id: str,
        full_name: str | None,
        avatar_url: str | None,
        email: str | None,
        notification_preferences: dict | None = None,
        privacy_settings: dict | None = None,
    ) -> dict:
        self.repo.update(
            user_id=user_id,
            full_name=full_name,
            avatar_url=avatar_url,
            email=email,
            notification_preferences=notification_preferences,
            privacy_settings=privacy_settings,
        )
        return {"ok": True}

    def cancel_pending_request(self, user_id: str, membership_id: str) -> dict:
        ok = self.memberships.cancel_pending_request(
            user_id=user_id, membership_id=membership_id
        )
        return {"ok": ok}

    def get_header_feed(self, user_id: str) -> dict:
        return self.repo.get_header_feed(user_id)
