from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HubMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None
    hub_id: str
    user_id: str
    role: str
    status: str
    joined_at: datetime | None = None


class MyMembershipRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None
    hub_id: str
    role: str
    status: str
    joined_at: datetime | None = None


class MemberProfileRead(BaseModel):
    id: str
    full_name: str | None = None
    avatar_url: str | None = None
    email: str | None = None
