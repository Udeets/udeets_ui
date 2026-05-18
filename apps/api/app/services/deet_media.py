from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.memberships import MembershipRepository
from app.services.media import build_deet_media_key, get_storage_adapter, sanitize_slug

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
MAX_COMMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024

ALLOWED_FILE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/zip",
}


class DeetMediaService:
    def __init__(self, db: Session) -> None:
        self.memberships = MembershipRepository(db)

    def prepare_upload(self, user_id: str, payload: dict) -> dict:
        context = str(payload.get("context") or "deet")
        kind = str(payload.get("kind") or "image")
        file_name = str(payload.get("fileName") or "").strip()
        mime_type = str(payload.get("mimeType") or "").strip().lower()
        size_bytes_raw = payload.get("sizeBytes")
        if not isinstance(size_bytes_raw, int):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="sizeBytes must be integer."
            )
        size_bytes = size_bytes_raw
        if not file_name or not mime_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="fileName and mimeType are required.",
            )

        if context not in {"deet", "comment"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upload context."
            )
        if kind not in {"image", "file"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upload kind."
            )

        if kind == "image":
            if not mime_type.startswith("image/"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please upload an image file.",
                )
            if size_bytes > MAX_IMAGE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Image must be 5 MB or smaller.",
                )
        else:
            if mime_type not in ALLOWED_FILE_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "This file type isn't supported. Allowed: PDF, Word, Excel, "
                        "PowerPoint, text, CSV, zip, and common images."
                    ),
                )
            max_size = MAX_COMMENT_FILE_SIZE_BYTES if context == "comment" else MAX_FILE_SIZE_BYTES
            if size_bytes > max_size:
                mb = round(max_size / 1024 / 1024)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File must be {mb} MB or smaller.",
                )

        if context == "deet":
            hub_id = str(payload.get("hubId") or "")
            if not hub_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, detail="hubId is required."
                )
            if not self.memberships.get_active_membership(hub_id=hub_id, user_id=user_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only active hub members can upload deet media.",
                )
            hub_slug = str(payload.get("hubSlug") or hub_id)
            hub_folder = sanitize_slug(hub_slug or hub_id) or sanitize_slug(hub_id) or "hub"
            storage_key = build_deet_media_key(
                user_id=user_id,
                context=context,
                file_name=file_name,
                mime_type=mime_type,
                kind=kind,
                hub_slug_or_id=hub_folder,
            )
        else:
            storage_key = build_deet_media_key(
                user_id=user_id,
                context=context,
                file_name=file_name,
                mime_type=mime_type,
                kind=kind,
            )

        adapter = get_storage_adapter()
        upload = adapter.prepare_upload(
            storage_key=storage_key,
            mime_type=mime_type,
            visibility="public",
        )
        return {
            "bucket": upload.bucket,
            "path": storage_key,
            "storageKey": storage_key,
            "signedUploadUrl": upload.signed_upload_url,
            "publicUrl": upload.public_url,
            "mimeType": mime_type,
            "fileName": file_name,
            "sizeBytes": size_bytes,
            "kind": kind,
            "token": upload.token,
        }
