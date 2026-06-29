from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.auth import CurrentUser, get_verified_user
from app.dependencies.db import get_db
from app.services.deet_interactions import DeetInteractionsService
from app.services.deet_media import DeetMediaService
from app.services.deets import DeetsService

router = APIRouter(prefix="/deets", tags=["deets"])


@router.get("")
def list_deets(
    hub_ids: str | None = Query(default=None, alias="hubIds"),
    kinds: str | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1, le=500),
    published_only: bool | None = Query(default=None, alias="publishedOnly"),
    drafts_only: bool | None = Query(default=None, alias="draftsOnly"),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetsService(db)
    parsed_hub_ids = [value.strip() for value in (hub_ids or "").split(",") if value.strip()]
    parsed_kinds = [value.strip() for value in (kinds or "").split(",") if value.strip()]
    return service.list_deets(
        user_id=current_user.user_id,
        hub_ids=parsed_hub_ids or None,
        kinds=parsed_kinds or None,
        limit=limit,
        published_only=published_only,
        drafts_only=drafts_only,
    )


@router.post("")
def create_deet(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetsService(db)
    return service.create_deet(user_id=current_user.user_id, payload=payload)


@router.patch("/{deet_id}")
def patch_deet(
    deet_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetsService(db)
    return service.update_deet(user_id=current_user.user_id, deet_id=deet_id, payload=payload)


@router.delete("/{deet_id}")
def remove_deet(
    deet_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetsService(db)
    return service.delete_deet(user_id=current_user.user_id, deet_id=deet_id)


@router.post("/{deet_id}/likes/toggle")
def toggle_like(
    deet_id: str,
    payload: dict = Body(default={}),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.toggle_like(
        user_id=current_user.user_id,
        deet_id=deet_id,
        reaction_type=str(payload.get("reactionType") or "like"),
    )


@router.get("/likes/status")
def like_status(
    ids: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    deet_ids = [value.strip() for value in ids.split(",") if value.strip()]
    return service.like_status(user_id=current_user.user_id, deet_ids=deet_ids)


@router.post("/{deet_id}/comments")
def create_comment(
    deet_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.add_comment(
        user_id=current_user.user_id,
        deet_id=deet_id,
        body=str(payload.get("body") or ""),
        parent_id=str(payload.get("parentId")) if payload.get("parentId") else None,
        image_url=str(payload.get("imageUrl")) if payload.get("imageUrl") else None,
        attachment_url=str(payload.get("attachmentUrl")) if payload.get("attachmentUrl") else None,
        attachment_name=str(payload.get("attachmentName"))
        if payload.get("attachmentName")
        else None,
    )


@router.get("/{deet_id}/comments")
def comments(
    deet_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.list_comments(user_id=current_user.user_id, deet_id=deet_id)


@router.patch("/comments/{comment_id}")
def patch_comment(
    comment_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.edit_comment(
        user_id=current_user.user_id,
        comment_id=comment_id,
        body=str(payload.get("body") or ""),
    )


@router.delete("/comments/{comment_id}")
def drop_comment(
    comment_id: str,
    deet_id: str = Query(alias="deetId"),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.delete_comment(
        user_id=current_user.user_id,
        comment_id=comment_id,
        deet_id=deet_id,
    )


@router.get("/{deet_id}/reactors")
def reactors(
    deet_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.list_reactors(user_id=current_user.user_id, deet_id=deet_id)


@router.get("/reactors/previews")
def reactor_previews(
    ids: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    deet_ids = [value.strip() for value in ids.split(",") if value.strip()]
    return service.reactor_previews(user_id=current_user.user_id, deet_ids=deet_ids)


@router.get("/counts")
def counts(
    ids: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    deet_ids = [value.strip() for value in ids.split(",") if value.strip()]
    return service.deet_counts(user_id=current_user.user_id, deet_ids=deet_ids)


@router.get("/polls/votes")
def poll_votes(
    ids: str = Query(default=""),
    mine_only: bool = Query(default=False, alias="mineOnly"),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    deet_ids = [value.strip() for value in ids.split(",") if value.strip()]
    return service.poll_votes(
        user_id=current_user.user_id,
        deet_ids=deet_ids,
        mine_only=mine_only,
    )


@router.post("/{deet_id}/polls/vote")
def cast_poll_vote(
    deet_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.cast_poll_vote(
        user_id=current_user.user_id,
        deet_id=deet_id,
        option_index=int(payload.get("optionIndex") or 0),
    )


@router.post("/{deet_id}/polls/vote/toggle")
def toggle_poll_multi_vote(
    deet_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    limit_raw = payload.get("multiSelectLimit")
    limit = int(limit_raw) if isinstance(limit_raw, int) else None
    return service.toggle_poll_multi_vote(
        user_id=current_user.user_id,
        deet_id=deet_id,
        option_index=int(payload.get("optionIndex") or 0),
        multi_select_limit=limit,
    )


@router.delete("/{deet_id}/polls/vote")
def remove_poll_vote(
    deet_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.remove_poll_vote(user_id=current_user.user_id, deet_id=deet_id)


@router.get("/surveys/responses")
def survey_responses(
    ids: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    deet_ids = [value.strip() for value in ids.split(",") if value.strip()]
    return service.my_survey_responses(user_id=current_user.user_id, deet_ids=deet_ids)


@router.put("/{deet_id}/surveys/responses")
def submit_survey_responses(
    deet_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    answers_raw = payload.get("answers")
    answers = [int(value) for value in answers_raw] if isinstance(answers_raw, list) else []
    return service.submit_survey_responses(
        user_id=current_user.user_id,
        deet_id=deet_id,
        fingerprint=str(payload.get("fingerprint") or ""),
        answers=answers,
    )


@router.delete("/{deet_id}/surveys/responses")
def delete_survey_responses(
    deet_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.delete_my_survey_responses(user_id=current_user.user_id, deet_id=deet_id)


@router.post("/{deet_id}/views/increment")
def increment_view(
    deet_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.increment_view(user_id=current_user.user_id, deet_id=deet_id)


@router.get("/{deet_id}/viewers")
def viewers(
    deet_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.list_viewers(user_id=current_user.user_id, deet_id=deet_id)


@router.get("/views/counts")
def view_counts(
    ids: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    deet_ids = [value.strip() for value in ids.split(",") if value.strip()]
    return service.view_counts(user_id=current_user.user_id, deet_ids=deet_ids)


@router.post("/{deet_id}/shares/record")
def record_share(
    deet_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.record_share(user_id=current_user.user_id, deet_id=deet_id)


@router.get("/shares/counts")
def share_counts(
    ids: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    deet_ids = [value.strip() for value in ids.split(",") if value.strip()]
    return service.share_counts(user_id=current_user.user_id, deet_ids=deet_ids)


@router.post("/comments/{comment_id}/reactions/toggle")
def toggle_comment_reaction(
    comment_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    return service.toggle_comment_reaction(
        user_id=current_user.user_id,
        comment_id=comment_id,
        reaction_type=str(payload.get("reactionType") or ""),
    )


@router.get("/comments/reactions")
def comment_reactions(
    ids: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetInteractionsService(db)
    comment_ids = [value.strip() for value in ids.split(",") if value.strip()]
    return service.comment_reactions(user_id=current_user.user_id, comment_ids=comment_ids)


@router.post("/media/prepare")
def prepare_media_upload(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = DeetMediaService(db)
    return service.prepare_upload(user_id=current_user.user_id, payload=payload)
