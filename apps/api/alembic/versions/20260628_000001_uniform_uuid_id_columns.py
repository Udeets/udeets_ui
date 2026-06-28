"""Normalize all id / foreign-key columns to uuid for type uniformity.

Several models historically declared id-bearing columns (primary keys and
foreign keys such as user_id / hub_id / created_by) as ``text`` while the
columns they reference are ``uuid``. This caused runtime errors like
``operator does not exist: uuid = text`` when joining (e.g. the unread-hubs
query joining ``deets.hub_id`` to ``hub_members.hub_id``).

This migration converts every such column to ``uuid`` so the schema is
uniform. ``oauth_accounts.provider_user_id`` is intentionally left as ``text``
because it stores the external provider identifier (e.g. Google ``sub``),
which is not a UUID.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "20260628_000001"
down_revision: str | None = "20260627_000001"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

OAUTH_FK = "oauth_accounts_user_id_fkey"

# (table, column) pairs whose values are UUIDs but were typed as text.
COLUMNS: tuple[tuple[str, str], ...] = (
    ("users", "id"),
    ("oauth_accounts", "id"),
    ("oauth_accounts", "user_id"),
    ("profiles", "id"),
    ("hubs", "created_by"),
    ("hub_members", "hub_id"),
    ("hub_members", "user_id"),
    ("deets", "created_by"),
    ("deet_likes", "user_id"),
    ("deet_comments", "user_id"),
    ("deet_views", "user_id"),
    ("deet_shares", "user_id"),
    ("comment_reactions", "user_id"),
    ("poll_votes", "user_id"),
    ("survey_responses", "user_id"),
    ("attachments", "uploaded_by"),
    ("events", "created_by"),
    ("event_rsvps", "user_id"),
    ("hub_ctas", "hub_id"),
    ("hub_invitations", "id"),
    ("hub_invitations", "hub_id"),
    ("hub_invitations", "invited_by"),
    ("hub_invitations", "invited_user_id"),
    ("profile_comments", "profile_id"),
    ("profile_comments", "author_id"),
    ("profile_likes", "profile_id"),
    ("profile_likes", "liker_id"),
    ("user_reports", "reporter_id"),
    ("user_reports", "reported_user_id"),
)


def upgrade() -> None:
    op.drop_constraint(OAUTH_FK, "oauth_accounts", type_="foreignkey")

    for table, column in COLUMNS:
        op.execute(
            f'ALTER TABLE public."{table}" '
            f'ALTER COLUMN "{column}" TYPE uuid '
            f'USING NULLIF("{column}", \'\')::uuid'
        )

    op.create_foreign_key(
        OAUTH_FK,
        "oauth_accounts",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(OAUTH_FK, "oauth_accounts", type_="foreignkey")

    for table, column in COLUMNS:
        op.execute(
            f'ALTER TABLE public."{table}" '
            f'ALTER COLUMN "{column}" TYPE text '
            f'USING "{column}"::text'
        )

    op.create_foreign_key(
        OAUTH_FK,
        "oauth_accounts",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
