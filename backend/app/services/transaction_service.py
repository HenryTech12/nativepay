"""
Explicit state machine. The AI only ever proposes an intent — every
transition is decided and validated here, server-side, never by the LLM
output directly. Mirrors transactionService.ts exactly so either backend
produces identical transaction behavior against the same frontend.
"""

from typing import Optional

from app.models import AgentBmoniProfile, TransactionRecord
from app.services import bmoni_service, paystack_service, store
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
    "BMONI_API_ERROR": "BMONI_API_ERROR",
}

LOW_CONFIDENCE_THRESHOLD = 0.55


def evaluate_intent(
    user_id: str,
    action: str,
    amount: Optional[int],
    recipient: Optional[str],
    confidence: Optional[float],
) -> TransactionRecord:
    if (confidence if confidence is not None else 1) < LOW_CONFIDENCE_THRESHOLD:
        record = store.create_transaction_record(user_id, action, amount, recipient, confidence)
        return store.update_transaction(record.id, state=STATES["LOW_AI_CONFIDENCE"], needsClarification="recipient")

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
    return store.update_transaction(record.id, state=next_state, recipientAccount=recipient_account)


async def resolve_recipient_by_account(tx_id: str, account_number: str, bank_code: str) -> Optional[TransactionRecord]:
    """
    Real bank transfers don't match a spoken name against a contact list —
    they take an account number, look up the account holder via a real
    name-enquiry (Paystack's resolve-account API), and only proceed once
    that identity is confirmed. This is the recovery path for a send
    whose recipient name wasn't recognized against the local contact
    book (store.recipients, kept as a fast path for the 3 seeded demo
    contacts — this covers everyone else).
    """
    tx = store.get_transaction(tx_id)
    if not tx:
        return None
    if tx.state != STATES["UNKNOWN_RECIPIENT"]:
        return tx.model_copy(update={"error": f"Cannot resolve recipient from state {tx.state}"})

    try:
        resolved = await paystack_service.resolve_account(account_number, bank_code)
    except Exception as err:
        return store.update_transaction(tx_id, error=f"ACCOUNT_NOT_FOUND: {err}")

    resolved_name = resolved["account_name"]

    account = store.get_account(tx.userId)
    if account and tx.amount and tx.amount > account.balance:
        return store.update_transaction(
            tx_id, state=STATES["INSUFFICIENT_FUNDS"], recipient=resolved_name,
            recipientAccount=account_number, needsClarification=None, error=None,
        )

    return store.update_transaction(
        tx_id, state=STATES["CONFIRMATION_REQUIRED"], recipient=resolved_name,
        recipientAccount=account_number, needsClarification=None, error=None,
    )


def confirm_transaction(tx_id: str, voice_verified: bool = False) -> Optional[TransactionRecord]:
    """voice_verified=True skips the mandatory face check — only ever
    set by main.py after a transaction-time voice match clears the
    stricter TRANSACTION_THRESHOLD (see voice_auth.authorize_for_
    transaction), never by client-supplied intent alone."""
    tx = store.get_transaction(tx_id)
    if not tx:
        return None
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
    return store.update_transaction(tx_id, state=STATES["USER_CANCELLED"])


def record_face_verification(tx_id: str, matched: bool) -> Optional[TransactionRecord]:
    tx = store.get_transaction(tx_id)
    if not tx:
        return None
    if not matched:
        return store.update_transaction(tx_id, state=STATES["FACE_VERIFICATION_FAILED"])
    return store.update_transaction(tx_id, state=STATES["FACE_VERIFIED"], faceVerified=True, verificationMethod="face")


async def execute_transaction(tx_id: str) -> Optional[TransactionRecord]:
    """Idempotent: calling this twice for the same transactionId never double-sends."""
    tx = store.get_transaction(tx_id)
    if not tx:
        return None

    if tx.state == STATES["TRANSACTION_SUCCESS"]:
        return tx  # already executed — return the existing result, don't resend
    if tx.state != STATES["FACE_VERIFIED"]:
        return tx.model_copy(update={"error": f"Cannot execute from state {tx.state}"})

    store.update_transaction(tx_id, state=STATES["TRANSACTION_PROCESSING"])

    try:
        if tx.action == "withdraw":
            agent = store.get_agent_bmoni_profile()
            if agent.bmoniOnboarded and agent.bmoniSmartWalletId and agent.bmoniWithdrawalAccountId:
                reference = await _execute_real_nigeria_withdrawal(agent, tx.amount or 0)
            else:
                result = await create_transfer(tx.amount, "self (withdrawal)")
                reference = result["reference"]
            store.adjust_balance(tx.userId, -(tx.amount or 0))
            return store.update_transaction(tx_id, state=STATES["TRANSACTION_SUCCESS"], bmoniReference=reference)
        if tx.action in ("send", "airtime"):
            result = await create_transfer(tx.amount, tx.recipient or "self")
            store.adjust_balance(tx.userId, -(tx.amount or 0))
            return store.update_transaction(tx_id, state=STATES["TRANSACTION_SUCCESS"], bmoniReference=result["reference"])
        if tx.action == "deposit":
            result = await create_transfer(tx.amount, "self (deposit)")
            store.adjust_balance(tx.userId, tx.amount or 0)
            return store.update_transaction(tx_id, state=STATES["TRANSACTION_SUCCESS"], bmoniReference=result["reference"])
        return store.update_transaction(tx_id, state=STATES["TRANSACTION_SUCCESS"])
    except Exception as err:
        return store.update_transaction(tx_id, state=STATES["BMONI_API_ERROR"], error=str(err))


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
