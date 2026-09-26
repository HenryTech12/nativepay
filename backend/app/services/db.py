"""
Optional PostgreSQL persistence. Set DATABASE_URL and accounts, face
descriptors, voiceprints, and transactions survive process restarts
instead of living only in the in-memory dicts in store.py /
face_auth.py / voice_auth.py. Leave DATABASE_URL unset (local dev,
tests) and every caller falls back to those in-memory dicts exactly as
before — this module changes nothing about behavior when it isn't
configured.

If DATABASE_URL is set but the connection fails at startup, init_schema()
logs the error and is_ready() stays False, so the app still runs on the
in-memory fallback rather than crashing the whole demo over a DB hiccup.
"""

import logging
import os
from contextlib import contextmanager
from typing import Iterator, Optional

from app.models import Account, AgentBmoniProfile, TransactionRecord
from app.services import config

logger = logging.getLogger("nativepay.db")


class DatabaseUnavailableError(RuntimeError):
    """Raised at startup when ENVIRONMENT=production but persistence
    cannot be established — see init_schema(). Production must never
    silently fall back to in-memory storage (P0.6): a demo can look
    healthy while accounts/transactions/biometrics quietly evaporate on
    every restart."""

_DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
_pool = None
_ready = False

_SCHEMA = """
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    preferred_language TEXT NOT NULL,
    balance INTEGER NOT NULL,
    address TEXT,
    email TEXT,
    card_number TEXT
);
CREATE TABLE IF NOT EXISTS face_descriptors (
    user_id TEXT PRIMARY KEY,
    descriptor JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS voiceprints (
    user_id TEXT PRIMARY KEY,
    feature_vector JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    amount INTEGER,
    recipient TEXT,
    recipient_account TEXT,
    confidence REAL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    face_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_method TEXT,
    bmoni_reference TEXT,
    bmoni_simulated BOOLEAN,
    error TEXT,
    needs_clarification TEXT,
    expires_at TEXT
);
CREATE TABLE IF NOT EXISTS agent_bmoni_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    bmoni_user_id TEXT,
    bmoni_smart_wallet_id TEXT,
    bmoni_wallet_address TEXT,
    bmoni_withdrawal_account_id TEXT,
    bmoni_onboarded BOOLEAN NOT NULL DEFAULT FALSE
);
"""


def _normalize_url(url: str) -> str:
    # psycopg2/libpq accept both, but normalize so a Render-style
    # "postgres://" URL and a "postgresql://" one behave identically.
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://"):]
    return url


def is_enabled() -> bool:
    return bool(_DATABASE_URL)


def is_ready() -> bool:
    return _ready


def _get_pool():
    global _pool
    if _pool is None:
        import psycopg2.pool

        connect_kwargs = {} if "sslmode=" in _DATABASE_URL else {"sslmode": "require"}
        _pool = psycopg2.pool.SimpleConnectionPool(1, 5, _normalize_url(_DATABASE_URL), **connect_kwargs)
    return _pool


@contextmanager
def _cursor() -> Iterator:
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def init_schema() -> bool:
    """Call once at startup. Seeds the same demo account store.py
    hardcodes in-memory, so the demo card/login works identically in
    either storage mode."""
    global _ready
    if not is_enabled():
        if config.IS_PRODUCTION:
            raise DatabaseUnavailableError(
                "ENVIRONMENT=production requires DATABASE_URL to be set — refusing to start "
                "with in-memory storage, which loses every account/transaction/biometric on restart."
            )
        return False
    try:
        with _cursor() as cur:
            cur.execute(_SCHEMA)
            cur.execute(
                """INSERT INTO accounts (id, name, preferred_language, balance, card_number)
                   VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING""",
                ("mama-aisha", "Olawale Zainab", "yo", 300000, "5060 0000 0000 0001"),
            )
        _ready = True
        logger.info("Postgres persistence enabled.")
    except DatabaseUnavailableError:
        raise
    except Exception as err:
        _ready = False
        if config.IS_PRODUCTION:
            raise DatabaseUnavailableError(f"DATABASE_URL is set but unreachable in production: {err}") from err
        logger.error("Postgres unavailable, falling back to in-memory storage: %s", err)
    return _ready


def _row_to_account(row) -> Account:
    return Account(
        id=row[0], name=row[1], preferredLanguage=row[2], balance=row[3],
        address=row[4], email=row[5], cardNumber=row[6],
    )

_ACCOUNT_COLUMNS = "id, name, preferred_language, balance, address, email, card_number"


