from uuid import uuid4

from sqlalchemy import Select, delete, select
from sqlalchemy.orm import Session

from app.db.models.hub_cta import HubCta
from app.db.models.hub_section import HubSection, HubSectionItem


class HubCustomizationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_sections(self, hub_id: str) -> list[HubSection]:
        stmt: Select[tuple[HubSection]] = (
            select(HubSection)
            .where(HubSection.hub_id == hub_id)
            .order_by(HubSection.position.asc())
        )
        return list(self.db.scalars(stmt))

    def list_section_items(self, section_ids: list[str]) -> list[HubSectionItem]:
        if not section_ids:
            return []
        stmt: Select[tuple[HubSectionItem]] = (
            select(HubSectionItem)
            .where(HubSectionItem.section_id.in_(section_ids))
            .order_by(HubSectionItem.position.asc())
        )
        return list(self.db.scalars(stmt))

    def replace_sections(
        self,
        *,
        hub_id: str,
        sections: list[dict],
    ) -> list[dict]:
        self.db.execute(delete(HubSection).where(HubSection.hub_id == hub_id))
        self.db.commit()

        saved: list[dict] = []
        for index, section in enumerate(sections):
            title = str(section.get("title") or "").strip()
            if not title:
                continue

            row = HubSection(
                id=str(uuid4()),
                hub_id=hub_id,
                title=title,
                position=int(section.get("position") or index),
                is_visible=bool(section.get("is_visible", True)),
            )
            self.db.add(row)
            self.db.flush()

            items = section.get("items") if isinstance(section.get("items"), list) else []
            created_items: list[HubSectionItem] = []
            for item_index, item in enumerate(items):
                label = str((item or {}).get("label") or "").strip()
                if not label:
                    continue
                item_row = HubSectionItem(
                    id=str(uuid4()),
                    section_id=row.id,
                    label=label,
                    tag=(item or {}).get("tag") or None,
                    value=str((item or {}).get("value") or "").strip() or None,
                    position=int((item or {}).get("position") or item_index),
                )
                self.db.add(item_row)
                created_items.append(item_row)

            self.db.commit()
            for item_row in created_items:
                self.db.refresh(item_row)
            self.db.refresh(row)

            saved.append(
                {
                    "id": row.id,
                    "hub_id": row.hub_id,
                    "title": row.title,
                    "position": row.position,
                    "is_visible": row.is_visible,
                    "created_at": row.created_at,
                    "updated_at": row.updated_at,
                    "items": [
                        {
                            "id": item.id,
                            "section_id": item.section_id,
                            "label": item.label,
                            "tag": item.tag,
                            "value": item.value,
                            "position": item.position,
                        }
                        for item in created_items
                    ],
                }
            )
        return saved

    def list_ctas(self, hub_id: str) -> list[HubCta]:
        stmt: Select[tuple[HubCta]] = (
            select(HubCta).where(HubCta.hub_id == hub_id).order_by(HubCta.position.asc())
        )
        return list(self.db.scalars(stmt))

    def replace_ctas(self, *, hub_id: str, ctas: list[dict]) -> list[HubCta]:
        self.db.execute(delete(HubCta).where(HubCta.hub_id == hub_id))
        self.db.commit()
        if not ctas:
            return []

        rows: list[HubCta] = []
        for index, cta in enumerate(ctas):
            label = str(cta.get("label") or "").strip()
            if not label:
                continue
            row = HubCta(
                id=str(cta.get("id") or uuid4()),
                hub_id=hub_id,
                label=label,
                action_type=str(cta.get("action_type") or "url"),
                action_value=str(cta.get("action_value") or "").strip(),
                position=int(cta.get("position") or index),
                is_visible=bool(cta.get("is_visible", True)),
            )
            self.db.add(row)
            rows.append(row)
        self.db.commit()
        for row in rows:
            self.db.refresh(row)
        return rows

    def delete_cta(self, *, hub_id: str, cta_id: str) -> bool:
        row = self.db.scalar(
            select(HubCta)
            .where(HubCta.id == cta_id)
            .where(HubCta.hub_id == hub_id)
            .limit(1)
        )
        if row is None:
            return False
        self.db.delete(row)
        self.db.commit()
        return True
