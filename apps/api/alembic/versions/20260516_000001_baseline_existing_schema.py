"""Baseline revision for an existing Postgres schema.

This baseline intentionally does not create or alter tables.
It marks databases that already had the app schema (from RDS bundle or
local bootstrap) so later Alembic revisions can be applied incrementally.
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
