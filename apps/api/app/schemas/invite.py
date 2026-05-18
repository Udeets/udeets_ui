from datetime import datetime

from pydantic import BaseModel


class ResolvedJoinLinkRead(BaseModel):
    hub_id: str
    category: str
    slug: str
    hub_name: str
    is_valid: bool


class HubJoinLinkStateRead(BaseModel):
    token: str
    expires_at: datetime | None = None
    disabled: bool


class HubJoinLinkExpirationRequest(BaseModel):
    expires_in_days: int | None = None


class HubContactInviteRequest(BaseModel):
    contact_type: str
    contact_value: str
    expires_in_days: int | None = 30


class PendingInvitationRead(BaseModel):
    invitation_id: str
    hub_id: str
    hub_name: str
    hub_category: str
    hub_slug: str
    dp_image: str
    invited_at: datetime | None = None
    invited_by_name: str
