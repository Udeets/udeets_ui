"""Add password credentials and verification challenges for email/phone signup."""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260629_000001"
down_revision: str | None = "20260628_000001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.Text(), nullable=True))
    op.add_column(
        "users",
        sa.Column("phone_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("users", sa.Column("password_hash", sa.Text(), nullable=True))
    op.add_column(
        "users",
        sa.Column("verification_failed_attempts", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column("users", sa.Column("verification_locked_until", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)

    op.create_table(
        "verification_challenges",
        sa.Column("id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("channel", sa.Text(), nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False, server_default=sa.text("'signup'")),
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_attempts", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_verification_challenges_user_id", "verification_challenges", ["user_id"])
    op.create_index("ix_verification_challenges_token_hash", "verification_challenges", ["token_hash"])


def downgrade() -> None:
    op.drop_index("ix_verification_challenges_token_hash", table_name="verification_challenges")
    op.drop_index("ix_verification_challenges_user_id", table_name="verification_challenges")
    op.drop_table("verification_challenges")
    op.drop_index("ix_users_phone", table_name="users")
    op.drop_column("users", "verification_locked_until")
    op.drop_column("users", "verification_failed_attempts")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "phone_verified")
    op.drop_column("users", "phone")
