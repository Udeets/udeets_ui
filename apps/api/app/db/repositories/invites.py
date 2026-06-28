import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import Select, or_, outerjoin, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.db.models.hub import Hub
from app.db.models.hub_contact_invite import HubContactInvite
from app.db.models.hub_invitation import HubInvitation
from app.db.models.hub_join_link import HubJoinLink
from app.db.models.hub_member import HubMember
from app.db.models.profile import Profile
from app.schemas.invite import HubJoinLinkStateRead, PendingInvitationRead, ResolvedJoinLinkRead


class InviteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def resolve_join_token(self, token: str) -> ResolvedJoinLinkRead:
        now = datetime.now(UTC)
        stmt: Select[tuple[HubJoinLink, Hub]] = (
            select(HubJoinLink, Hub)
            .join(Hub, Hub.id == HubJoinLink.hub_id)
            .where(HubJoinLink.token == token)
        )
        row = self.db.execute(stmt).first()
        if not row:
            return ResolvedJoinLinkRead(
                hub_id="",
                category="",
                slug="",
                hub_name="",
                is_valid=False,
            )

        join_link, hub = row
        is_valid = join_link.disabled_at is None and (
            join_link.expires_at is None or join_link.expires_at > now
        )
        if not is_valid:
            return ResolvedJoinLinkRead(
                hub_id="",
                category="",
                slug="",
                hub_name="",
                is_valid=False,
            )

        return ResolvedJoinLinkRead(
            hub_id=hub.id,
            category=hub.category,
            slug=hub.slug,
            hub_name=hub.name,
            is_valid=True,
        )

    def _can_manage_hub_invites(self, hub_id: str, user_id: str) -> bool:
        hub = self.db.scalar(select(Hub).where(Hub.id == hub_id))
        if not hub:
            return False

        if hub.created_by == user_id:
            return True

        membership = self.db.scalar(
            select(HubMember)
            .where(HubMember.hub_id == hub_id)
            .where(HubMember.user_id == user_id)
            .where(HubMember.status == "active")
        )
        if not membership:
            return False
        return membership.role in {"creator", "admin"}

    def _generate_unique_join_token(self) -> str:
        for _ in range(6):
            token = secrets.token_urlsafe(18)
            exists = self.db.scalar(select(HubJoinLink).where(HubJoinLink.token == token))
            if not exists:
                return token
        raise RuntimeError("Could not generate unique join token")

    def _expiration_from_days(self, expires_in_days: int | None) -> datetime | None:
        if expires_in_days is None or expires_in_days <= 0:
            return None
        return datetime.now(UTC) + timedelta(days=expires_in_days)

    def get_or_create_join_link(
        self, hub_id: str, user_id: str, expires_in_days: int | None
    ) -> HubJoinLinkStateRead | None:
        if not self._can_manage_hub_invites(hub_id=hub_id, user_id=user_id):
            return None

        row = self.db.scalar(
            select(HubJoinLink)
            .where(HubJoinLink.hub_id == hub_id)
            .where(HubJoinLink.disabled_at.is_(None))
            .order_by(HubJoinLink.created_at.desc())
        )
        if not row:
            row = HubJoinLink(
                hub_id=hub_id,
                token=self._generate_unique_join_token(),
                expires_at=self._expiration_from_days(expires_in_days),
                disabled_at=None,
            )
            self.db.add(row)
            self.db.commit()
            self.db.refresh(row)

        return HubJoinLinkStateRead(
            token=row.token,
            expires_at=row.expires_at,
            disabled=row.disabled_at is not None,
        )

    def regenerate_join_link(
        self, hub_id: str, user_id: str, expires_in_days: int | None
    ) -> HubJoinLinkStateRead | None:
        if not self._can_manage_hub_invites(hub_id=hub_id, user_id=user_id):
            return None

        row = self.db.scalar(
            select(HubJoinLink)
            .where(HubJoinLink.hub_id == hub_id)
            .where(HubJoinLink.disabled_at.is_(None))
            .order_by(HubJoinLink.created_at.desc())
        )
        if not row:
            row = HubJoinLink(hub_id=hub_id, token="")
            self.db.add(row)

        row.token = self._generate_unique_join_token()
        row.disabled_at = None
        row.expires_at = self._expiration_from_days(expires_in_days)
        self.db.commit()
        self.db.refresh(row)

        return HubJoinLinkStateRead(
            token=row.token,
            expires_at=row.expires_at,
            disabled=row.disabled_at is not None,
        )

    def disable_join_link(self, hub_id: str, user_id: str) -> bool:
        if not self._can_manage_hub_invites(hub_id=hub_id, user_id=user_id):
            return False

        row = self.db.scalar(
            select(HubJoinLink)
            .where(HubJoinLink.hub_id == hub_id)
            .where(HubJoinLink.disabled_at.is_(None))
            .order_by(HubJoinLink.created_at.desc())
        )
        if not row:
            return False
        row.disabled_at = datetime.now(UTC)
        self.db.commit()
        return True

    def set_join_link_expiration(
        self, hub_id: str, user_id: str, expires_in_days: int | None
    ) -> datetime | None:
        if not self._can_manage_hub_invites(hub_id=hub_id, user_id=user_id):
            return None

        row = self.db.scalar(
            select(HubJoinLink)
            .where(HubJoinLink.hub_id == hub_id)
            .where(HubJoinLink.disabled_at.is_(None))
            .order_by(HubJoinLink.created_at.desc())
        )
        if not row:
            return None
        row.expires_at = self._expiration_from_days(expires_in_days)
        self.db.commit()
        self.db.refresh(row)
        return row.expires_at

    def _normalize_contact(
        self, contact_type: str, contact_value: str
    ) -> tuple[str, str] | None:
        raw = contact_value.strip()
        if contact_type == "email":
            normalized = raw.lower()
            if not normalized or "@" not in normalized:
                return None
            return raw, normalized

        if contact_type == "phone":
            digits = "".join(ch for ch in raw if ch.isdigit())
            if len(digits) == 10:
                national = digits
            elif len(digits) == 11 and digits.startswith("1"):
                national = digits[1:]
            else:
                return None
            if len(national) != 10:
                return None
            return raw, f"+1{national}"

        return None

    def send_contact_invite(
        self,
        hub_id: str,
        user_id: str,
        contact_type: str,
        contact_value: str,
        expires_in_days: int | None,
    ) -> bool:
        if not self._can_manage_hub_invites(hub_id=hub_id, user_id=user_id):
            return False
        if contact_type not in {"email", "phone"}:
            return False

        normalized = self._normalize_contact(contact_type, contact_value)
        if not normalized:
            return False

        raw_value, contact_normalized = normalized
        expires_at = self._expiration_from_days(expires_in_days)
        matched_user_id: str | None = None
        hub_invitation_id: str | None = None
        invite_status = "pending"

        if contact_type == "email":
            profile = self.db.scalar(
                select(Profile)
                .where(Profile.email.is_not(None))
                .where(Profile.email.ilike(contact_normalized))
            )
            if profile:
                matched_user_id = profile.id
                invite_status = "matched"

                existing_member = self.db.scalar(
                    select(HubMember)
                    .where(HubMember.hub_id == hub_id)
                    .where(HubMember.user_id == matched_user_id)
                    .where(HubMember.status == "active")
                )
                if existing_member:
                    return True

                existing_inv = self.db.scalar(
                    select(HubInvitation)
                    .where(HubInvitation.hub_id == hub_id)
                    .where(HubInvitation.invited_user_id == matched_user_id)
                    .where(HubInvitation.status == "pending")
                    .where(
                        or_(
                            HubInvitation.expires_at.is_(None),
                            HubInvitation.expires_at > datetime.now(UTC),
                        )
                    )
                )
                if existing_inv:
                    existing_inv.expires_at = expires_at
                    hub_invitation_id = existing_inv.id
                else:
                    created_inv = HubInvitation(
                        hub_id=hub_id,
                        invited_user_id=matched_user_id,
                        invited_by=user_id,
                        status="pending",
                        expires_at=expires_at,
                    )
                    self.db.add(created_inv)
                    self.db.flush()
                    hub_invitation_id = created_inv.id

        insert_stmt = (
            insert(HubContactInvite)
            .values(
                hub_id=hub_id,
                invited_by=user_id,
                contact_type=contact_type,
                contact_value=raw_value,
                contact_normalized=contact_normalized,
                status=invite_status,
                matched_user_id=matched_user_id,
                hub_invitation_id=hub_invitation_id,
                expires_at=expires_at,
            )
            .on_conflict_do_nothing(
                index_elements=["hub_id", "contact_type", "contact_normalized"],
                index_where=(HubContactInvite.status == "pending"),
            )
        )
        self.db.execute(insert_stmt)
        self.db.commit()
        return True

    def list_pending_invitations(self, user_id: str) -> list[PendingInvitationRead]:
        now = datetime.now(UTC)
        join_hub = outerjoin(HubInvitation, Hub, Hub.id == HubInvitation.hub_id)
        join_profile = outerjoin(join_hub, Profile, Profile.id == HubInvitation.invited_by)

        stmt = (
            select(HubInvitation, Hub, Profile)
            .select_from(join_profile)
            .where(HubInvitation.invited_user_id == user_id)
            .where(HubInvitation.status == "pending")
            .where(or_(HubInvitation.expires_at.is_(None), HubInvitation.expires_at > now))
            .order_by(HubInvitation.created_at.desc())
        )
        rows = self.db.execute(stmt).all()

        result: list[PendingInvitationRead] = []
        for invitation, hub, inviter in rows:
            if not hub:
                continue
            inviter_name = "Someone"
            if inviter:
                if inviter.full_name:
                    inviter_name = inviter.full_name
                elif inviter.email:
                    inviter_name = inviter.email.split("@")[0]
            result.append(
                PendingInvitationRead(
                    invitation_id=invitation.id,
                    hub_id=hub.id,
                    hub_name=hub.name,
                    hub_category=hub.category,
                    hub_slug=hub.slug,
                    dp_image=hub.dp_image_url or "",
                    invited_at=invitation.created_at,
                    invited_by_name=inviter_name,
                )
            )
        return result

    def accept_invitation(self, invitation_id: str, user_id: str) -> bool:
        now = datetime.now(UTC)
        invitation_stmt: Select[tuple[HubInvitation]] = (
            select(HubInvitation)
            .where(HubInvitation.id == invitation_id)
            .where(HubInvitation.invited_user_id == user_id)
            .where(HubInvitation.status == "pending")
            .where(or_(HubInvitation.expires_at.is_(None), HubInvitation.expires_at > now))
        )
        invitation = self.db.scalar(invitation_stmt)
        if not invitation:
            return False

        upsert_stmt = (
            insert(HubMember)
            .values(
                hub_id=invitation.hub_id,
                user_id=user_id,
                status="active",
                role="member",
                joined_at=now,
            )
            .on_conflict_do_update(
                index_elements=["hub_id", "user_id"],
                set_={"status": "active", "role": "member", "joined_at": now},
            )
        )
        self.db.execute(upsert_stmt)

        invitation.status = "accepted"
        invitation.responded_at = now
        self.db.commit()
        return True

    def decline_invitation(self, invitation_id: str, user_id: str) -> bool:
        now = datetime.now(UTC)
        invitation_stmt: Select[tuple[HubInvitation]] = (
            select(HubInvitation)
            .where(HubInvitation.id == invitation_id)
            .where(HubInvitation.invited_user_id == user_id)
            .where(HubInvitation.status == "pending")
            .where(or_(HubInvitation.expires_at.is_(None), HubInvitation.expires_at > now))
        )
        invitation = self.db.scalar(invitation_stmt)
        if not invitation:
            return False

        invitation.status = "declined"
        invitation.responded_at = now
        self.db.commit()
        return True
