from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.repositories.invites import InviteRepository
from app.dependencies.auth import CurrentUser, get_current_user
from app.dependencies.db import get_db
from app.schemas.invite import (
    HubJoinLinkExpirationRequest,
    HubJoinLinkStateRead,
    ResolvedJoinLinkRead,
)
from app.services.invites import InviteService

router = APIRouter(prefix="/join-links", tags=["join-links"])


@router.get("/resolve", response_model=ResolvedJoinLinkRead)
def resolve_join_token(
    token: str = Query(min_length=1),
    db: Session = Depends(get_db),
) -> ResolvedJoinLinkRead:
    service = InviteService(InviteRepository(db))
    return service.resolve_join_token(token=token)


@router.get("/{hub_id}", response_model=HubJoinLinkStateRead)
def get_or_create_join_link(
    hub_id: str,
    expires_in_days: int | None = Query(default=None, ge=0, le=365),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HubJoinLinkStateRead:
    service = InviteService(InviteRepository(db))
    state = service.get_or_create_join_link(
        hub_id=hub_id,
        user_id=current_user.user_id,
        expires_in_days=expires_in_days,
    )
    if state is None:
        raise HTTPException(status_code=403, detail="Not allowed to manage join links")
    return state


@router.post("/{hub_id}/regenerate", response_model=HubJoinLinkStateRead)
def regenerate_join_link(
    hub_id: str,
    expires_in_days: int | None = Query(default=None, ge=0, le=365),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HubJoinLinkStateRead:
    service = InviteService(InviteRepository(db))
    state = service.regenerate_join_link(
        hub_id=hub_id,
        user_id=current_user.user_id,
        expires_in_days=expires_in_days,
    )
    if state is None:
        raise HTTPException(status_code=403, detail="Not allowed to manage join links")
    return state


@router.post("/{hub_id}/disable")
def disable_join_link(
    hub_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = InviteService(InviteRepository(db))
    ok = service.disable_join_link(hub_id=hub_id, user_id=current_user.user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Join link not found")
    return {"ok": True}


@router.post("/{hub_id}/expiration")
def set_join_link_expiration(
    hub_id: str,
    payload: HubJoinLinkExpirationRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str | None]:
    service = InviteService(InviteRepository(db))
    expires_at = service.set_join_link_expiration(
        hub_id=hub_id,
        user_id=current_user.user_id,
        expires_in_days=payload.expires_in_days,
    )
    if expires_at is None and payload.expires_in_days not in (0, None):
        raise HTTPException(status_code=404, detail="Join link not found")
    return {"expires_at": expires_at.isoformat() if expires_at else None}
