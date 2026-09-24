"""
Account and transaction storage: Postgres-backed when DATABASE_URL is
set (see db.py), in-memory dicts otherwise — every other module talks
only to these functions, never to storage directly, so callers never
need to know which mode is active.
"""

import random
from datetime import datetime, timezone
from typing import Optional

from app.models import Account, AgentBmoniProfile, Recipient, TransactionRecord
from app.services import db

accounts: dict[str, Account] = {
    "mama-aisha": Account(
        id="mama-aisha", name="Olawale Zainab", preferredLanguage="yo", balance=300000,
        cardNumber="5060 0000 0000 0001",
    )
}

accounts_by_card: dict[str, str] = {"5060000000000001": "mama-aisha"}

recipients: dict[str, Recipient] = {
    "adewale": Recipient(name="Adewale", account="0123456789"),
    "ngozi": Recipient(name="Ngozi", account="9876543210"),
    "ibrahim": Recipient(name="Ibrahim", account="1234567890"),
}

transactions: dict[str, TransactionRecord] = {}

# The POS agent's own BMONI identity — one profile shared platform-wide,
# never per-customer. See AgentBmoniProfile's docstring.
agent_bmoni_profile = AgentBmoniProfile()


def create_transaction_record(
    user_id: str,
    action: str,
    amount: Optional[int],
    recipient: Optional[str],
    confidence: Optional[float],
) -> TransactionRecord:
    tx_id = f"EP-{datetime.now(timezone.utc).year}-{random.randint(100000, 999999)}"
    record = TransactionRecord(
        id=tx_id,
        userId=user_id,
        action=action,
        amount=amount,
        recipient=recipient,
        confidence=confidence,
        state="INTENT_DETECTED",
        createdAt=datetime.now(timezone.utc).isoformat(),
        faceVerified=False,
        bmoniReference=None,
        error=None,
    )
    if db.is_ready():
        db.create_transaction(record)
    else:
        transactions[tx_id] = record
    return record


STARTING_BALANCE = 50000


def _normalize_card(card_number: str) -> str:
    return card_number.replace(" ", "").replace("-", "")


def _card_number_taken(normalized: str) -> bool:
    if db.is_ready():
        return db.get_account_by_card(normalized) is not None
    return normalized in accounts_by_card


def _generate_card_number() -> str:
    while True:
        digits = "".join(str(random.randint(0, 9)) for _ in range(12))
        normalized = "5060" + digits
        if not _card_number_taken(normalized):
            return " ".join(normalized[i:i + 4] for i in range(0, 16, 4))


def create_account(
    user_id: str, name: str, preferred_language: str, address: Optional[str] = None, email: Optional[str] = None
) -> Account:
    card_number = _generate_card_number()
    account = Account(
        id=user_id,
        name=name,
        preferredLanguage=preferred_language,
        balance=STARTING_BALANCE,
        address=address,
        email=email,
        cardNumber=card_number,
    )
    if db.is_ready():
        db.create_account(account)
    else:
        accounts[user_id] = account
        accounts_by_card[_normalize_card(card_number)] = user_id
    return account


def get_account(user_id: str) -> Optional[Account]:
    if db.is_ready():
        return db.get_account(user_id)
    return accounts.get(user_id)


def adjust_balance(user_id: str, delta: int) -> Optional[Account]:
    if db.is_ready():
        return db.adjust_balance(user_id, delta)
    account = accounts.get(user_id)
    if not account:
        return None
    updated = account.model_copy(update={"balance": account.balance + delta})
    accounts[user_id] = updated
    return updated


def get_agent_bmoni_profile() -> AgentBmoniProfile:
    if db.is_ready():
        return db.get_agent_bmoni_profile() or AgentBmoniProfile()
    return agent_bmoni_profile


def update_agent_bmoni_profile(**patch) -> AgentBmoniProfile:
    global agent_bmoni_profile
    updated = get_agent_bmoni_profile().model_copy(update=patch)
    if db.is_ready():
        db.update_agent_bmoni_profile(updated)
    else:
        agent_bmoni_profile = updated
    return updated


def get_account_by_card(card_number: str) -> Optional[Account]:
    normalized = _normalize_card(card_number)
    if db.is_ready():
        return db.get_account_by_card(normalized)
    user_id = accounts_by_card.get(normalized)
    return accounts.get(user_id) if user_id else None


def find_accounts_by_name(name: str) -> list[Account]:
    """Fallback lookup for customers who can't recall their card number —
    common among elderly users. Case-insensitive substring match against
    the name given at registration; may return multiple matches if
    several customers share a similar name."""
    query = name.strip().lower()
    if not query:
        return []
    if db.is_ready():
        return db.find_accounts_by_name(query)
    return [a for a in accounts.values() if query in a.name.lower()]


def find_recipient_by_account(account_number: str) -> Optional[tuple[str, Recipient]]:
    normalized = account_number.replace(" ", "").replace("-", "")
    for key, recipient in recipients.items():
        if recipient.account == normalized:
            return key, recipient
    return None


def get_transaction(tx_id: str) -> Optional[TransactionRecord]:
    if db.is_ready():
        return db.get_transaction(tx_id)
    return transactions.get(tx_id)


def update_transaction(tx_id: str, **patch) -> Optional[TransactionRecord]:
    existing = get_transaction(tx_id)
    if not existing:
        return None
    updated = existing.model_copy(update=patch)
    if db.is_ready():
        db.update_transaction(updated)
    else:
        transactions[tx_id] = updated
    return updated


def list_transactions(user_id: Optional[str] = None) -> list[TransactionRecord]:
    if db.is_ready():
        return db.list_transactions(user_id)
    all_tx = list(transactions.values())
    if user_id:
        all_tx = [t for t in all_tx if t.userId == user_id]
    return sorted(all_tx, key=lambda t: t.createdAt, reverse=True)
