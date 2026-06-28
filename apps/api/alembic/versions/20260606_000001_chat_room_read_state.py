"""Add chat_room_read_state for per-user chat unread tracking."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260606_000001"
down_revision: str | None = "20260516_000001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "chat_room_read_state",
        sa.Column("user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("room_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("last_read_message_id", sa.UUID(as_uuid=False), nullable=True),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("user_id", "room_id"),
    )
    op.create_index(
        "ix_chat_room_read_state_room_id",
        "chat_room_read_state",
        ["room_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_chat_room_read_state_room_id", table_name="chat_room_read_state")
    op.drop_table("chat_room_read_state")
