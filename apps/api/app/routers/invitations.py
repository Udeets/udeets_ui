from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.repositories.invites import InviteRepository
from app.dependencies.auth import CurrentUser, get_current_user
from app.dependencies.db import get_db
from app.schemas.invite import PendingInvitationRead
from app.services.invites import InviteService

router = APIRouter(prefix="/invitations", tags=["invitations"])


@router.get("/me", response_model=list[PendingInvitationRead])
def list_my_pending_invitations(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PendingInvitationRead]:
    service = InviteService(InviteRepository(db))
    return service.list_pending_invitations(user_id=current_user.user_id)


@router.post("/{invitation_id}/accept")
def accept_invitation(
    invitation_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = InviteService(InviteRepository(db))
    accepted = service.accept_invitation(invitation_id=invitation_id, user_id=current_user.user_id)
    if not accepted:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"ok": True}


@router.post("/{invitation_id}/decline")
def decline_invitation(
    invitation_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = InviteService(InviteRepository(db))
    declined = service.decline_invitation(invitation_id=invitation_id, user_id=current_user.user_id)
    if not declined:
        raise HTTPException(status_code=404, detail="Invitation not found")
    return {"ok": True}
