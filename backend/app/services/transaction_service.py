"""
Explicit state machine. The AI only ever proposes an intent — every
transition is decided and validated here, server-side, never by the LLM
output directly. Mirrors transactionService.ts exactly so either backend
produces identical transaction behavior against the same frontend.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from app.models import AgentBmoniProfile, TransactionRecord
from app.services import bmoni_service, config, store
from app.services.bmoni_service import create_transfer

STATES = {
    "INTENT_DETECTED": "INTENT_DETECTED",
    "COLLECTING_DETAILS": "COLLECTING_DETAILS",
    "CONFIRMATION_REQUIRED": "CONFIRMATION_REQUIRED",
    "USER_CONFIRMED": "USER_CONFIRMED",
    "FACE_VERIFICATION_REQUIRED": "FACE_VERIFICATION_REQUIRED",
    "FACE_VERIFIED": "FACE_VERIFIED",
    "TRANSACTION_PROCESSING": "TRANSACTION_PROCESSING",
    "TRANSACTION_SUCCESS": "TRANSACTION_SUCCESS",
    "USER_CANCELLED": "USER_CANCELLED",
    "INVALID_AMOUNT": "INVALID_AMOUNT",
    "INSUFFICIENT_FUNDS": "INSUFFICIENT_FUNDS",
    "UNKNOWN_RECIPIENT": "UNKNOWN_RECIPIENT",
    "LOW_AI_CONFIDENCE": "LOW_AI_CONFIDENCE",
    "TRANSACTION_FAILED": "TRANSACTION_FAILED",
    "FACE_VERIFICATION_FAILED": "FACE_VERIFICATION_FAILED",
    "FACE_NOT_ENROLLED": "FACE_NOT_ENROLLED",
    "BMONI_API_ERROR": "BMONI_API_ERROR",
    "RECONCILIATION_REQUIRED": "RECONCILIATION_REQUIRED",
    "TRANSACTION_EXPIRED": "TRANSACTION_EXPIRED",
    "UNSUPPORTED_ACTION": "UNSUPPORTED_ACTION",
}

# Terminal/failure states a transaction can never leave. Used to reject
# arbitrary state jumps requested indirectly through the API (P1.14).
TERMINAL_STATES = {
    STATES["TRANSACTION_SUCCESS"], STATES["USER_CANCELLED"], STATES["INVALID_AMOUNT"],
    STATES["INSUFFICIENT_FUNDS"], STATES["TRANSACTION_FAILED"], STATES["TRANSACTION_EXPIRED"],
    STATES["UNSUPPORTED_ACTION"], STATES["BMONI_API_ERROR"], STATES["RECONCILIATION_REQUIRED"],
}

# Actions this backend actually implements end-to-end. "bill" is
# present in the AI's intent schema but has no implementation, so it
# must never be silently treated like a real transaction (P1.16).
SUPPORTED_ACTIONS = {"send", "balance", "withdraw", "deposit", "airtime"}

# Which actions settle on this app's own local ledger (a demo/sandbox
# operation) rather than a real external payment rail, for the
# purposes of receipt/UI labeling (P1.17, P1.18, P1.19). "withdraw" is
# the one action that *can* be real, depending on whether the POS
# agent's BMONI profile is onboarded — see execute_transaction.
ALWAYS_SIMULATED_ACTIONS = {"send", "deposit", "airtime"}

LOW_CONFIDENCE_THRESHOLD = 0.55


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _expiry_timestamp() -> str:
    return (_now() + timedelta(seconds=config.TRANSACTION_TTL_SECONDS)).isoformat()


def is_transaction_expired(tx: TransactionRecord) -> bool:
    if not tx.expiresAt:
        return False
    try:
        expires_at = datetime.fromisoformat(tx.expiresAt)
    except ValueError:
        return False
    return _now() > expires_at


def expire_transaction(tx_id: str) -> TransactionRecord:
    return store.update_transaction(tx_id, state=STATES["TRANSACTION_EXPIRED"], error="Transaction expired before it could proceed")


_expire = expire_transaction  # internal alias used throughout this module


def evaluate_intent(
    user_id: str,
    action: str,
    amount: Optional[int],
    recipient: Optional[str],
    confidence: Optional[float],
) -> TransactionRecord:
    if action not in SUPPORTED_ACTIONS:
        # Covers both the model's own "unknown" label and schema actions
        # (like "bill") that have no real implementation yet — never let
        # an unimplemented action fall through to transaction execution.
        record = store.create_transaction_record(user_id, action, amount, recipient, confidence)
        return store.update_transaction(record.id, state=STATES["UNSUPPORTED_ACTION"])

    if (confidence if confidence is not None else 1) < LOW_CONFIDENCE_THRESHOLD:
        record = store.create_transaction_record(user_id, action, amount, recipient, confidence)
        # Tell the caller which slot is unclear so the voice UI can ask
        # a targeted follow-up instead of a generic "please repeat"
        # (P1.15): no recipient at all -> ask about the action/recipient
        # generically via "recipient"; missing/invalid amount -> "amount".
        if action in ("send", "withdraw", "deposit", "airtime") and (not amount or amount <= 0):
            clarification = "amount"
        else:
            clarification = "recipient"
        return store.update_transaction(record.id, state=STATES["LOW_AI_CONFIDENCE"], needsClarification=clarification)

    if action in ("send", "withdraw", "deposit", "airtime"):
        if not amount or amount <= 0:
            record = store.create_transaction_record(user_id, action, amount, recipient, confidence)
            return store.update_transaction(record.id, state=STATES["INVALID_AMOUNT"])

    recipient_account: Optional[str] = None
    if action == "send":
        key = (recipient or "").lower().strip()
        if not key or key not in store.recipients:
            record = store.create_transaction_record(user_id, action, amount, recipient, confidence)
            return store.update_transaction(record.id, state=STATES["UNKNOWN_RECIPIENT"], needsClarification="accountNumber")
        recipient_account = store.recipients[key].account

    if action == "airtime":
        if not (recipient or "").strip():
            record = store.create_transaction_record(user_id, action, amount, recipient, confidence)
            return store.update_transaction(record.id, state=STATES["UNKNOWN_RECIPIENT"], needsClarification="recipient")

    if action in ("send", "withdraw", "airtime"):
        account = store.get_account(user_id)
        if account and amount and amount > account.balance:
            record = store.create_transaction_record(user_id, action, amount, recipient, confidence)
            return store.update_transaction(record.id, state=STATES["INSUFFICIENT_FUNDS"])

    record = store.create_transaction_record(user_id, action, amount, recipient, confidence)
    next_state = STATES["TRANSACTION_PROCESSING"] if action == "balance" else STATES["CONFIRMATION_REQUIRED"]
    patch = {"state": next_state, "recipientAccount": recipient_account}
    if next_state == STATES["CONFIRMATION_REQUIRED"]:
        patch["expiresAt"] = _expiry_timestamp()
    return store.update_transaction(record.id, **patch)


def resolve_agent_bmoni_user_id() -> str:
    """BMONI's bank-lookup endpoints (list_nigerian_banks, verify_nigerian_
    account) are path-scoped to a bmoniUserId, but this app never gives
    customers their own BMONI identity (see AgentBmoniProfile) — only the
    POS agent has one. So every such call is made under the agent's own
    bmoniUserId, regardless of which customer's transaction it's for.

    In BMONI's sandbox mock mode the id isn't actually checked (every
    mock branch ignores it), so an unconfigured agent doesn't block
    testing; in real mode, calling this before the agent is onboarded is
    a genuine setup error and should surface as one."""
    profile = store.get_agent_bmoni_profile()
    if profile.bmoniUserId:
        return profile.bmoniUserId
    if bmoni_service.is_mock_mode():
        return "sandbox-agent"
    raise RuntimeError("BMONI agent not onboarded yet — run POST /api/agent/bmoni-onboard first")


async def resolve_recipient_by_account(tx_id: str, account_number: str, bank_code: str) -> Optional[TransactionRecord]:
    """
    Real bank transfers don't match a spoken name against a contact list —
    they take an account number, look up the account holder via a real
    name-enquiry (BMONI's verify-nigerian-account), and only proceed once
    that identity is confirmed. This is the recovery path for a send
    whose recipient name wasn't recognized against the local contact
    book (store.recipients, kept as a fast path for the 3 seeded demo
    contacts — this covers everyone else).
    """
    tx = store.get_transaction(tx_id)
    if not tx:
        return None
    if is_transaction_expired(tx):
        return _expire(tx_id)
    if tx.state != STATES["UNKNOWN_RECIPIENT"]:
        return tx.model_copy(update={"error": f"Cannot resolve recipient from state {tx.state}"})

    try:
        agent_user_id = resolve_agent_bmoni_user_id()
        resolved = await bmoni_service.verify_nigerian_account(agent_user_id, bank_code, account_number)
    except Exception as err:
        return store.update_transaction(tx_id, error=f"ACCOUNT_NOT_FOUND: {err}")

    resolved_name = resolved["accountName"]

    account = store.get_account(tx.userId)
    if account and tx.amount and tx.amount > account.balance:
        return store.update_transaction(
            tx_id, state=STATES["INSUFFICIENT_FUNDS"], recipient=resolved_name,
            recipientAccount=account_number, needsClarification=None, error=None,
        )

    return store.update_transaction(
        tx_id, state=STATES["CONFIRMATION_REQUIRED"], recipient=resolved_name,
        recipientAccount=account_number, needsClarification=None, error=None,
        expiresAt=_expiry_timestamp(),
    )


def confirm_transaction(tx_id: str, voice_verified: bool = False) -> Optional[TransactionRecord]:
    """voice_verified=True skips the mandatory face check — only ever
    set by main.py after a transaction-time voice match clears the
    stricter TRANSACTION_THRESHOLD (see voice_auth.authorize_for_
    transaction), never by client-supplied intent alone."""
    tx = store.get_transaction(tx_id)
    if not tx:
        return None
    if is_transaction_expired(tx):
        return _expire(tx_id)
    if tx.state != STATES["CONFIRMATION_REQUIRED"]:
        return tx.model_copy(update={"error": f"Cannot confirm from state {tx.state}"})
    if voice_verified:
        return store.update_transaction(
            tx_id, state=STATES["FACE_VERIFIED"], faceVerified=True, verificationMethod="voice",
        )
    return store.update_transaction(tx_id, state=STATES["FACE_VERIFICATION_REQUIRED"])


def cancel_transaction(tx_id: str) -> Optional[TransactionRecord]:
    tx = store.get_transaction(tx_id)
    if not tx:
        return None
    if tx.state in TERMINAL_STATES:
        return tx.model_copy(update={"error": f"Cannot cancel a transaction already in terminal state {tx.state}"})
    return store.update_transaction(tx_id, state=STATES["USER_CANCELLED"])


def mark_face_not_enrolled(tx_id: str) -> Optional[TransactionRecord]:
    """Distinct outcome from FACE_VERIFICATION_FAILED: the account has
    no registered face at all, so there is nothing to compare against.
    Never accepted as an implicit pass (P0.1)."""
    tx = store.get_transaction(tx_id)
    if not tx:
        return None
    return store.update_transaction(tx_id, state=STATES["FACE_NOT_ENROLLED"])


def record_face_verification(tx_id: str, matched: bool) -> Optional[TransactionRecord]:
    tx = store.get_transaction(tx_id)
    if not tx:
        return None
    if is_transaction_expired(tx):
        return _expire(tx_id)
    if not matched:
        return store.update_transaction(tx_id, state=STATES["FACE_VERIFICATION_FAILED"])
    return store.update_transaction(tx_id, state=STATES["FACE_VERIFIED"], faceVerified=True, verificationMethod="face")


async def execute_transaction(tx_id: str) -> Optional[TransactionRecord]:
    """Idempotent AND concurrency-safe: calling this twice for the same
    transactionId never double-sends, even if both calls arrive at
    (almost) the same time. See store.compare_and_set_transaction_state
    for how the race is actually closed (P0 concurrency fix)."""
    tx = store.get_transaction(tx_id)
    if not tx:
        return None

    if tx.state == STATES["TRANSACTION_SUCCESS"]:
        return tx  # already executed — return the existing result, don't resend
    if tx.state == STATES["TRANSACTION_PROCESSING"]:
        # Another concurrent call already claimed this transaction and
        # is mid-flight; report rather than starting a second execution.
        return tx.model_copy(update={"error": "Transaction is already processing"})
    if is_transaction_expired(tx) and tx.state != STATES["FACE_VERIFIED"]:
        return _expire(tx_id)
    if tx.state != STATES["FACE_VERIFIED"]:
        return tx.model_copy(update={"error": f"Cannot execute from state {tx.state}"})
    if is_transaction_expired(tx):
        return _expire(tx_id)

    # Atomic claim: only the caller that wins this CAS proceeds to call
    # the external payment rail. A second concurrent caller here gets
    # None back and falls through to "already processing" below.
    claimed = store.compare_and_set_transaction_state(tx_id, STATES["FACE_VERIFIED"], state=STATES["TRANSACTION_PROCESSING"])
    if claimed is None:
        current = store.get_transaction(tx_id) or tx
        if current.state == STATES["TRANSACTION_SUCCESS"]:
            return current
        return current.model_copy(update={"error": "Transaction is already processing"})
    tx = claimed

    try:
        if tx.action == "withdraw":
            agent = store.get_agent_bmoni_profile()
            if agent.bmoniOnboarded and agent.bmoniSmartWalletId and agent.bmoniWithdrawalAccountId:
                reference = await _execute_real_nigeria_withdrawal(agent, tx.amount or 0)
                simulated = False
            else:
                result = await create_transfer(tx.amount, "self (withdrawal)")
                reference = result["reference"]
                simulated = True
            return _settle_local_ledger(tx_id, tx.userId, -(tx.amount or 0), reference, simulated)
        if tx.action in ("send", "airtime"):
            result = await create_transfer(tx.amount, tx.recipient or "self")
            return _settle_local_ledger(tx_id, tx.userId, -(tx.amount or 0), result["reference"], True)
        if tx.action == "deposit":
            result = await create_transfer(tx.amount, "self (deposit)")
            return _settle_local_ledger(tx_id, tx.userId, tx.amount or 0, result["reference"], True)
        return store.update_transaction(tx_id, state=STATES["TRANSACTION_SUCCESS"])
    except Exception as err:
        return store.update_transaction(tx_id, state=STATES["BMONI_API_ERROR"], error=str(err))


def _settle_local_ledger(tx_id: str, user_id: str, balance_delta: int, reference: str, simulated: bool) -> TransactionRecord:
    """Runs after the external payment rail has already succeeded. If
    the local balance adjustment can't be applied, we must NOT report a
    normal success (that would mean real/simulated money moved but the
    customer's own ledger disagrees) — mark RECONCILIATION_REQUIRED
    instead so an operator/alert can reconcile it (P0 external/local
    consistency fix)."""
    try:
        updated_account = store.adjust_balance(user_id, balance_delta)
        if updated_account is None:
            raise RuntimeError(f"account {user_id} not found while settling local ledger")
    except Exception as err:
        return store.update_transaction(
            tx_id, state=STATES["RECONCILIATION_REQUIRED"], bmoniReference=reference, bmoniSimulated=simulated,
            error=f"External operation succeeded (ref={reference}) but local balance update failed: {err}",
        )
    return store.update_transaction(
        tx_id, state=STATES["TRANSACTION_SUCCESS"], bmoniReference=reference, bmoniSimulated=simulated,
    )


async def _execute_real_nigeria_withdrawal(agent: AgentBmoniProfile, amount: int) -> str:
    """Real money movement: initiates the BMONI offramp proposal against
    the POS agent's own onboarded wallet (never the customer's — see
    AgentBmoniProfile), signs the EIP-712 payload with our owner key,
    submits it, and returns the proposal ID as the receipt reference.
    The customer's local ledger balance is adjusted separately by the
    caller — this only represents the agent's own real cash-out."""
    initiated = await bmoni_service.initiate_nigeria_withdrawal(
        agent.bmoniUserId, agent.bmoniSmartWalletId, agent.bmoniWithdrawalAccountId, f"{amount:.2f}"
    )
    if initiated.get("signPayloadPending"):
        raise RuntimeError("BMONI withdrawal sign payload not ready yet — retry shortly")
    signature = bmoni_service.sign_withdrawal_payload(initiated["signPayload"])
    await bmoni_service.submit_proposal_signature(agent.bmoniUserId, initiated["proposalId"], signature)
    return initiated["proposalId"]


def get_account_balance(user_id: str) -> Optional[int]:
    account = store.get_account(user_id)
    return account.balance if account else None
