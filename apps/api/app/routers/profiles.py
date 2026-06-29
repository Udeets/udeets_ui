from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.auth import CurrentUser, get_current_user, get_verified_user
from app.dependencies.db import get_db
from app.services.profile_media import ProfileMediaService
from app.services.profiles import ProfilesService

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/search")
def search_profiles(
    q: str = Query(..., alias="query"),
    limit: int = Query(default=10),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    _ = current_user
    service = ProfilesService(db)
    return service.search(query=q, limit=limit)


@router.get("/me")
def get_my_profile(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.get_me(user_id=current_user.user_id)


@router.get("/bulk")
def list_profiles_brief(
    ids: str = Query(default=""),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    _ = current_user
    user_ids = [value.strip() for value in ids.split(",") if value.strip()]
    service = ProfilesService(db)
    return service.list_brief(user_ids=user_ids)


@router.get("/{user_id}/summary")
def get_profile_summary(
    user_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    summary = service.get_summary(viewer_id=current_user.user_id, user_id=user_id)
    return {"summary": summary}


@router.post("/{profile_id}/likes/toggle")
def toggle_profile_like(
    profile_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.toggle_like(user_id=current_user.user_id, profile_id=profile_id)


@router.get("/{profile_id}/likes")
def list_profile_likers(
    profile_id: str,
    limit: int = Query(default=100),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.list_likers(
        viewer_id=current_user.user_id, profile_id=profile_id, limit=limit
    )


@router.get("/{profile_id}/comments")
def list_profile_comments(
    profile_id: str,
    limit: int = Query(default=50),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.list_comments(
        viewer_id=current_user.user_id, profile_id=profile_id, limit=limit
    )


@router.post("/{profile_id}/comments")
def add_profile_comment(
    profile_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    comment = service.add_comment(
        user_id=current_user.user_id,
        profile_id=profile_id,
        body=str(payload.get("body") or ""),
    )
    return {"comment": comment}


@router.delete("/comments/{comment_id}")
def delete_profile_comment(
    comment_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.delete_comment(user_id=current_user.user_id, comment_id=comment_id)


@router.post("/{profile_id}/reports")
def report_profile(
    profile_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.report_user(
        reporter_id=current_user.user_id,
        reported_user_id=profile_id,
        reason=str(payload.get("reason") or ""),
        context=(str(payload.get("context")) if payload.get("context") is not None else None),
    )


@router.post("/me/upsert")
def upsert_my_profile(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.upsert_me(
        user_id=current_user.user_id,
        full_name=(str(payload.get("fullName")) if payload.get("fullName") is not None else None),
        avatar_url=(
            str(payload.get("avatarUrl")) if payload.get("avatarUrl") is not None else None
        ),
        email=(str(payload.get("email")) if payload.get("email") is not None else None),
    )


@router.patch("/me")
def update_my_profile(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.update_me(
        user_id=current_user.user_id,
        full_name=(str(payload.get("fullName")) if payload.get("fullName") is not None else None),
        avatar_url=(
            str(payload.get("avatarUrl")) if payload.get("avatarUrl") is not None else None
        ),
        email=(str(payload.get("email")) if payload.get("email") is not None else None),
        notification_preferences=payload.get("notificationPreferences")
        if isinstance(payload.get("notificationPreferences"), dict)
        else None,
        privacy_settings=payload.get("privacySettings")
        if isinstance(payload.get("privacySettings"), dict)
        else None,
    )


@router.post("/me/avatar/prepare")
def prepare_my_avatar_upload(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    return ProfileMediaService().prepare_avatar_upload(
        user_id=current_user.user_id,
        payload=payload,
    )


@router.delete("/me/requests/{membership_id}")
def cancel_my_pending_request(
    membership_id: str,
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.cancel_pending_request(
        user_id=current_user.user_id,
        membership_id=membership_id,
    )


@router.get("/me/header-feed")
def get_my_header_feed(
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = ProfilesService(db)
    return service.get_header_feed(user_id=current_user.user_id)
