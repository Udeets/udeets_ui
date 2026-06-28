#!/usr/bin/env python3
"""
Bootstrap local development for udeets_ui.

Usage:
  python scripts/bootstrap.py
  npm run bootstrap

Starts Docker infra (Postgres, Redis, MinIO), installs deps, creates schema,
writes .env.local files, and verifies connectivity.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import shutil
import socket
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "apps" / "api"
WEB_ROOT = ROOT / "apps" / "web"
COMPOSE_FILE = ROOT / "docker-compose.dev.yml"
VENV_DIR = API_ROOT / ".venv"

MIN_PYTHON = (3, 11)
MIN_NODE = 18

LOCAL_API_ENV = {
    "ENV": "development",
    "APP_NAME": "udeets-api",
    "API_V1_PREFIX": "/api/v1",
    "HOST": "0.0.0.0",
    "PORT": "8000",
    "DATABASE_URL": "postgresql+psycopg://postgres:postgres@localhost:5432/udeets",
    "DB_PROVIDER": "rds_primary",
    "MEDIA_PROVIDER": "s3_primary",
    "AUTH_PROVIDER": "udeets",
    "JWT_SECRET": "",
    "JWT_ISSUER": "udeets",
    "JWT_ACCESS_TTL_SECONDS": "3600",
    "GOOGLE_CLIENT_ID": "",
    "GOOGLE_CLIENT_SECRET": "",
    "GOOGLE_REDIRECT_URI": "http://localhost:3000/auth/callback",
    "AWS_REGION": "us-east-1",
    "AWS_ACCESS_KEY_ID": "minioadmin",
    "AWS_SECRET_ACCESS_KEY": "minioadmin",
    "AWS_ENDPOINT_URL": "http://127.0.0.1:9000",
    "S3_BUCKET_NAME": "udeets-media-local",
    "S3_MEDIA_PREFIX": "local",
    "S3_PUBLIC_BASE_URL": "http://127.0.0.1:9000/udeets-media-local",
    "S3_UPLOAD_URL_TTL_SECONDS": "900",
    "REDIS_URL": "redis://localhost:6379/0",
    "CHAT_REALTIME_ENABLED": "true",
    "CHAT_REDIS_SUBSCRIBE_MODE": "per_room",
    "CHAT_PUBSUB_CHANNEL_PREFIX": "chat:room:",
    "CHAT_TYPING_TTL_SECONDS": "9",
    "CHAT_TYPING_STARTED_RATE_LIMIT_SECONDS": "4",
    "NOTIFICATIONS_REALTIME_ENABLED": "true",
    "NOTIFICATIONS_PUBSUB_CHANNEL_PREFIX": "notify:user",
    "NOTIFICATIONS_REDIS_SUBSCRIBE_MODE": "per_user",
    "EVENT_BUS_BACKEND": "redis_stream",
    "EVENT_STREAM_KEY": "events:udeets",
}

LOCAL_WEB_ENV = {
    "NEXT_PUBLIC_FASTAPI_BASE_URL": "http://localhost:8000",
    "FASTAPI_BASE_URL": "http://localhost:8000",
    "NEXT_PUBLIC_FASTAPI_WS_URL": "ws://localhost:8000/api/v1/chat/ws",
    "NEXT_PUBLIC_CHAT_REALTIME_ENABLED": "true",
    "NEXT_PUBLIC_CHAT_POLLING_FALLBACK_ENABLED": "true",
    "NEXT_PUBLIC_NOTIFICATIONS_REALTIME_ENABLED": "true",
    "NEXT_PUBLIC_NOTIFICATIONS_WS_URL": "ws://localhost:8000/api/v1/notifications/ws",
    "NEXT_PUBLIC_MEDIA_PUBLIC_BASE_URL": "http://127.0.0.1:9000/udeets-media-local",
    "GOOGLE_CLIENT_ID": "",
    "GOOGLE_REDIRECT_URI": "http://localhost:3000/auth/callback",
}

AUTH_KEYS = (
    "JWT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
)


def log(msg: str) -> None:
    print(f"[bootstrap] {msg}")


def warn(msg: str) -> None:
    print(f"[bootstrap] WARNING: {msg}", file=sys.stderr)


def fail(msg: str, code: int = 1) -> None:
    print(f"[bootstrap] ERROR: {msg}", file=sys.stderr)
    raise SystemExit(code)


def resolve_cmd(name: str) -> str:
    """Resolve an executable on PATH (required on Windows for npm.cmd, etc.)."""
    path = shutil.which(name)
    if not path:
        fail(f"Could not resolve '{name}' on PATH.")
    return path


def argv(exe: str, *parts: str) -> list[str]:
    return [resolve_cmd(exe), *parts]


def run(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    log(f"Running: {' '.join(cmd)}")
    merged = os.environ.copy()
    if env:
        merged.update(env)
    result = subprocess.run(
        cmd,
        cwd=cwd or ROOT,
        env=merged,
        text=True,
        capture_output=True,
    )
    if check and result.returncode != 0:
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        fail(f"Command failed ({result.returncode}): {' '.join(cmd)}")
    return result


def parse_version(text: str) -> tuple[int, ...]:
    match = re.search(r"(\d+(?:\.\d+)*)", text)
    if not match:
        return (0,)
    return tuple(int(p) for p in match.group(1).split("."))


def check_command(name: str, version_flag: str = "--version") -> bool:
    path = shutil.which(name)
    if not path:
        return False
    try:
        result = subprocess.run(
            [path, version_flag],
            capture_output=True,
            text=True,
            check=False,
        )
        output = (result.stdout or result.stderr or "").strip()
        if output:
            log(f"Found {name}: {output.splitlines()[0]}")
        else:
            log(f"Found {name} at {path}")
    except OSError:
        return False
    return True


def port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def preflight(skip_docker: bool, check_only: bool = False) -> None:
    log("Phase A — Preflight")
    if sys.version_info < MIN_PYTHON:
        fail(f"Python {MIN_PYTHON[0]}.{MIN_PYTHON[1]}+ required (found {sys.version.split()[0]})")

    if not check_command("node"):
        fail("Node.js is not installed. Install from https://nodejs.org/ (LTS 18+).")
    node_ver = run(argv("node", "--version"), check=True).stdout.strip()
    if parse_version(node_ver) < (MIN_NODE,):
        fail(f"Node.js {MIN_NODE}+ required (found {node_ver})")

    if not check_command("npm"):
        fail("npm is not installed.")

    if skip_docker or check_only:
        if check_only:
            log("Check-only mode — skipping Docker requirement")
        return

    if not check_command("docker"):
        fail(
            "Docker is not installed. Install Docker Desktop: "
            "https://www.docker.com/products/docker-desktop/"
        )
    compose_ok = shutil.which("docker-compose") or (
        run(argv("docker", "compose", "version"), check=False).returncode == 0
    )
    if not compose_ok:
        fail("docker compose is not available.")

    for port, label in (
        (5432, "Postgres"),
        (6379, "Redis"),
        (9000, "MinIO API"),
    ):
        if port_in_use(port):
            warn(f"Port {port} ({label}) is already in use — Docker may fail to bind or use existing service.")


def resolve_python() -> str:
    if os.environ.get("VIRTUAL_ENV"):
        return sys.executable
    if VENV_DIR.exists():
        if sys.platform == "win32":
            candidate = VENV_DIR / "Scripts" / "python.exe"
        else:
            candidate = VENV_DIR / "bin" / "python"
        if candidate.exists():
            return str(candidate)
    return sys.executable


def ensure_venv() -> str:
    python = resolve_python()
    if os.environ.get("VIRTUAL_ENV") or VENV_DIR.exists():
        return python
    log(f"Creating virtualenv at {VENV_DIR}")
    run([sys.executable, "-m", "venv", str(VENV_DIR)])
    if sys.platform == "win32":
        return str(VENV_DIR / "Scripts" / "python.exe")
    return str(VENV_DIR / "bin" / "python")


def install_deps(skip_deps: bool) -> str:
    log("Phase B — Install dependencies")
    python = resolve_python()
    if skip_deps:
        log("Skipping dependency install (--skip-deps)")
        return python

    run(argv("npm", "install"), cwd=ROOT)
    python = ensure_venv()
    run([python, "-m", "pip", "install", "-e", "./apps/api[dev]"], cwd=ROOT)
    return python


def docker_compose_up(skip_docker: bool) -> None:
    log("Phase C — Start infrastructure")
    if skip_docker:
        log("Skipping Docker (--skip-docker)")
        return
    if not COMPOSE_FILE.exists():
        fail(f"Missing {COMPOSE_FILE}")

    compose_up = argv("docker", "compose", "-f", str(COMPOSE_FILE), "up", "-d", "--wait")
    result = run(compose_up, check=False)
    if result.returncode != 0:
        run(argv("docker", "compose", "-f", str(COMPOSE_FILE), "up", "-d"))
        log("Waiting for services to become healthy...")
        run(argv("docker", "compose", "-f", str(COMPOSE_FILE), "ps"))


def parse_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    data: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        data[key.strip()] = value.strip()
    return data


def format_env_file(values: dict[str, str]) -> str:
    lines = [
        "# Generated by scripts/bootstrap.py — local development overrides.",
        "# Re-run bootstrap with --force-env to regenerate.",
        "",
    ]
    for key, value in values.items():
        lines.append(f"{key}={value}")
    lines.append("")
    return "\n".join(lines)


def merge_auth_from_existing(target: dict[str, str], sources: list[Path]) -> None:
    for path in sources:
        for key, value in parse_env_file(path).items():
            if key in AUTH_KEYS and value and not target.get(key):
                target[key] = value
    if not target.get("JWT_SECRET"):
        target["JWT_SECRET"] = secrets.token_urlsafe(48)


def write_env_files(force_env: bool) -> None:
    log("Phase D — Environment files")
    api_local = API_ROOT / ".env.local"
    web_local = WEB_ROOT / ".env.local"

    if api_local.exists() and not force_env:
        log(f"Keeping existing {api_local}")
    else:
        api_values = dict(LOCAL_API_ENV)
        merge_auth_from_existing(api_values, [API_ROOT / ".env", api_local, WEB_ROOT / ".env.local"])
        api_local.write_text(format_env_file(api_values), encoding="utf-8")
        log(f"Wrote {api_local}")

    if web_local.exists() and not force_env:
        log(f"Keeping existing {web_local}")
    else:
        web_values = dict(LOCAL_WEB_ENV)
        merge_auth_from_existing(web_values, [WEB_ROOT / ".env.local", API_ROOT / ".env.local", API_ROOT / ".env"])
        web_out = {
            k: v
            for k, v in web_values.items()
            if k in LOCAL_WEB_ENV or k.startswith("NEXT_PUBLIC_") or k == "GOOGLE_CLIENT_ID"
        }
        web_local.write_text(format_env_file(web_out), encoding="utf-8")
        log(f"Wrote {web_local}")


def load_bootstrap_env() -> dict[str, str]:
    env = os.environ.copy()
    for path in (API_ROOT / ".env", API_ROOT / ".env.local"):
        env.update(parse_env_file(path))
    return env


def bootstrap_database(python: str, skip_db: bool) -> None:
    log("Phase E — Database schema")
    if skip_db:
        log("Skipping database bootstrap (--skip-db)")
        return
    env = load_bootstrap_env()
    run([python, str(API_ROOT / "scripts" / "bootstrap_db.py")], cwd=API_ROOT, env=env)


def init_minio_bucket(no_minio_init: bool) -> None:
    log("Phase F — MinIO bucket")
    if no_minio_init:
        log("Skipping MinIO init (--no-minio-init)")
        return
    try:
        import boto3
        from botocore.exceptions import ClientError
    except ImportError:
        warn("boto3 not installed; skipping MinIO bucket verification")
        return

    env = load_bootstrap_env()
    endpoint = env.get("AWS_ENDPOINT_URL", "http://127.0.0.1:9000")
    bucket = env.get("S3_BUCKET_NAME", "udeets-media-local")
    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=env.get("AWS_ACCESS_KEY_ID", "minioadmin"),
        aws_secret_access_key=env.get("AWS_SECRET_ACCESS_KEY", "minioadmin"),
        region_name=env.get("AWS_REGION", "us-east-1"),
    )
    try:
        client.head_bucket(Bucket=bucket)
        log(f"MinIO bucket '{bucket}' exists")
    except ClientError:
        log(f"Creating MinIO bucket '{bucket}'...")
        client.create_bucket(Bucket=bucket)

    try:
        client.put_object(Bucket=bucket, Key=".bootstrap-check", Body=b"ok")
        log("MinIO upload smoke test passed")
    except ClientError as exc:
        warn(f"MinIO upload smoke test failed: {exc}")


def verify_postgres(env: dict[str, str]) -> bool:
    try:
        import psycopg
    except ImportError:
        warn("psycopg not available for Postgres verification")
        return False
    dsn = env.get("DATABASE_URL", LOCAL_API_ENV["DATABASE_URL"])
    dsn = dsn.replace("postgresql+psycopg://", "postgresql://")
    try:
        with psycopg.connect(dsn, connect_timeout=5) as conn, conn.cursor() as cur:
            cur.execute("SELECT 1")
            cur.execute(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
            )
            count = cur.fetchone()[0]
            log(f"Postgres OK ({count} public tables)")
            return count > 0
    except Exception as exc:
        warn(f"Postgres check failed: {exc}")
        return False


def verify_redis(env: dict[str, str]) -> bool:
    url = env.get("REDIS_URL")
    if not url:
        warn("REDIS_URL not set")
        return False
    try:
        import redis
    except ImportError:
        warn("redis package not available for verification")
        return False
    try:
        client = redis.from_url(url, socket_connect_timeout=5)
        client.ping()
        log("Redis OK")
        return True
    except Exception as exc:
        warn(f"Redis check failed: {exc}")
        return False


def verify_auth(env: dict[str, str]) -> bool:
    jwt_secret = env.get("JWT_SECRET")
    google_client_id = env.get("GOOGLE_CLIENT_ID")
    google_secret = env.get("GOOGLE_CLIENT_SECRET")
    if not jwt_secret:
        warn("JWT_SECRET is not configured in apps/api/.env.local")
        return False
    if not google_client_id or not google_secret:
        warn(
            "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET "
            "in apps/api/.env.local (and GOOGLE_CLIENT_ID in apps/web/.env.local)."
        )
        return False
    log("Auth config present (JWT + Google OAuth)")
    return True


def verify_alembic(env: dict[str, str]) -> bool:
    try:
        import psycopg
    except ImportError:
        return False
    dsn = env.get("DATABASE_URL", LOCAL_API_ENV["DATABASE_URL"]).replace(
        "postgresql+psycopg://", "postgresql://"
    )
    try:
        with psycopg.connect(dsn, connect_timeout=5) as conn, conn.cursor() as cur:
            cur.execute("SELECT version_num FROM alembic_version LIMIT 1")
            row = cur.fetchone()
            if row:
                log(f"Alembic stamped at {row[0]}")
                return True
            warn("alembic_version table empty — run bootstrap without --skip-db")
    except Exception as exc:
        warn(f"Alembic check failed: {exc}")
    return False


def verify() -> None:
    log("Phase G — Verification")
    env = load_bootstrap_env()
    results = {
        "postgres": verify_postgres(env),
        "redis": verify_redis(env),
        "auth": verify_auth(env),
        "alembic": verify_alembic(env),
    }

    print()
    print("=" * 60)
    print("Bootstrap summary")
    print("=" * 60)
    for name, ok in results.items():
        print(f"  {name}: {'OK' if ok else 'NEEDS ATTENTION'}")
    print()
    print("Next steps:")
    print("  npm run dev              # start web (:3000) + API (:8000)")
    print("  npm run dev:infra        # start Docker services only")
    print("  npm run dev:infra:down   # stop Docker services")
    print()
    print("MinIO console: http://localhost:9001  (minioadmin / minioadmin)")
    print("Ensure Google OAuth redirect URI includes:")
    print("  http://localhost:3000/auth/callback")
    print("  http://127.0.0.1:3000/auth/callback")
    print("=" * 60)

    if not results["auth"]:
        warn("Auth will not work until JWT_SECRET and Google OAuth vars are set in apps/api/.env.local")


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap udeets_ui local development")
    parser.add_argument("--skip-docker", action="store_true", help="Skip docker compose up")
    parser.add_argument("--skip-deps", action="store_true", help="Skip npm/pip install")
    parser.add_argument("--skip-db", action="store_true", help="Skip schema create/stamp")
    parser.add_argument("--force-env", action="store_true", help="Regenerate .env.local files")
    parser.add_argument("--no-minio-init", action="store_true", help="Skip MinIO bucket setup")
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Preflight + verification only (no installs or infra changes)",
    )
    args = parser.parse_args()

    log("udeets_ui local dev bootstrap")
    preflight(args.skip_docker, check_only=args.check_only)

    if args.check_only:
        verify()
        return 0

    python = install_deps(args.skip_deps)
    docker_compose_up(args.skip_docker)
    write_env_files(args.force_env)
    bootstrap_database(python, args.skip_db)
    init_minio_bucket(args.no_minio_init)
    verify()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
