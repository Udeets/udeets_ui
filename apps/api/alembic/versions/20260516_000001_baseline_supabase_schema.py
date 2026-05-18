"""Baseline revision for existing Supabase-managed schema.

This baseline intentionally does not create or alter tables.
It marks the current production schema state so future SQLAlchemy/Alembic
changes can be introduced safely without rewriting existing objects.
"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "20260516_000001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    raise RuntimeError("Baseline revision cannot be downgraded safely.")
