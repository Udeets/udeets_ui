from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.repositories.hub_customization import HubCustomizationRepository
from app.db.repositories.memberships import MembershipRepository


def _cta_to_dict(row: object) -> dict:
    return {
        "id": getattr(row, "id", ""),
        "hub_id": getattr(row, "hub_id", ""),
        "label": getattr(row, "label", ""),
        "action_type": getattr(row, "action_type", "url"),
        "action_value": getattr(row, "action_value", ""),
        "position": getattr(row, "position", 0),
        "is_visible": getattr(row, "is_visible", True),
        "created_at": getattr(row, "created_at", None),
        "updated_at": getattr(row, "updated_at", None),
    }


class HubCustomizationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = HubCustomizationRepository(db)
        self.memberships = MembershipRepository(db)

    def _assert_hub_staff(self, *, hub_id: str, user_id: str, detail: str) -> None:
        if not self.memberships.can_manage_hub(hub_id, user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

    def list_sections(self, hub_id: str) -> dict:
        sections = self.repo.list_sections(hub_id)
        if not sections:
            return {"sections": []}

        section_ids = [section.id for section in sections]
        items = self.repo.list_section_items(section_ids)
        items_by_section: dict[str, list[dict]] = {}
        for item in items:
            items_by_section.setdefault(item.section_id, []).append(
                {
                    "id": item.id,
                    "section_id": item.section_id,
                    "label": item.label,
                    "tag": item.tag,
                    "value": item.value,
                    "position": item.position,
                }
            )

        return {
            "sections": [
                {
                    "id": section.id,
                    "hub_id": section.hub_id,
                    "title": section.title,
                    "position": section.position,
                    "is_visible": section.is_visible,
                    "created_at": section.created_at,
                    "updated_at": section.updated_at,
                    "items": items_by_section.get(section.id, []),
                }
                for section in sections
            ]
        }

    def save_sections(self, user_id: str, hub_id: str, payload: list[dict]) -> dict:
        self._assert_hub_staff(
            hub_id=hub_id,
            user_id=user_id,
            detail="Only hub staff can edit sections",
        )
        saved = self.repo.replace_sections(hub_id=hub_id, sections=payload)
        return {"sections": saved}

    def list_ctas(self, hub_id: str) -> dict:
        rows = self.repo.list_ctas(hub_id)
        return {"ctas": [_cta_to_dict(row) for row in rows]}

    def save_all_ctas(self, user_id: str, hub_id: str, payload: list[dict]) -> dict:
        self._assert_hub_staff(
            hub_id=hub_id,
            user_id=user_id,
            detail="Only hub staff can edit CTAs",
        )
        rows = self.repo.replace_ctas(hub_id=hub_id, ctas=payload)
        return {"ctas": [_cta_to_dict(row) for row in rows]}

    def delete_cta(self, user_id: str, hub_id: str, cta_id: str) -> dict:
        self._assert_hub_staff(
            hub_id=hub_id,
            user_id=user_id,
            detail="Only hub staff can edit CTAs",
        )
        ok = self.repo.delete_cta(hub_id=hub_id, cta_id=cta_id)
        return {"ok": ok}
