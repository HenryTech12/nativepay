"""
Central place for environment-driven backend configuration. Keeping
these here (instead of scattered os.environ.get calls) makes the
production-vs-development behavior differences auditable in one file.
"""

import os

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").strip().lower()

IS_PRODUCTION = ENVIRONMENT == "production"

# Restrict CORS to this origin in production. In development, "*" is
# used for convenience so the Vite dev server can hit the API without
# per-machine configuration.
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "").strip()

# When true, customer-facing endpoints require a valid session token
# (see app.services.sessions) and enforce that a transaction/account
# belongs to the authenticated session's user. Defaults to on in
# production and off in development/tests so the existing test suite
# and local dev flow keep working without standing up a login flow.
REQUIRE_AUTH = os.environ.get("REQUIRE_AUTH", "true" if IS_PRODUCTION else "false").strip().lower() in (
    "1", "true", "yes", "on",
)

# Shared-secret header for agent/POS-only endpoints (BMONI admin routes,
# account registration, agent onboarding). Unset in development means
# these stay open, matching current hackathon-prototype behavior.
AGENT_API_KEY = os.environ.get("AGENT_API_KEY", "").strip()

# How long a customer session stays valid after face verification.
SESSION_TTL_SECONDS = int(os.environ.get("SESSION_TTL_SECONDS", "1800"))

# How long a transaction may sit awaiting confirmation/authorization
# before it must be re-initiated.
TRANSACTION_TTL_SECONDS = int(os.environ.get("TRANSACTION_TTL_SECONDS", "300"))

# Whether the client-supplied `matched` fallback on /api/transactions/verify-face
# may be used at all. Never available in production regardless of this
# flag; in non-production it's still only honored for accounts with no
# registered face descriptor (see main.py).
ALLOW_CLIENT_FACE_FALLBACK = not IS_PRODUCTION
