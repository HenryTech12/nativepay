"""
Minimal session model (P0.7 in the refinement plan): a customer must
hold a server-issued session token, obtained only after a real face
verification, before touching any endpoint that returns account or
transaction data. This is intentionally lightweight (in-process,
random token, TTL) — enough to stop "guess the userId" access without
requiring a full auth stack for a hackathon build.

Not persisted to Postgres: sessions are short-lived (SESSION_TTL_SECONDS)
and losing them on a restart just means customers re-verify their face,
which is an acceptable trade-off for this scope.
"""

import secrets
import time
from typing import Optional

from app.services import config

_sessions: dict[str, tuple[str, float]] = {}  # token -> (userId, expiresAtEpoch)


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = (user_id, time.time() + config.SESSION_TTL_SECONDS)
    return token


def get_session_user(token: Optional[str]) -> Optional[str]:
    if not token:
        return None
    entry = _sessions.get(token)
    if not entry:
        return None
    user_id, expires_at = entry
    if time.time() > expires_at:
        _sessions.pop(token, None)
        return None
    return user_id


def revoke_session(token: str) -> None:
    _sessions.pop(token, None)


def clear_all() -> None:
    """Test helper only."""
    _sessions.clear()
