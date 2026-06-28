from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.deet_interactions import DeetInteractionsRepository


class DeetInteractionsService:
    def __init__(self, db: Session) -> None:
        self.repo = DeetInteractionsRepository(db)

    def _access(self, user_id: str, deet_id: str) -> None:
        try:
            self.repo.assert_deet_access(user_id, deet_id)
        except ValueError as exc:
            code = str(exc)
            if code == "not_found":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Deet not found."
                ) from exc
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this deet.",
            ) from exc

    def toggle_like(self, user_id: str, deet_id: str, reaction_type: str = "like") -> dict:
        self._access(user_id, deet_id)
        return self.repo.toggle_like(user_id, deet_id, reaction_type)

    def like_status(self, user_id: str, deet_ids: list[str]) -> dict:
        return {"statusByDeetId": self.repo.like_status(user_id, deet_ids)}

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
        self._access(user_id, deet_id)
        trimmed = (body or "").strip()
        if not trimmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Comment cannot be empty.",
            )
        return {"comment": self.repo.add_comment(
            user_id, deet_id, trimmed, parent_id, image_url, attachment_url, attachment_name
        )}

    def list_comments(self, user_id: str, deet_id: str) -> dict:
        self._access(user_id, deet_id)
        return {"comments": self.repo.list_comments(deet_id)}

    def edit_comment(self, user_id: str, comment_id: str, body: str) -> dict:
        trimmed = (body or "").strip()
        if not trimmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Comment cannot be empty.",
            )
        if not self.repo.edit_comment(user_id, comment_id, trimmed):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found or not editable by this user.",
            )
        return {"ok": True}

    def delete_comment(self, user_id: str, comment_id: str, deet_id: str) -> dict:
        self._access(user_id, deet_id)
        if not self.repo.delete_comment(user_id, comment_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found or not removable by this user.",
            )
        return {"ok": True}

    def list_reactors(self, user_id: str, deet_id: str) -> dict:
        self._access(user_id, deet_id)
        return {"reactors": self.repo.list_reactors(deet_id)}

    def reactor_previews(self, user_id: str, deet_ids: list[str]) -> dict:
        return {"previewsByDeetId": self.repo.reactor_previews(deet_ids)}

    def deet_counts(self, user_id: str, deet_ids: list[str]) -> dict:
        return {"countsByDeetId": self.repo.deet_counts(deet_ids)}

    def increment_view(self, user_id: str, deet_id: str) -> dict:
        self._access(user_id, deet_id)
        return {"isNew": self.repo.increment_view(user_id, deet_id)}

    def list_viewers(self, user_id: str, deet_id: str) -> dict:
        self._access(user_id, deet_id)
        return {"viewers": self.repo.list_viewers(deet_id)}

    def view_counts(self, user_id: str, deet_ids: list[str]) -> dict:
        for deet_id in deet_ids:
            self._access(user_id, deet_id)
        return {"countsByDeetId": self.repo.view_counts(deet_ids)}

    def record_share(self, user_id: str, deet_id: str) -> dict:
        self._access(user_id, deet_id)
        already_shared, total = self.repo.record_share(user_id, deet_id)
        return {"alreadyShared": already_shared, "total": total}

    def share_counts(self, user_id: str, deet_ids: list[str]) -> dict:
        for deet_id in deet_ids:
            self._access(user_id, deet_id)
        return {"countsByDeetId": self.repo.share_counts(deet_ids)}

    def toggle_comment_reaction(self, user_id: str, comment_id: str, reaction_type: str) -> dict:
        comment = self.repo.get_comment(comment_id)
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
        self._access(user_id, str(comment.deet_id))
        emoji = self.repo.toggle_comment_reaction(user_id, comment_id, reaction_type)
        return {"emoji": emoji}

    def comment_reactions(self, user_id: str, comment_ids: list[str]) -> dict:
        return {"reactionsByCommentId": self.repo.comment_reactions(user_id, comment_ids)}

    def poll_votes(self, user_id: str, deet_ids: list[str], mine_only: bool = False) -> dict:
        for deet_id in deet_ids:
            self._access(user_id, deet_id)
        return {
            "votes": self.repo.poll_votes(
                deet_ids, user_id=user_id if mine_only else None
            )
        }

    def cast_poll_vote(self, user_id: str, deet_id: str, option_index: int) -> dict:
        self._access(user_id, deet_id)
        self.repo.cast_poll_vote(user_id, deet_id, option_index)
        return {"ok": True}

    def toggle_poll_multi_vote(
        self,
        user_id: str,
        deet_id: str,
        option_index: int,
        multi_select_limit: int | None,
    ) -> dict:
        self._access(user_id, deet_id)
        self.repo.toggle_poll_multi_vote(user_id, deet_id, option_index, multi_select_limit)
        return {"ok": True}

    def remove_poll_vote(self, user_id: str, deet_id: str) -> dict:
        self._access(user_id, deet_id)
        self.repo.remove_poll_vote(user_id, deet_id)
        return {"ok": True}

    def my_survey_responses(self, user_id: str, deet_ids: list[str]) -> dict:
        for deet_id in deet_ids:
            self._access(user_id, deet_id)
        return {"responses": self.repo.my_survey_responses(user_id, deet_ids)}

    def submit_survey_responses(
        self,
        user_id: str,
        deet_id: str,
        fingerprint: str,
        answers: list[int],
    ) -> dict:
        self._access(user_id, deet_id)
        self.repo.submit_survey_responses(user_id, deet_id, fingerprint, answers)
        return {"ok": True}

    def delete_my_survey_responses(self, user_id: str, deet_id: str) -> dict:
        self._access(user_id, deet_id)
        self.repo.delete_my_survey_responses(user_id, deet_id)
        return {"ok": True}
