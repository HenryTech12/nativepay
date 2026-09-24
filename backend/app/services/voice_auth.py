"""
Lightweight heuristic voiceprint check — MFCC feature vectors (extracted
client-side with Meyda.js) compared via cosine similarity. A real signal,
NOT trained speaker-verification. Facial capture remains the actual
authorization gate; this only decides whether to skip straight to it.

Not called anywhere in the active login/transaction flow right now —
voice auth is parked for a future phase when it scales back in (see
app/main.py, App.tsx). Kept working and persisted the same way as
face_auth.py (Postgres when DATABASE_URL is set, in-memory otherwise)
so it's ready to reconnect later without rewriting storage.
"""

import math
import os
from typing import Optional

from app.services import db

_voiceprints: dict[str, list[float]] = {}

THRESHOLD = float(os.environ.get("VOICE_MATCH_THRESHOLD", "0.85"))

# Stricter than the login threshold — this one can skip the mandatory
# face check for a transaction, so it demands a much higher-confidence
# match than "good enough to skip straight to the app" at login.
TRANSACTION_THRESHOLD = float(os.environ.get("TRANSACTION_VOICE_MATCH_THRESHOLD", "0.92"))


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def register_voiceprint(user_id: str, feature_vector: list[float]) -> dict:
    if db.is_ready():
        db.register_voiceprint(user_id, feature_vector)
    else:
        _voiceprints[user_id] = feature_vector
    return {"registered": True, "userId": user_id}


def _stored_voiceprint(user_id: str) -> Optional[list[float]]:
    if db.is_ready():
        return db.get_voiceprint(user_id)
    return _voiceprints.get(user_id)


def authorize_by_voice(user_id: str, feature_vector: list[float]) -> dict:
    stored = _stored_voiceprint(user_id)
    if stored is None:
        return {"authorized": False, "reason": "no_registered_voiceprint"}
    similarity = _cosine_similarity(stored, feature_vector)
    return {"authorized": similarity >= THRESHOLD, "similarity": round(similarity, 3), "threshold": THRESHOLD}


def authorize_for_transaction(user_id: str, feature_vector: list[float]) -> dict:
    """Stricter check used to decide whether a transaction's mandatory
    face check can be skipped — same mechanism as authorize_by_voice,
    higher bar, because this one authorizes money movement rather than
    just a login shortcut."""
    stored = _stored_voiceprint(user_id)
    if stored is None:
        return {"authorized": False, "reason": "no_registered_voiceprint"}
    similarity = _cosine_similarity(stored, feature_vector)
    return {"authorized": similarity >= TRANSACTION_THRESHOLD, "similarity": round(similarity, 3), "threshold": TRANSACTION_THRESHOLD}


def has_voiceprint(user_id: str) -> bool:
    return _stored_voiceprint(user_id) is not None
