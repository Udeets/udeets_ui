from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.hubs import HubRepository
from app.db.repositories.memberships import MembershipRepository
from app.services.media import build_hub_media_key, get_storage_adapter

MAX_HUB_MEDIA_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_KINDS = {"dp", "cover", "gallery"}


class HubMediaService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.hubs = HubRepository(db)
        self.memberships = MembershipRepository(db)

    def prepare_upload(self, user_id: str, payload: dict) -> dict:
        hub_id = str(payload.get("hubId") or "")
        kind = str(payload.get("kind") or "")
        file_name = str(payload.get("fileName") or "").strip()
        mime_type = str(payload.get("mimeType") or "").strip().lower()
        size_bytes = payload.get("sizeBytes")

        if not hub_id or not file_name or not mime_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="hubId, fileName, and mimeType are required.",
            )
        if kind not in ALLOWED_KINDS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid hub media kind.",
            )
        if not mime_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please upload an image file for hub media.",
            )
        if not isinstance(size_bytes, int):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="sizeBytes must be integer.",
            )
        if size_bytes > MAX_HUB_MEDIA_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hub images must be 5 MB or smaller.",
            )

        hub = self.hubs.get_hub_by_id(hub_id=hub_id)
        if not hub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hub not found.")

        if not self.memberships.can_manage_hub(hub_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only hub admins can upload hub media.",
            )

        storage_key = build_hub_media_key(
            owner_user_id=user_id,
            hub_slug_or_id=str(getattr(hub, "slug", None) or hub_id),
            kind=kind,
            file_name=file_name,
            mime_type=mime_type,
        )
        upload = get_storage_adapter().prepare_upload(
            storage_key=storage_key,
            mime_type=mime_type,
            visibility="public",
        )
        return {
            "bucket": upload.bucket,
            "storageKey": storage_key,
            "path": storage_key,
            "signedUploadUrl": upload.signed_upload_url,
            "publicUrl": upload.public_url,
            "token": upload.token,
            "kind": kind,
            "mimeType": mime_type,
            "sizeBytes": size_bytes,
            "fileName": file_name,
        }
