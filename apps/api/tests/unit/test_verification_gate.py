from app.auth.auth_context import is_path_allowed_for_unverified


def test_unverified_auth_and_profile_paths_allowed() -> None:
    assert is_path_allowed_for_unverified("/api/v1/auth/login")
    assert is_path_allowed_for_unverified("/api/v1/auth/verification-status")
    assert is_path_allowed_for_unverified("/api/v1/profiles/me")
    assert is_path_allowed_for_unverified("/api/v1/profiles/me/upsert")
    assert is_path_allowed_for_unverified("/api/v1/profiles/me/avatar/prepare")


def test_unverified_app_paths_blocked_by_gate() -> None:
    assert not is_path_allowed_for_unverified("/api/v1/deets")
    assert not is_path_allowed_for_unverified("/api/v1/hubs/unread")
    assert not is_path_allowed_for_unverified("/api/v1/profiles/me/header-feed")
    assert not is_path_allowed_for_unverified("/api/v1/profiles/search")
