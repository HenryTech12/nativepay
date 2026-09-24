"""
Real facial verification — 128-dimension face descriptors extracted
client-side with face-api.js (a dlib ResNet face-recognition model
running via TensorFlow.js in the browser), compared here via Euclidean
distance. This is the same descriptor-comparison technique used by
face_recognition/dlib-based systems generally, not a toy.

Only the descriptor (128 floats) is ever sent to or stored by this
backend — never a raw photo. Persisted to Postgres when DATABASE_URL is
set (see db.py); otherwise kept in-memory only, which means it's lost
on every restart — fine for local dev, not for anything that needs to
survive a redeploy or an idle respin.

0.6 is face-api.js's own documented threshold for "same person" on its
reference model; kept configurable since real-world camera/lighting
conditions can shift what's appropriate.
"""

import math
import os
from typing import Optional

from app.services import db

_face_descriptors: dict[str, list[float]] = {}

THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", "0.6"))


def _euclidean_distance(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        return float("inf")
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def register_face(user_id: str, descriptor: list[float]) -> dict:
    if db.is_ready():
        db.register_face(user_id, descriptor)
    else:
        _face_descriptors[user_id] = descriptor
    return {"registered": True, "userId": user_id}


def _stored_descriptor(user_id: str) -> Optional[list[float]]:
    if db.is_ready():
        return db.get_face_descriptor(user_id)
    return _face_descriptors.get(user_id)


def authorize_by_face(user_id: str, descriptor: list[float]) -> dict:
    stored = _stored_descriptor(user_id)
    if stored is None:
        return {"authorized": False, "reason": "no_registered_face"}
    distance = _euclidean_distance(stored, descriptor)
    return {"authorized": distance <= THRESHOLD, "distance": round(distance, 3), "threshold": THRESHOLD}


def has_face(user_id: str) -> bool:
    return _stored_descriptor(user_id) is not None
