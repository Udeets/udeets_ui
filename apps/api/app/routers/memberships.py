from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.repositories.memberships import MembershipRepository
from app.dependencies.auth import CurrentUser, get_current_user
from app.dependencies.db import get_db
from app.schemas.member import HubMemberRead, MyMembershipRead
from app.services.memberships import MembershipService

router = APIRouter(prefix="/memberships", tags=["memberships"])


@router.get("/me", response_model=list[MyMembershipRead])
def list_my_memberships(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MyMembershipRead]:
    service = MembershipService(MembershipRepository(db))
    return service.list_my_memberships(user_id=current_user.user_id)


@router.get("/hubs/{hub_id}/pending", response_model=list[HubMemberRead])
def list_pending_requests(
    hub_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[HubMemberRead]:
    _ = current_user
    service = MembershipService(MembershipRepository(db))
    return service.list_pending_requests(hub_id=hub_id)


@router.post("/hubs/{hub_id}/members/{user_id}/approve")
def approve_member_request(
    hub_id: str,
    user_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = MembershipService(MembershipRepository(db))
    ok = service.approve_member_request(
        hub_id=hub_id,
        user_id=user_id,
        actor_user_id=current_user.user_id,
    )
    if not ok:
        return {"ok": False}
    return {"ok": True}


@router.post("/hubs/{hub_id}/members/{user_id}/reject")
def reject_member_request(
    hub_id: str,
    user_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = MembershipService(MembershipRepository(db))
    ok = service.reject_member_request(
        hub_id=hub_id,
        user_id=user_id,
        actor_user_id=current_user.user_id,
    )
    if not ok:
        return {"ok": False}
    return {"ok": True}


@router.post("/hubs/{hub_id}/leave")
def leave_hub(
    hub_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = MembershipService(MembershipRepository(db))
    ok = service.leave_hub(hub_id=hub_id, user_id=current_user.user_id)
    return {"ok": ok}


@router.get("/hubs/{hub_id}/me", response_model=HubMemberRead | None)
def get_my_membership_for_hub(
    hub_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HubMemberRead | None:
    service = MembershipService(MembershipRepository(db))
    return service.get_my_membership(hub_id=hub_id, user_id=current_user.user_id)


@router.post("/hubs/{hub_id}/join", response_model=HubMemberRead)
def join_hub(
    hub_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HubMemberRead:
    service = MembershipService(MembershipRepository(db))
    membership = service.join_hub(hub_id=hub_id, user_id=current_user.user_id)
    if membership is None:
        raise HTTPException(status_code=404, detail="Hub not found")
    return membership
