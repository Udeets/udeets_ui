from datetime import datetime

from app.db.repositories.invites import InviteRepository
from app.schemas.invite import HubJoinLinkStateRead, PendingInvitationRead, ResolvedJoinLinkRead


class InviteService:
    def __init__(self, repo: InviteRepository) -> None:
        self.repo = repo

    def resolve_join_token(self, token: str) -> ResolvedJoinLinkRead:
        return self.repo.resolve_join_token(token=token)

    def get_or_create_join_link(
        self, hub_id: str, user_id: str, expires_in_days: int | None
    ) -> HubJoinLinkStateRead | None:
        return self.repo.get_or_create_join_link(
            hub_id=hub_id,
            user_id=user_id,
            expires_in_days=expires_in_days,
        )

    def regenerate_join_link(
        self, hub_id: str, user_id: str, expires_in_days: int | None
    ) -> HubJoinLinkStateRead | None:
        return self.repo.regenerate_join_link(
            hub_id=hub_id,
            user_id=user_id,
            expires_in_days=expires_in_days,
        )

    def disable_join_link(self, hub_id: str, user_id: str) -> bool:
        return self.repo.disable_join_link(hub_id=hub_id, user_id=user_id)

    def set_join_link_expiration(
        self, hub_id: str, user_id: str, expires_in_days: int | None
    ) -> datetime | None:
        return self.repo.set_join_link_expiration(
            hub_id=hub_id,
            user_id=user_id,
            expires_in_days=expires_in_days,
        )

    def send_contact_invite(
        self,
        hub_id: str,
        user_id: str,
        contact_type: str,
        contact_value: str,
        expires_in_days: int | None,
    ) -> bool:
        return self.repo.send_contact_invite(
            hub_id=hub_id,
            user_id=user_id,
            contact_type=contact_type,
            contact_value=contact_value,
            expires_in_days=expires_in_days,
        )

    def list_pending_invitations(self, user_id: str) -> list[PendingInvitationRead]:
        return self.repo.list_pending_invitations(user_id=user_id)

    def accept_invitation(self, invitation_id: str, user_id: str) -> bool:
        return self.repo.accept_invitation(invitation_id=invitation_id, user_id=user_id)

    def decline_invitation(self, invitation_id: str, user_id: str) -> bool:
        return self.repo.decline_invitation(invitation_id=invitation_id, user_id=user_id)
