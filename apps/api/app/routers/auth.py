from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.dependencies.auth import CurrentUser, get_current_user
from app.dependencies.db import get_db
from app.db.repositories.auth import AuthRepository
from app.services.auth_rate_limit import (
    enforce_change_contact_rate_limit,
    enforce_google_callback_rate_limit,
    enforce_login_rate_limit,
    enforce_register_rate_limit,
    enforce_verify_email_confirm_rate_limit,
    enforce_verify_email_resend_rate_limit,
    enforce_verify_phone_send_rate_limit,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def _serialize_auth_result(result) -> dict:
    body = {
        "accessToken": result.access_token or None,
        "user": {
            "id": result.user_id or None,
            "email": result.email,
            "phone": result.phone,
            "fullName": result.full_name,
            "avatarUrl": result.avatar_url,
            "emailVerified": result.email_verified,
            "phoneVerified": result.phone_verified,
            "verificationComplete": result.verification_complete,
        },
        "verificationRequired": result.verification_required,
        "isNewUser": result.is_new_user,
    }
    if result.message:
        body["message"] = result.message
    return body


@router.post("/google/callback")
async def google_callback(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    enforce_google_callback_rate_limit(request)
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

    return _serialize_auth_result(result)


def _register_full_name(payload: dict) -> tuple[str, str, str]:
    first = str(payload.get("firstName") or payload.get("first_name") or "").strip()
    last = str(payload.get("lastName") or payload.get("last_name") or "").strip()
    legacy = str(payload.get("fullName") or payload.get("full_name") or "").strip()
    if first or last:
        full = f"{first} {last}".strip()
        return first, last, full
    return "", "", legacy


@router.post("/register")
async def register(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    enforce_register_rate_limit(request)
    first_name, last_name, full_name = _register_full_name(payload)
    service = AuthService(db, settings)
    try:
        result = await service.register(
            first_name=first_name,
            last_name=last_name,
            full_name=full_name,
            email=payload.get("email") if isinstance(payload.get("email"), str) else None,
            phone=payload.get("phone") if isinstance(payload.get("phone"), str) else None,
            password=str(payload.get("password") or ""),
            confirm_password=str(payload.get("confirmPassword") or payload.get("confirm_password") or ""),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if not result.access_token:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=result.message or "An account already exists for this email or phone.",
        )

    return _serialize_auth_result(result)


@router.post("/login")
async def login(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    identifier = payload.get("identifier") or payload.get("email") or payload.get("phone")
    password = payload.get("password")
    if not isinstance(identifier, str) or not isinstance(password, str):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing credentials")

    enforce_login_rate_limit(request, identifier)
    service = AuthService(db, settings)
    try:
        result = await service.login(identifier=identifier, password=password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    return _serialize_auth_result(result)


@router.get("/me")
def auth_me(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    repo = AuthRepository(db)
    user = repo.get_user_by_id(current_user.user_id)
    profile = None
    oauth_providers: list[str] = []
    if user is not None:
        from app.auth.verification_status import is_verification_complete
        from app.db.repositories.profiles import ProfilesRepository

        profile = ProfilesRepository(db).get_by_id(user.id)
        verification_complete = is_verification_complete(user)
        oauth_providers = repo.list_oauth_providers(user.id)
    else:
        verification_complete = current_user.verification_complete

    return {
        "id": current_user.user_id,
        "email": user.email if user is not None else current_user.email,
        "phone": user.phone if user is not None else current_user.phone,
        "role": current_user.role,
        "emailVerified": bool(user.email_verified) if user is not None else current_user.email_verified,
        "phoneVerified": bool(user.phone_verified) if user is not None else current_user.phone_verified,
        "verificationComplete": verification_complete,
        "authMethods": current_user.auth_methods or [],
        "oauthProviders": oauth_providers,
        "fullName": profile.full_name if profile else None,
        "avatarUrl": profile.avatar_url if profile else None,
    }


@router.get("/verification-status")
def verification_status(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    user = AuthRepository(db).get_user_by_id(current_user.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AuthService(db, get_settings()).verification_status(user)


@router.post("/change-contact")
async def change_contact(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    channel = payload.get("channel")
    value = payload.get("value")
    if channel not in ("email", "phone") or not isinstance(value, str):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing channel or value")
    user = AuthRepository(db).get_user_by_id(current_user.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    enforce_change_contact_rate_limit(user.id)
    try:
        result = await AuthService(db, settings).change_contact(user, channel=channel, value=value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_auth_result(result)


@router.post("/verify-email/resend")
async def resend_email_verification(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    user = AuthRepository(db).get_user_by_id(current_user.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    enforce_verify_email_resend_rate_limit(user.id)
    await AuthService(db, settings).resend_email_verification(user)
    return {"ok": True}


@router.post("/verify-email/confirm")
async def confirm_email_verification(
    request: Request,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    enforce_verify_email_confirm_rate_limit(request)
    token = payload.get("token")
    if not isinstance(token, str) or not token.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing token")
    service = AuthService(db, settings)
    try:
        result = await service.confirm_email_token(token.strip())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_auth_result(result)


@router.post("/verify-phone/send")
async def send_phone_verification(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    user = AuthRepository(db).get_user_by_id(current_user.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    enforce_verify_phone_send_rate_limit(user.id)
    try:
        await AuthService(db, settings).send_phone_verification(user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    return {"ok": True}


@router.post("/verify-phone/confirm")
async def confirm_phone_verification(
    payload: dict = Body(...),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    code = payload.get("code")
    if not isinstance(code, str):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing code")
    user = AuthRepository(db).get_user_by_id(current_user.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    try:
        result = await AuthService(db, settings).confirm_phone_otp(user, code)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_auth_result(result)


@router.get("/verify-email")
async def verify_email_via_query(
    request: Request,
    token: str = Query(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    enforce_verify_email_confirm_rate_limit(request)
    service = AuthService(db, settings)
    try:
        result = await service.confirm_email_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _serialize_auth_result(result)
