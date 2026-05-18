from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.models.deet import Deet
from app.db.models.deet_interaction import (
    CommentReaction,
    DeetComment,
    DeetLike,
    DeetShare,
    DeetView,
    PollVote,
    SurveyResponse,
)
from app.db.models.profile import Profile
from app.db.repositories.memberships import MembershipRepository
from app.services.media import extract_storage_key, to_public_media_url


def canonical_reaction(stored: str | None) -> str:
    if not stored:
        return "👍"
    if stored == "like":
        return "👍"
    return stored


def _profile_display_name(profile: Profile | None) -> str:
    if profile is None:
        return "Member"
    name = str(profile.full_name or "").strip()
    if name:
        return name
    email = str(profile.email or "")
    return email.split("@")[0] if email else "Member"


class DeetInteractionsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.memberships = MembershipRepository(db)

    def get_deet(self, deet_id: str) -> Deet | None:
        return self.db.scalar(select(Deet).where(Deet.id == deet_id).limit(1))

    def assert_deet_access(self, user_id: str, deet_id: str) -> Deet:
        deet = self.get_deet(deet_id)
        if deet is None:
            raise ValueError("not_found")
        if not self.memberships.get_active_membership(
            hub_id=str(deet.hub_id), user_id=user_id
        ):
            raise ValueError("forbidden")
        return deet

    def get_comment(self, comment_id: str) -> DeetComment | None:
        return self.db.scalar(select(DeetComment).where(DeetComment.id == comment_id).limit(1))

    def profiles_by_ids(self, user_ids: Iterable[str]) -> dict[str, Profile]:
        ids = sorted({uid for uid in user_ids if uid})
        if not ids:
            return {}
        rows = self.db.scalars(select(Profile).where(Profile.id.in_(ids))).all()
        return {str(row.id): row for row in rows}

    def toggle_like(self, user_id: str, deet_id: str, reaction_type: str) -> dict:
        incoming = canonical_reaction(reaction_type)
        existing = self.db.scalar(
            select(DeetLike)
            .where(DeetLike.deet_id == deet_id)
            .where(DeetLike.user_id == user_id)
            .limit(1)
        )
        liked = True
        my_reaction_type: str | None = incoming
        if existing:
            stored = canonical_reaction(existing.reaction_type)
            if stored == incoming:
                self.db.delete(existing)
                liked = False
                my_reaction_type = None
            else:
                existing.reaction_type = incoming
        else:
            self.db.add(
                DeetLike(
                    id=str(uuid4()),
                    deet_id=deet_id,
                    user_id=user_id,
                    reaction_type=incoming,
                    created_at=datetime.now(UTC),
                )
            )
        self.db.commit()
        count = self.db.scalar(
            select(func.count()).select_from(DeetLike).where(DeetLike.deet_id == deet_id)
        )
        return {
            "liked": liked,
            "likeCount": int(count or 0),
            "myReactionType": my_reaction_type,
        }

    def like_status(self, user_id: str, deet_ids: list[str]) -> dict[str, dict]:
        status_by_deet_id: dict[str, dict] = {
            deet_id: {"liked": False, "count": 0, "myReactionType": None} for deet_id in deet_ids
        }
        if not deet_ids:
            return status_by_deet_id
        counts = self.db.execute(
            select(DeetLike.deet_id, func.count())
            .where(DeetLike.deet_id.in_(deet_ids))
            .group_by(DeetLike.deet_id)
        ).all()
        for deet_id, count in counts:
            if str(deet_id) in status_by_deet_id:
                status_by_deet_id[str(deet_id)]["count"] = int(count)
        mine = self.db.scalars(
            select(DeetLike)
            .where(DeetLike.user_id == user_id)
            .where(DeetLike.deet_id.in_(deet_ids))
        ).all()
        for row in mine:
            deet_id = str(row.deet_id)
            if deet_id in status_by_deet_id:
                status_by_deet_id[deet_id]["liked"] = True
                status_by_deet_id[deet_id]["myReactionType"] = canonical_reaction(row.reaction_type)
        return status_by_deet_id

    def add_comment(
        self,
        user_id: str,
        deet_id: str,
        body: str,
        parent_id: str | None = None,
        image_url: str | None = None,
        attachment_url: str | None = None,
        attachment_name: str | None = None,
    ) -> dict:
        row = DeetComment(
            id=str(uuid4()),
            deet_id=deet_id,
            user_id=user_id,
            body=body,
            parent_id=parent_id,
            image_url=extract_storage_key(image_url) or image_url if image_url else None,
            attachment_url=extract_storage_key(attachment_url) or attachment_url
            if attachment_url
            else None,
            attachment_name=attachment_name,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        profile = self.db.scalar(select(Profile).where(Profile.id == user_id).limit(1))
        return self._comment_dto(row, profile)

    def _comment_dto(self, row: DeetComment, profile: Profile | None) -> dict:
        return {
            "id": str(row.id),
            "deetId": str(row.deet_id),
            "userId": str(row.user_id),
            "body": str(row.body or ""),
            "createdAt": row.created_at.isoformat() if row.created_at else "",
            "parentId": row.parent_id,
            "authorName": _profile_display_name(profile) or None,
            "authorAvatar": to_public_media_url(profile.avatar_url if profile else None),
            "imageUrl": to_public_media_url(row.image_url),
            "attachmentUrl": to_public_media_url(row.attachment_url),
            "attachmentName": row.attachment_name,
        }

    def list_comments(self, deet_id: str) -> list[dict]:
        rows = list(
            self.db.scalars(
                select(DeetComment)
                .where(DeetComment.deet_id == deet_id)
                .order_by(DeetComment.created_at.asc())
                .limit(100)
            ).all()
        )
        profiles = self.profiles_by_ids(row.user_id for row in rows)
        all_comments = [
            self._comment_dto(row, profiles.get(str(row.user_id))) for row in rows
        ]
        replies_by_parent: dict[str, list[dict]] = defaultdict(list)
        top_level: list[dict] = []
        for comment in all_comments:
            parent_id = comment.get("parentId")
            if parent_id:
                replies_by_parent[str(parent_id)].append(comment)
            else:
                top_level.append(comment)
        for comment in top_level:
            comment["replies"] = replies_by_parent.get(comment["id"], [])
        return top_level

    def edit_comment(self, user_id: str, comment_id: str, body: str) -> bool:
        row = self.db.scalar(
            select(DeetComment)
            .where(DeetComment.id == comment_id)
            .where(DeetComment.user_id == user_id)
            .limit(1)
        )
        if row is None:
            return False
        row.body = body
        row.updated_at = datetime.now(UTC)
        self.db.commit()
        return True

    def delete_comment(self, user_id: str, comment_id: str) -> bool:
        row = self.db.scalar(
            select(DeetComment)
            .where(DeetComment.id == comment_id)
            .where(DeetComment.user_id == user_id)
            .limit(1)
        )
        if row is None:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def list_reactors(self, deet_id: str) -> list[dict]:
        likes = list(
            self.db.scalars(
                select(DeetLike)
                .where(DeetLike.deet_id == deet_id)
                .order_by(DeetLike.created_at.desc())
                .limit(50)
            ).all()
        )
        profiles = self.profiles_by_ids(row.user_id for row in likes)
        reactors = []
        for row in likes:
            uid = str(row.user_id)
            profile = profiles.get(uid)
            reactors.append(
                {
                    "userId": uid,
                    "name": _profile_display_name(profile),
                    "avatar": to_public_media_url(profile.avatar_url if profile else None),
                    "reactionType": canonical_reaction(row.reaction_type),
                }
            )
        return reactors

    def reactor_previews(self, deet_ids: list[str]) -> dict[str, list[dict]]:
        if not deet_ids:
            return {}
        likes = list(
            self.db.scalars(
                select(DeetLike)
                .where(DeetLike.deet_id.in_(deet_ids))
                .order_by(DeetLike.created_at.desc())
            ).all()
        )
        profiles = self.profiles_by_ids(row.user_id for row in likes)
        result: dict[str, list[dict]] = defaultdict(list)
        for row in likes:
            deet_id = str(row.deet_id)
            uid = str(row.user_id)
            profile = profiles.get(uid)
            result[deet_id].append(
                {
                    "userId": uid,
                    "name": _profile_display_name(profile),
                    "avatar": to_public_media_url(profile.avatar_url if profile else None),
                    "reactionType": canonical_reaction(row.reaction_type),
                }
            )
        return dict(result)

    def deet_counts(self, deet_ids: list[str]) -> dict[str, dict]:
        if not deet_ids:
            return {}
        rows = self.db.scalars(select(Deet).where(Deet.id.in_(deet_ids))).all()
        return {
            str(row.id): {
                "likeCount": int(row.like_count or 0),
                "commentCount": int(row.comment_count or 0),
                "viewCount": int(row.view_count or 0),
            }
            for row in rows
        }

    def increment_view(self, user_id: str, deet_id: str) -> bool:
        existing = self.db.scalar(
            select(DeetView)
            .where(DeetView.deet_id == deet_id)
            .where(DeetView.user_id == user_id)
            .limit(1)
        )
        if existing:
            existing.viewed_at = datetime.now(UTC)
            self.db.commit()
            return False
        self.db.add(
            DeetView(
                id=str(uuid4()),
                deet_id=deet_id,
                user_id=user_id,
                viewed_at=datetime.now(UTC),
            )
        )
        self.db.commit()
        return True

    def list_viewers(self, deet_id: str) -> list[dict]:
        views = list(
            self.db.scalars(
                select(DeetView)
                .where(DeetView.deet_id == deet_id)
                .order_by(DeetView.viewed_at.desc())
                .limit(50)
            ).all()
        )
        profiles = self.profiles_by_ids(row.user_id for row in views)
        viewers = []
        for view in views:
            uid = str(view.user_id)
            profile = profiles.get(uid)
            viewers.append(
                {
                    "userId": uid,
                    "name": _profile_display_name(profile),
                    "avatar": to_public_media_url(profile.avatar_url if profile else None),
                    "viewedAt": view.viewed_at.isoformat() if view.viewed_at else "",
                }
            )
        return viewers

    def view_counts(self, deet_ids: list[str]) -> dict[str, int]:
        counts = {deet_id: 0 for deet_id in deet_ids}
        rows = self.db.execute(
            select(DeetView.deet_id, func.count())
            .where(DeetView.deet_id.in_(deet_ids))
            .group_by(DeetView.deet_id)
        ).all()
        for deet_id, count in rows:
            if str(deet_id) in counts:
                counts[str(deet_id)] = int(count)
        return counts

    def record_share(self, user_id: str, deet_id: str) -> tuple[bool, int]:
        existing = self.db.scalar(
            select(DeetShare)
            .where(DeetShare.deet_id == deet_id)
            .where(DeetShare.user_id == user_id)
            .limit(1)
        )
        already_shared = existing is not None
        if not already_shared:
            self.db.add(
                DeetShare(
                    id=str(uuid4()),
                    deet_id=deet_id,
                    user_id=user_id,
                    shared_at=datetime.now(UTC),
                )
            )
            self.db.commit()
        total = self.db.scalar(
            select(func.count()).select_from(DeetShare).where(DeetShare.deet_id == deet_id)
        )
        return already_shared, int(total or 0)

    def share_counts(self, deet_ids: list[str]) -> dict[str, int]:
        counts = {deet_id: 0 for deet_id in deet_ids}
        rows = self.db.execute(
            select(DeetShare.deet_id, func.count())
            .where(DeetShare.deet_id.in_(deet_ids))
            .group_by(DeetShare.deet_id)
        ).all()
        for deet_id, count in rows:
            if str(deet_id) in counts:
                counts[str(deet_id)] = int(count)
        return counts

    def toggle_comment_reaction(
        self, user_id: str, comment_id: str, reaction_type: str
    ) -> str | None:
        existing = self.db.scalar(
            select(CommentReaction)
            .where(CommentReaction.comment_id == comment_id)
            .where(CommentReaction.user_id == user_id)
            .limit(1)
        )
        if existing:
            if str(existing.reaction_type or "") == reaction_type:
                self.db.delete(existing)
                self.db.commit()
                return None
            existing.reaction_type = reaction_type
            self.db.commit()
            return reaction_type
        self.db.add(
            CommentReaction(
                id=str(uuid4()),
                comment_id=comment_id,
                user_id=user_id,
                reaction_type=reaction_type,
                created_at=datetime.now(UTC),
            )
        )
        self.db.commit()
        return reaction_type

    def comment_reactions(self, user_id: str, comment_ids: list[str]) -> dict[str, str]:
        if not comment_ids:
            return {}
        rows = self.db.scalars(
            select(CommentReaction)
            .where(CommentReaction.user_id == user_id)
            .where(CommentReaction.comment_id.in_(comment_ids))
        ).all()
        return {str(row.comment_id): str(row.reaction_type or "") for row in rows}

    def poll_votes(self, deet_ids: list[str], user_id: str | None = None) -> list[dict]:
        stmt = select(PollVote).where(PollVote.deet_id.in_(deet_ids))
        if user_id:
            stmt = stmt.where(PollVote.user_id == user_id)
        rows = self.db.scalars(stmt).all()
        return [
            {
                "deetId": str(row.deet_id),
                "userId": str(row.user_id),
                "optionIndex": int(row.option_index),
            }
            for row in rows
        ]

    def cast_poll_vote(self, user_id: str, deet_id: str, option_index: int) -> None:
        self.db.execute(
            delete(PollVote).where(PollVote.deet_id == deet_id).where(PollVote.user_id == user_id)
        )
        self.db.add(
            PollVote(
                id=str(uuid4()),
                deet_id=deet_id,
                user_id=user_id,
                option_index=option_index,
                created_at=datetime.now(UTC),
            )
        )
        self.db.commit()

    def toggle_poll_multi_vote(
        self,
        user_id: str,
        deet_id: str,
        option_index: int,
        multi_select_limit: int | None,
    ) -> None:
        mine = list(
            self.db.scalars(
                select(PollVote)
                .where(PollVote.deet_id == deet_id)
                .where(PollVote.user_id == user_id)
                .order_by(PollVote.created_at.asc())
            ).all()
        )
        hit = next((row for row in mine if int(row.option_index) == option_index), None)
        if hit:
            self.db.delete(hit)
            self.db.commit()
            return
        limit = 2**31
        if isinstance(multi_select_limit, int):
            limit = max(1, multi_select_limit)
        if len(mine) >= limit and mine:
            self.db.delete(mine[0])
        self.db.add(
            PollVote(
                id=str(uuid4()),
                deet_id=deet_id,
                user_id=user_id,
                option_index=option_index,
                created_at=datetime.now(UTC),
            )
        )
        self.db.commit()

    def remove_poll_vote(self, user_id: str, deet_id: str) -> None:
        self.db.execute(
            delete(PollVote).where(PollVote.deet_id == deet_id).where(PollVote.user_id == user_id)
        )
        self.db.commit()

    def my_survey_responses(self, user_id: str, deet_ids: list[str]) -> list[dict]:
        rows = self.db.scalars(
            select(SurveyResponse)
            .where(SurveyResponse.user_id == user_id)
            .where(SurveyResponse.deet_id.in_(deet_ids))
        ).all()
        return [
            {
                "deetId": str(row.deet_id),
                "userId": str(row.user_id),
                "questionIndex": int(row.question_index),
                "optionIndex": int(row.option_index),
                "fingerprint": str(row.fingerprint),
                "createdAt": row.created_at.isoformat() if row.created_at else "",
            }
            for row in rows
        ]

    def submit_survey_responses(
        self, user_id: str, deet_id: str, fingerprint: str, answers: list[int]
    ) -> None:
        self.db.execute(
            delete(SurveyResponse)
            .where(SurveyResponse.deet_id == deet_id)
            .where(SurveyResponse.user_id == user_id)
        )
        for index, option_index in enumerate(answers):
            self.db.add(
                SurveyResponse(
                    id=str(uuid4()),
                    deet_id=deet_id,
                    user_id=user_id,
                    question_index=index,
                    option_index=option_index,
                    fingerprint=fingerprint,
                    created_at=datetime.now(UTC),
                )
            )
        self.db.commit()

    def delete_my_survey_responses(self, user_id: str, deet_id: str) -> None:
        self.db.execute(
            delete(SurveyResponse)
            .where(SurveyResponse.deet_id == deet_id)
            .where(SurveyResponse.user_id == user_id)
        )
        self.db.commit()