def create_account(account: Account) -> None:
    with _cursor() as cur:
        cur.execute(
            f"INSERT INTO accounts ({_ACCOUNT_COLUMNS}) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (account.id, account.name, account.preferredLanguage, account.balance,
             account.address, account.email, account.cardNumber),
        )


def get_account(user_id: str) -> Optional[Account]:
    with _cursor() as cur:
        cur.execute(f"SELECT {_ACCOUNT_COLUMNS} FROM accounts WHERE id = %s", (user_id,))
        row = cur.fetchone()
    return _row_to_account(row) if row else None


def adjust_balance(user_id: str, delta: int) -> Optional[Account]:
    with _cursor() as cur:
        cur.execute(
            f"UPDATE accounts SET balance = balance + %s WHERE id = %s RETURNING {_ACCOUNT_COLUMNS}",
            (delta, user_id),
        )
        row = cur.fetchone()
    return _row_to_account(row) if row else None


def get_account_by_card(normalized_card_number: str) -> Optional[Account]:
    with _cursor() as cur:
        cur.execute(
            f"""SELECT {_ACCOUNT_COLUMNS} FROM accounts
                WHERE replace(replace(card_number, ' ', ''), '-', '') = %s""",
            (normalized_card_number,),
        )
        row = cur.fetchone()
    return _row_to_account(row) if row else None


def find_accounts_by_name(query_lower: str) -> list[Account]:
    with _cursor() as cur:
        cur.execute(f"SELECT {_ACCOUNT_COLUMNS} FROM accounts WHERE lower(name) LIKE %s", (f"%{query_lower}%",))
        rows = cur.fetchall()
    return [_row_to_account(r) for r in rows]


def register_face(user_id: str, descriptor: list[float]) -> None:
    import psycopg2.extras

    with _cursor() as cur:
        cur.execute(
            """INSERT INTO face_descriptors (user_id, descriptor) VALUES (%s, %s)
               ON CONFLICT (user_id) DO UPDATE SET descriptor = EXCLUDED.descriptor""",
            (user_id, psycopg2.extras.Json(descriptor)),
        )


