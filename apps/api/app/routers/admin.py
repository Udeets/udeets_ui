from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies.auth import CurrentUser, get_verified_user
from app.dependencies.db import get_db
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_users(
    search: str | None = Query(default=None),
    role_filter: str | None = Query(default=None, alias="roleFilter"),
    limit: int = Query(default=25),
    offset: int = Query(default=0),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = AdminService(db)
    return service.list_users(
        requester_id=current_user.user_id,
        search=search,
        role_filter=role_filter,
        limit=limit,
        offset=offset,
    )


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_verified_user),
    db: Session = Depends(get_db),
) -> dict:
    service = AdminService(db)
    return service.update_user_role(
        requester_id=current_user.user_id,
        user_id=user_id,
        new_role=str(payload.get("role") or "user"),
    )
