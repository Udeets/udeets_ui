from app.db.repositories.memberships import MembershipRepository
from app.schemas.member import HubMemberRead, MyMembershipRead


class MembershipService:
    def __init__(self, repo: MembershipRepository) -> None:
        self.repo = repo

    def list_hub_members(self, hub_id: str) -> list[HubMemberRead]:
        rows = self.repo.list_hub_members(hub_id=hub_id)
        return [HubMemberRead.model_validate(row) for row in rows]

    def list_my_memberships(self, user_id: str) -> list[MyMembershipRead]:
        rows = self.repo.list_my_memberships(user_id=user_id)
        return [MyMembershipRead.model_validate(row) for row in rows]

    def list_pending_requests(self, hub_id: str) -> list[HubMemberRead]:
        rows = self.repo.list_pending_requests(hub_id=hub_id)
        return [HubMemberRead.model_validate(row) for row in rows]

    def approve_member_request(self, hub_id: str, user_id: str, actor_user_id: str) -> bool:
        return self.repo.approve_member_request(
            hub_id=hub_id,
            user_id=user_id,
            actor_user_id=actor_user_id,
        )

    def reject_member_request(self, hub_id: str, user_id: str, actor_user_id: str) -> bool:
        return self.repo.reject_member_request(
            hub_id=hub_id,
            user_id=user_id,
            actor_user_id=actor_user_id,
        )

    def leave_hub(self, hub_id: str, user_id: str) -> bool:
        return self.repo.leave_hub(hub_id=hub_id, user_id=user_id)

    def get_my_membership(self, hub_id: str, user_id: str) -> HubMemberRead | None:
        row = self.repo.get_my_membership(hub_id=hub_id, user_id=user_id)
        if row is None:
            return None
        return HubMemberRead.model_validate(row)

    def join_hub(self, hub_id: str, user_id: str) -> HubMemberRead | None:
        row = self.repo.join_hub(hub_id=hub_id, user_id=user_id)
        if row is None:
            return None
        return HubMemberRead.model_validate(row)
