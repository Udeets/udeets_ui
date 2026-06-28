from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.repositories.chat import ChatRepository
from app.dependencies.db import get_db

router = APIRouter(prefix="/internal/cron", tags=["internal-cron"])

MAX_BATCHES = 40


@router.post("/chat-retention")
async def run_chat_retention_cron(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict[str, int | bool]:
    settings = get_settings()
    expected = settings.cron_secret
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CRON_SECRET not configured",
        )

    token = ""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    if token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    sql = ChatRepository(db)
    total = 0
    batches = 0
    while batches < MAX_BATCHES:
        try:
            body = sql.purge_retention(limit=500)
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail="Retention purge failed") from exc

        n = body if isinstance(body, int) else int(body or 0)
        if n <= 0:
            break
        total += n
        batches += 1

    return {"ok": True, "deletedMessages": total, "batches": batches}