def get_face_descriptor(user_id: str) -> Optional[list[float]]:
    with _cursor() as cur:
        cur.execute("SELECT descriptor FROM face_descriptors WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
    return row[0] if row else None


def register_voiceprint(user_id: str, feature_vector: list[float]) -> None:
    import psycopg2.extras

    with _cursor() as cur:
        cur.execute(
            """INSERT INTO voiceprints (user_id, feature_vector) VALUES (%s, %s)
               ON CONFLICT (user_id) DO UPDATE SET feature_vector = EXCLUDED.feature_vector""",
            (user_id, psycopg2.extras.Json(feature_vector)),
        )


def get_voiceprint(user_id: str) -> Optional[list[float]]:
    with _cursor() as cur:
        cur.execute("SELECT feature_vector FROM voiceprints WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
    return row[0] if row else None


_TX_COLUMNS = (
    "id, user_id, action, amount, recipient, recipient_account, confidence, state, "
    "created_at, face_verified, verification_method, bmoni_reference, bmoni_simulated, "
    "error, needs_clarification, expires_at"
)


def _row_to_transaction(row) -> TransactionRecord:
    return TransactionRecord(
        id=row[0], userId=row[1], action=row[2], amount=row[3], recipient=row[4],
        recipientAccount=row[5], confidence=row[6], state=row[7], createdAt=row[8],
        faceVerified=row[9], verificationMethod=row[10], bmoniReference=row[11],
        bmoniSimulated=row[12], error=row[13], needsClarification=row[14], expiresAt=row[15],
    )


def create_transaction(tx: TransactionRecord) -> None:
    with _cursor() as cur:
        cur.execute(
            f"INSERT INTO transactions ({_TX_COLUMNS}) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (tx.id, tx.userId, tx.action, tx.amount, tx.recipient, tx.recipientAccount,
             tx.confidence, tx.state, tx.createdAt, tx.faceVerified, tx.verificationMethod,
             tx.bmoniReference, tx.bmoniSimulated, tx.error, tx.needsClarification, tx.expiresAt),
        )


def get_transaction(tx_id: str) -> Optional[TransactionRecord]:
    with _cursor() as cur:
        cur.execute(f"SELECT {_TX_COLUMNS} FROM transactions WHERE id = %s", (tx_id,))
        row = cur.fetchone()
    return _row_to_transaction(row) if row else None


def update_transaction(tx: TransactionRecord) -> None:
    with _cursor() as cur:
        cur.execute(
            """UPDATE transactions SET action=%s, amount=%s, recipient=%s, recipient_account=%s,
               confidence=%s, state=%s, face_verified=%s, verification_method=%s,
               bmoni_reference=%s, bmoni_simulated=%s, error=%s, needs_clarification=%s,
               expires_at=%s WHERE id=%s""",
            (tx.action, tx.amount, tx.recipient, tx.recipientAccount, tx.confidence, tx.state,
             tx.faceVerified, tx.verificationMethod, tx.bmoniReference, tx.bmoniSimulated, tx.error,
             tx.needsClarification, tx.expiresAt, tx.id),
        )


_PATCH_TO_COLUMN = {
    "action": "action", "amount": "amount", "recipient": "recipient",
    "recipientAccount": "recipient_account", "confidence": "confidence", "state": "state",
    "faceVerified": "face_verified", "verificationMethod": "verification_method",
    "bmoniReference": "bmoni_reference", "bmoniSimulated": "bmoni_simulated",
    "error": "error", "needsClarification": "needs_clarification", "expiresAt": "expires_at",
}


def compare_and_set_transaction_state(tx_id: str, expected_state: str, **patch) -> Optional[TransactionRecord]:
    """Atomic claim: `UPDATE ... WHERE id = %s AND state = %s RETURNING ...`
    fails to match any row (and therefore returns None) if another
    request already moved the transaction out of expected_state, which
    is exactly the guarantee execute_transaction needs under concurrent
    requests hitting multiple app instances/connections."""
    columns = [_PATCH_TO_COLUMN[k] for k in patch if k in _PATCH_TO_COLUMN]
    values = [patch[k] for k in patch if k in _PATCH_TO_COLUMN]
    if not columns:
        columns, values = ["state"], [expected_state]
    set_clause = ", ".join(f"{col} = %s" for col in columns)
    with _cursor() as cur:
        cur.execute(
            f"UPDATE transactions SET {set_clause} WHERE id = %s AND state = %s RETURNING {_TX_COLUMNS}",
            (*values, tx_id, expected_state),
        )
        row = cur.fetchone()
    return _row_to_transaction(row) if row else None


def list_transactions(user_id: Optional[str] = None) -> list[TransactionRecord]:
    with _cursor() as cur:
        if user_id:
            cur.execute(f"SELECT {_TX_COLUMNS} FROM transactions WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        else:
            cur.execute(f"SELECT {_TX_COLUMNS} FROM transactions ORDER BY created_at DESC")
        rows = cur.fetchall()
    return [_row_to_transaction(r) for r in rows]


_AGENT_COLUMNS = "bmoni_user_id, bmoni_smart_wallet_id, bmoni_wallet_address, bmoni_withdrawal_account_id, bmoni_onboarded"


def get_agent_bmoni_profile() -> Optional[AgentBmoniProfile]:
    """None means no row has ever been written — distinct from a real,
    written-but-blank profile, so callers can tell "never onboarded" from
    "this table hasn't been touched yet" if that distinction ever matters."""
    with _cursor() as cur:
        cur.execute(f"SELECT {_AGENT_COLUMNS} FROM agent_bmoni_profile WHERE id = 1")
        row = cur.fetchone()
    if not row:
        return None
    return AgentBmoniProfile(
        bmoniUserId=row[0], bmoniSmartWalletId=row[1], bmoniWalletAddress=row[2],
        bmoniWithdrawalAccountId=row[3], bmoniOnboarded=row[4],
    )


def update_agent_bmoni_profile(profile: AgentBmoniProfile) -> None:
    with _cursor() as cur:
        cur.execute(
            f"""INSERT INTO agent_bmoni_profile (id, {_AGENT_COLUMNS}) VALUES (1, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO UPDATE SET
                 bmoni_user_id = EXCLUDED.bmoni_user_id,
                 bmoni_smart_wallet_id = EXCLUDED.bmoni_smart_wallet_id,
                 bmoni_wallet_address = EXCLUDED.bmoni_wallet_address,
                 bmoni_withdrawal_account_id = EXCLUDED.bmoni_withdrawal_account_id,
                 bmoni_onboarded = EXCLUDED.bmoni_onboarded""",
            (profile.bmoniUserId, profile.bmoniSmartWalletId, profile.bmoniWalletAddress,
             profile.bmoniWithdrawalAccountId, profile.bmoniOnboarded),
        )
