from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.dependencies.auth import get_current_user, CurrentUser
from app.dependencies.db import get_db
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google/callback")
async def google_callback(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    code = payload.get("code")
    if not isinstance(code, str) or not code.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing authorization code")

    service = AuthService(db, settings)
    try:
        result = await service.handle_google_callback(code.strip())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        import logging

        logging.getLogger(__name__).exception("Google OAuth callback failed")
        detail = "Google sign-in could not be completed"
        if settings.env == "development":
            detail = f"{detail}: {exc}"
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        ) from exc

    return {
        "accessToken": result.access_token,
        "user": {
            "id": result.user_id,
            "email": result.email,
            "fullName": result.full_name,
            "avatarUrl": result.avatar_url,
        },
        "isNewUser": result.is_new_user,
    }


@router.get("/me")
def auth_me(current_user: CurrentUser = Depends(get_current_user)) -> dict:
    return {
        "id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
    }
