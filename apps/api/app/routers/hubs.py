from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.repositories.hub_unread import HubUnreadRepository
from app.db.repositories.hubs import HubRepository
from app.db.repositories.invites import InviteRepository
from app.db.repositories.memberships import MembershipRepository
from app.dependencies.auth import CurrentUser, get_current_user
from app.dependencies.db import get_db
from app.schemas.hub import HubCreateRequest, HubRead, HubUpdateRequest
from app.schemas.invite import HubContactInviteRequest
from app.schemas.member import HubMemberRead
from app.services.hub_attachments import HubAttachmentsService
from app.services.hub_customization import HubCustomizationService
from app.services.hub_media import HubMediaService
from app.services.hub_unread import HubUnreadService
from app.services.hubs import HubService
from app.services.invites import InviteService
from app.services.memberships import MembershipService

router = APIRouter(prefix="/hubs", tags=["hubs"])


@router.get("", response_model=list[HubRead])
def list_hubs(
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[HubRead]:
    service = HubService(HubRepository(db))
    return service.list_hubs(category=category)


@router.get("/by-slug/{category}/{slug}", response_model=HubRead)
def get_hub_by_slug(
    category: str,
    slug: str,
    db: Session = Depends(get_db),
) -> HubRead:
    service = HubService(HubRepository(db))
    hub = service.get_hub_by_slug(category=category, slug=slug)
    if hub is None:
        raise HTTPException(status_code=404, detail="Hub not found")
    return hub


@router.get("/unread")
def list_unread_hubs(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = HubUnreadService(HubUnreadRepository(db))
    return service.list_unread_hub_ids(user_id=current_user.user_id)


@router.get("/{hub_id}", response_model=HubRead)
def get_hub_by_id(
    hub_id: str,
    db: Session = Depends(get_db),
) -> HubRead:
    service = HubService(HubRepository(db))
    hub = service.get_hub_by_id(hub_id=hub_id)
    if hub is None:
        raise HTTPException(status_code=404, detail="Hub not found")
    return hub


@router.post("/{hub_id}/seen")
def mark_hub_seen(
    hub_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = HubUnreadService(HubUnreadRepository(db))
    return service.mark_hub_seen(user_id=current_user.user_id, hub_id=hub_id)


@router.get("/{hub_id}/members", response_model=list[HubMemberRead])
def list_hub_members(
    hub_id: str,
    db: Session = Depends(get_db),
) -> list[HubMemberRead]:
    service = MembershipService(MembershipRepository(db))
    return service.list_hub_members(hub_id=hub_id)


@router.post("", response_model=HubRead)
def create_hub(
    payload: HubCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HubRead:
    service = HubService(HubRepository(db))
    return service.create_hub(payload=payload.model_dump(), user_id=current_user.user_id)


@router.patch("/{hub_id}", response_model=HubRead)
def update_hub(
    hub_id: str,
    payload: HubUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HubRead:
    service = HubService(HubRepository(db))
    hub = service.update_hub(
        hub_id=hub_id,
        user_id=current_user.user_id,
        payload=payload.model_dump(exclude_unset=True),
    )
    if hub is None:
        raise HTTPException(status_code=404, detail="Hub not found or not editable")
    return hub


@router.delete("/{hub_id}")
def delete_hub(
    hub_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = HubService(HubRepository(db))
    ok = service.delete_hub(hub_id=hub_id, user_id=current_user.user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Hub not found or not editable")
    return {"ok": True}


@router.post("/media/prepare")
def prepare_hub_media_upload(
    payload: dict,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = HubMediaService(db)
    return service.prepare_upload(user_id=current_user.user_id, payload=payload)


@router.post("/{hub_id}/invites/contact")
def invite_hub_by_contact(
    hub_id: str,
    payload: HubContactInviteRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    service = InviteService(InviteRepository(db))
    ok = service.send_contact_invite(
        hub_id=hub_id,
        user_id=current_user.user_id,
        contact_type=payload.contact_type,
        contact_value=payload.contact_value,
        expires_in_days=payload.expires_in_days,
    )
    if not ok:
        raise HTTPException(status_code=400, detail="Could not send invitation.")
    return {"ok": True}


@router.post("/{hub_id}/invites/users/{invited_user_id}")
def invite_hub_user(
    hub_id: str,
    invited_user_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    service = HubService(HubRepository(db))
    status_value = service.invite_user_to_hub(
        hub_id=hub_id,
        user_id=current_user.user_id,
        invited_user_id=invited_user_id,
    )
    return {"status": status_value}


@router.get("/{hub_id}/attachments")
def list_hub_attachments(
    hub_id: str,
    db: Session = Depends(get_db),
) -> dict[str, list[dict]]:
    service = HubAttachmentsService(db)
    rows = service.list_hub_attachments(hub_id=hub_id)
    return {"attachments": rows}


@router.post("/{hub_id}/attachments")
def create_hub_attachment(
    hub_id: str,
    payload: dict,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = HubAttachmentsService(db)
    return service.create_hub_attachment(
        hub_id=hub_id,
        user_id=current_user.user_id,
        file_url=str(payload.get("file_url") or ""),
        file_type=str(payload.get("file_type") or ""),
        source=str(payload.get("source") or "admin_upload"),
    )


@router.get("/{hub_id}/sections")
def list_hub_sections(
    hub_id: str,
    db: Session = Depends(get_db),
) -> dict:
    service = HubCustomizationService(db)
    return service.list_sections(hub_id=hub_id)


@router.put("/{hub_id}/sections")
def save_hub_sections(
    hub_id: str,
    payload: list[dict],
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = HubCustomizationService(db)
    return service.save_sections(user_id=current_user.user_id, hub_id=hub_id, payload=payload)


@router.get("/{hub_id}/ctas")
def list_hub_ctas(
    hub_id: str,
    db: Session = Depends(get_db),
) -> dict:
    service = HubCustomizationService(db)
    return service.list_ctas(hub_id=hub_id)


@router.put("/{hub_id}/ctas")
def save_hub_ctas(
    hub_id: str,
    payload: list[dict],
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = HubCustomizationService(db)
    return service.save_all_ctas(user_id=current_user.user_id, hub_id=hub_id, payload=payload)


@router.delete("/{hub_id}/ctas/{cta_id}")
def delete_hub_cta(
    hub_id: str,
    cta_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = HubCustomizationService(db)
    return service.delete_cta(user_id=current_user.user_id, hub_id=hub_id, cta_id=cta_id)
