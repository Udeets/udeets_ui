from fastapi import HTTPException, status

from app.services.media import build_avatar_key, get_storage_adapter

MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024


class ProfileMediaService:
    def prepare_avatar_upload(self, user_id: str, payload: dict) -> dict:
        file_name = str(payload.get("fileName") or "").strip()
        mime_type = str(payload.get("mimeType") or "").strip().lower()
        size_bytes = payload.get("sizeBytes")
        if not file_name or not mime_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="fileName and mimeType are required.",
            )
        if not mime_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please upload an image file for your avatar.",
            )
        if not isinstance(size_bytes, int):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="sizeBytes must be integer.",
            )
        if size_bytes > MAX_AVATAR_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Avatar image must be 5 MB or smaller.",
            )

        storage_key = build_avatar_key(user_id=user_id, file_name=file_name, mime_type=mime_type)
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
            "mimeType": mime_type,
            "sizeBytes": size_bytes,
            "fileName": file_name,
        }
