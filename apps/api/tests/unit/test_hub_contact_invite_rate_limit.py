from app.services.hub_contact_invite_rate_limit import (
    HUB_CONTACT_INVITE_MAX_PER_WINDOW,
    allow_hub_contact_invite,
    reset_hub_contact_invite_limits_for_tests,
)


def test_allow_hub_contact_invite_respects_window_cap() -> None:
    reset_hub_contact_invite_limits_for_tests()
    hub_id = "hub_1"
    user_id = "user_1"
    for _ in range(HUB_CONTACT_INVITE_MAX_PER_WINDOW):
        assert allow_hub_contact_invite(hub_id, user_id) is True
    assert allow_hub_contact_invite(hub_id, user_id) is False


def test_allow_hub_contact_invite_isolated_per_user() -> None:
    reset_hub_contact_invite_limits_for_tests()
    for _ in range(HUB_CONTACT_INVITE_MAX_PER_WINDOW):
        assert allow_hub_contact_invite("hub_1", "user_a") is True
    assert allow_hub_contact_invite("hub_1", "user_a") is False
    assert allow_hub_contact_invite("hub_1", "user_b") is True
