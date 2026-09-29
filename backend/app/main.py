import logging
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services import ai_provider, bmoni_service, config, db, face_auth, sessions, store, transaction_service, voice_auth, yarngpt_service
from app.services.languages import supported_languages
from app.services.transaction_service import STATES

logger = logging.getLogger("nativepay")

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # In development/tests: no-op if DATABASE_URL isn't set, falls back
    # to in-memory storage on failure. In production: raises and the
    # process fails to start rather than silently running on in-memory
    # storage (db.DatabaseUnavailableError, see db.init_schema).
    db.init_schema()
    yield


app = FastAPI(title="NativePay API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # In production this MUST be the deployed frontend origin — set
    # FRONTEND_ORIGIN. "*" is only used when it's unset, which is
    # refused entirely once ENVIRONMENT=production (see below).
    allow_origins=[config.FRONTEND_ORIGIN] if config.FRONTEND_ORIGIN else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if config.IS_PRODUCTION and not config.FRONTEND_ORIGIN:
    raise RuntimeError("ENVIRONMENT=production requires FRONTEND_ORIGIN to be set — refusing to start with CORS open to '*'.")


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "environment": config.ENVIRONMENT,
        "demoMode": not config.IS_PRODUCTION,
        "bmoniMockMode": bmoni_service.is_mock_mode(),
        "aiProvider": ai_provider.active_provider(),
        "ttsProvider": "yarngpt" if yarngpt_service.is_configured() else None,
        "yarngptConfigured": yarngpt_service.is_configured(),
        "dbConnected": db.is_ready(),
        "authRequired": config.REQUIRE_AUTH,
    }


def get_session_user(x_session_token: Optional[str] = Header(default=None)) -> Optional[str]:
    """Best-effort session lookup — returns None if there's no/invalid
    token. Whether that's acceptable is decided per-endpoint by
    `require_owner`, so this stays usable both when REQUIRE_AUTH is on
    and off."""
    return sessions.get_session_user(x_session_token)


def require_owner(resource_user_id: Optional[str], session_user: Optional[str]) -> None:
    """Enforces that the authenticated session belongs to the account/
    transaction being accessed (P0.7 — stop 'knowing an id' from being
    enough to read someone else's data). No-op when REQUIRE_AUTH is off,
    which keeps local dev and the existing test-suite/frontend working
    without standing up a login flow first."""
    if not config.REQUIRE_AUTH:
        return
    if not session_user:
        raise HTTPException(status_code=401, detail={"error": "SESSION_REQUIRED"})
    if resource_user_id is not None and session_user != resource_user_id:
        raise HTTPException(status_code=403, detail={"error": "FORBIDDEN"})


def require_agent(x_agent_key: Optional[str] = Header(default=None)) -> None:
    """Guards agent/POS-only and BMONI-admin endpoints with a shared
    secret. No-op unless AGENT_API_KEY is configured, so this doesn't
    change behavior for the existing hackathon deployment until an
    operator opts in."""
    if config.AGENT_API_KEY and x_agent_key != config.AGENT_API_KEY:
        raise HTTPException(status_code=401, detail={"error": "AGENT_KEY_REQUIRED"})


class SessionStartBody(BaseModel):
    userId: str
    faceDescriptor: list[float]


@app.post("/api/session/start")
def session_start(body: SessionStartBody):
    """Customer session authentication (P0.7): a real face match is the
    only way to obtain a session token. Every session-scoped endpoint
    below requires this token once REQUIRE_AUTH is enabled."""
    account = store.get_account(body.userId)
    if not account:
        raise HTTPException(status_code=404, detail={"error": "ACCOUNT_NOT_FOUND"})
    try:
        result = face_auth.authorize_by_face(body.userId, body.faceDescriptor)
    except face_auth.InvalidDescriptorError as err:
        raise HTTPException(status_code=400, detail={"error": "INVALID_FACE_DESCRIPTOR", "message": str(err)})
    if not result["authorized"]:
        raise HTTPException(status_code=401, detail={"error": "FACE_VERIFICATION_FAILED", **result})
    token = sessions.create_session(body.userId)
    return {"sessionToken": token, "account": account}


@app.get("/api/languages")
def languages():
    return supported_languages()


class TtsBody(BaseModel):
    text: str
    language: str = "en"


@app.post("/api/tts")
async def tts(body: TtsBody):
    try:
        audio = await yarngpt_service.synthesize_speech(body.text, body.language)
        return Response(content=audio, media_type="audio/mpeg")
    except Exception as err:
        logger.error("tts failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "TTS_UNAVAILABLE", "message": str(err)})


@app.post("/api/voice/process")
async def voice_process(audio: UploadFile = File(...), language: Optional[str] = Form(None)):
    try:
        audio_bytes = await audio.read()
        text = await ai_provider.transcribe_audio(audio_bytes, audio.filename, language)
        intent = await ai_provider.parse_intent(text, language)
        return {"text": text, "intent": intent.model_dump()}
    except Exception as err:
        logger.error("voice_process failed: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "NETWORK_ERROR", "message": str(err)})


@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...), language: Optional[str] = Form(None)):
    try:
        audio_bytes = await audio.read()
        text = await ai_provider.transcribe_audio(audio_bytes, audio.filename, language)
        return {"text": text}
    except Exception as err:
        logger.error("transcribe failed: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "NETWORK_ERROR", "message": str(err)})


class IntentTextBody(BaseModel):
    text: str
    language: Optional[str] = None


@app.post("/api/ai/intent")
async def ai_intent(body: IntentTextBody):
    try:
        return (await ai_provider.parse_intent(body.text, body.language)).model_dump()
    except Exception as err:
        logger.error("ai_intent failed: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "NETWORK_ERROR", "message": str(err)})


class ConfirmBody(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    action: Optional[str] = None
    amount: Optional[int] = None
    recipient: Optional[str] = None
    confidence: Optional[float] = None
    voiceFeatureVector: Optional[list[float]] = None


@app.post("/api/transactions/confirm")
def transactions_confirm(body: ConfirmBody, session_user: Optional[str] = Depends(get_session_user)):
    if not body.id:
        if not body.userId:
            raise HTTPException(status_code=400, detail={"error": "USER_ID_REQUIRED"})
        require_owner(body.userId, session_user)
        evaluated = transaction_service.evaluate_intent(
            user_id=body.userId,
            action=body.action or "unknown",
            amount=body.amount,
            recipient=body.recipient,
            confidence=body.confidence,
        )
        return evaluated

    existing = store.get_transaction(body.id)
    if not existing:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    require_owner(existing.userId, session_user)
    if transaction_service.is_transaction_expired(existing):
        return transaction_service.expire_transaction(body.id)
    if existing.state != STATES["CONFIRMATION_REQUIRED"]:
        raise HTTPException(status_code=409, detail={"error": "INVALID_STATE", "state": existing.state})

    voice_verified = False
    if body.voiceFeatureVector:
        result = voice_auth.authorize_for_transaction(existing.userId, body.voiceFeatureVector)
        voice_verified = result["authorized"]
    return transaction_service.confirm_transaction(body.id, voice_verified=voice_verified)


@app.post("/api/transactions/{tx_id}/cancel")
def transactions_cancel(tx_id: str, session_user: Optional[str] = Depends(get_session_user)):
    existing = store.get_transaction(tx_id)
    if not existing:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    require_owner(existing.userId, session_user)
    result = transaction_service.cancel_transaction(tx_id)
    if not result:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    return result


class VerifyFaceBody(BaseModel):
    id: str
    faceDescriptor: Optional[list[float]] = None
    # Only ever honored for accounts with no registered face descriptor,
    # AND only outside production (config.ALLOW_CLIENT_FACE_FALLBACK) —
    # never a substitute for a real descriptor comparison. See
    # transactions_verify_face below. (P0.1 fix: this used to be
    # trusted whenever no descriptor was supplied, regardless of
    # whether the account actually had a registered face.)
    matched: bool = False


@app.get("/api/banks")
async def banks():
    """Nigerian bank list for the recipient-lookup UI — BMONI's sandbox
    list in mock mode, its real bank-account service otherwise. Scoped
    under the POS agent's own bmoniUserId (see
    transaction_service.resolve_agent_bmoni_user_id); customers never
    have a BMONI identity of their own.

    Normalized to {code, name} here (rather than BMONI's own
    {bankCode, bankName}) so the frontend's existing Bank type/rendering
    — written against Paystack's shape — doesn't need to change."""
    try:
        agent_user_id = transaction_service.resolve_agent_bmoni_user_id()
        result = await bmoni_service.list_nigerian_banks(agent_user_id)
        raw_banks = result.get("banks", result) if isinstance(result, dict) else result
        return [{"code": b.get("bankCode"), "name": b.get("bankName")} for b in raw_banks]
    except Exception as err:
        logger.error("banks failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BANKS_UNAVAILABLE", "message": str(err)})


@app.get("/api/verify-account")
async def verify_account(accountNumber: str, bankCode: str):
    """Standalone test/utility endpoint — resolves an account directly,
    with no transaction required. What resolve-recipient calls internally."""
    try:
        agent_user_id = transaction_service.resolve_agent_bmoni_user_id()
        return await bmoni_service.verify_nigerian_account(agent_user_id, bankCode, accountNumber)
    except Exception as err:
        logger.error("verify_account failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "ACCOUNT_NOT_FOUND", "message": str(err)})


class ResolveRecipientBody(BaseModel):
    id: str
    accountNumber: str
    bankCode: str


@app.post("/api/transactions/resolve-recipient")
async def transactions_resolve_recipient(body: ResolveRecipientBody, session_user: Optional[str] = Depends(get_session_user)):
    existing = store.get_transaction(body.id)
    if not existing:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    require_owner(existing.userId, session_user)
    result = await transaction_service.resolve_recipient_by_account(body.id, body.accountNumber, body.bankCode)
    if not result:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    return result


@app.post("/api/transactions/verify-face")
def transactions_verify_face(body: VerifyFaceBody, session_user: Optional[str] = Depends(get_session_user)):
    """Server-side verification is mandatory whenever the account has a
    registered face descriptor — a client-asserted `matched` is never
    trusted in that case, and a client that omits the descriptor while
    a real one is on file is rejected outright rather than silently
    treated as a non-match (P0.1 fix).

    The `matched` fallback is reachable only when BOTH: (a) the account
    genuinely has no registered face (e.g. legacy/demo accounts
    predating this feature), AND (b) ENVIRONMENT != production. In
    production this path is unavailable regardless of the account's
    enrollment state — see config.ALLOW_CLIENT_FACE_FALLBACK."""
    existing = store.get_transaction(body.id)
    if not existing:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    require_owner(existing.userId, session_user)
    if transaction_service.is_transaction_expired(existing):
        return transaction_service.expire_transaction(body.id)

    if config.DEMO_FACE_ALWAYS_PASS:
        # DEMO-ONLY: bypasses real comparison entirely. See config.py.
        logger.warning(
            "DEMO_FACE_ALWAYS_PASS is on — accepting face verification for "
            "tx %s without checking it. Do not ship this beyond the demo.",
            body.id,
        )
        return transaction_service.record_face_verification(body.id, True)

    if body.faceDescriptor:
        try:
            result = face_auth.authorize_by_face(existing.userId, body.faceDescriptor)
        except face_auth.InvalidDescriptorError as err:
            raise HTTPException(status_code=400, detail={"error": "INVALID_FACE_DESCRIPTOR", "message": str(err)})
        return transaction_service.record_face_verification(body.id, result["authorized"])

    if face_auth.has_face(existing.userId):
        raise HTTPException(status_code=400, detail={"error": "FACE_DESCRIPTOR_REQUIRED"})

    if config.ALLOW_CLIENT_FACE_FALLBACK:
        return transaction_service.record_face_verification(body.id, body.matched)

    return transaction_service.mark_face_not_enrolled(body.id)


class SendBody(BaseModel):
    id: str


@app.post("/api/transactions/send")
async def transactions_send(body: SendBody, session_user: Optional[str] = Depends(get_session_user)):
    existing = store.get_transaction(body.id)
    if not existing:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    require_owner(existing.userId, session_user)
    try:
        result = await transaction_service.execute_transaction(body.id)
        if not result:
            raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
        return result
    except HTTPException:
        raise
    except Exception as err:
        logger.error("transactions_send failed: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/transactions")
def transactions_list(
    userId: Optional[str] = None,
    session_user: Optional[str] = Depends(get_session_user),
    _agent: None = Depends(require_agent),
):
    if userId:
        require_owner(userId, session_user)
    elif config.REQUIRE_AUTH:
        # Listing every transaction platform-wide with no userId filter
        # is an agent/admin operation, not a customer one — require_agent
        # above already checked the shared secret if one is configured.
        raise HTTPException(status_code=400, detail={"error": "USER_ID_REQUIRED"})
    return store.list_transactions(userId)


@app.get("/api/transactions/{tx_id}")
def transactions_get(tx_id: str, session_user: Optional[str] = Depends(get_session_user)):
    tx = store.get_transaction(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    require_owner(tx.userId, session_user)
    return tx


@app.get("/api/transactions/{tx_id}/receipt")
def transactions_receipt(tx_id: str, session_user: Optional[str] = Depends(get_session_user)):
    tx = store.get_transaction(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    require_owner(tx.userId, session_user)
    if tx.state != STATES["TRANSACTION_SUCCESS"]:
        raise HTTPException(status_code=409, detail={"error": "RECEIPT_NOT_AVAILABLE", "state": tx.state})
    return bmoni_service.generate_receipt(tx)


# These /api/bmoni/users/{user_id}/* routes are granular testing utilities
# over the raw BMONI API — the user_id you pass is the BMONI-side
# bmoniUserId, not an NativePay customer id. In this app that identity
# always belongs to the POS agent/platform (see AgentBmoniProfile),
# never to an individual customer. Prefer /api/agent/bmoni-onboard below
# for the actual one-time setup; these stay for testing individual steps.


@app.post("/api/bmoni/generate-owner-wallet", dependencies=[Depends(require_agent)])
def bmoni_generate_owner_wallet():
    """One-time setup helper — generates an EVM keypair for the
    self-custodied smart-wallet owner. Save privateKey as
    BMONI_OWNER_PRIVATE_KEY in .env, then never call this again."""
    return bmoni_service.generate_owner_wallet()


@app.get("/api/bmoni/owner-address", dependencies=[Depends(require_agent)])
def bmoni_owner_address():
    """Public address derived from the currently configured
    BMONI_OWNER_PRIVATE_KEY — diagnostic only, never exposes the key
    itself. Compare against a wallet's registered owner address (from
    GET /api/bmoni/users/{user_id}/wallets) to catch a mismatch between
    the key this deployment currently signs with and the key a given
    wallet was actually created with."""
    return bmoni_service.get_owner_address()


class BmoniCreateUserBody(BaseModel):
    firstName: str
    email: str
    phoneNumber: str
    bvn: Optional[str] = None


@app.post("/api/bmoni/users", dependencies=[Depends(require_agent)])
async def bmoni_create_user(body: BmoniCreateUserBody):
    """Self-healing on a 409 conflict: recovers the existing bmoniUserId
    via list_users instead of failing, since a conflict here usually
    means a prior attempt's response was lost (e.g. a gateway timeout)
    even though BMONI's side actually created the user."""
    try:
        return await bmoni_service.create_user(body.firstName, body.email, body.phoneNumber, body.bvn)
    except Exception as err:
        logger.error("bmoni_create_user failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users", dependencies=[Depends(require_agent)])
async def bmoni_list_users(page: int = 1, limit: int = 100):
    try:
        return await bmoni_service.list_users(page, limit)
    except Exception as err:
        logger.error("bmoni_list_users failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.post("/api/bmoni/users/{user_id}/wallet", dependencies=[Depends(require_agent)])
async def bmoni_create_wallet(user_id: str):
    try:
        return await bmoni_service.create_smart_wallet(user_id)
    except Exception as err:
        logger.error("bmoni_create_wallet failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


class BmoniKycBody(BaseModel):
    firstName: str
    phoneNumber: str
    bvn: str = bmoni_service.SANDBOX_TEST_BVN


@app.post("/api/bmoni/users/{user_id}/kyc", dependencies=[Depends(require_agent)])
async def bmoni_submit_kyc(user_id: str, body: BmoniKycBody):
    try:
        return await bmoni_service.submit_kyc(user_id, body.firstName, body.phoneNumber, body.bvn)
    except Exception as err:
        logger.error("bmoni_submit_kyc failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/onboarding-status", dependencies=[Depends(require_agent)])
async def bmoni_onboarding_status(user_id: str):
    try:
        return await bmoni_service.get_onboarding_status(user_id)
    except Exception as err:
        logger.error("bmoni_onboarding_status failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


class BmoniActivateBody(BaseModel):
    ngnWalletAddress: str
    ngnWalletIndex: int = 0
    bvn: str = bmoni_service.SANDBOX_TEST_BVN


@app.post("/api/bmoni/users/{user_id}/activate-nigeria", dependencies=[Depends(require_agent)])
async def bmoni_activate_nigeria(user_id: str, body: BmoniActivateBody):
    try:
        return await bmoni_service.activate_nigeria_rail(user_id, body.ngnWalletAddress, body.ngnWalletIndex, body.bvn)
    except Exception as err:
        logger.error("bmoni_activate_nigeria failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/wallets", dependencies=[Depends(require_agent)])
async def bmoni_get_wallets(user_id: str):
    try:
        return await bmoni_service.get_wallets(user_id)
    except Exception as err:
        logger.error("bmoni_get_wallets failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/real-balances", dependencies=[Depends(require_agent)])
async def bmoni_get_real_balances(user_id: str):
    try:
        return await bmoni_service.get_real_balances(user_id)
    except Exception as err:
        logger.error("bmoni_get_real_balances failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/wallets/{smart_wallet_id}/real-transactions", dependencies=[Depends(require_agent)])
async def bmoni_get_real_transactions(user_id: str, smart_wallet_id: str):
    try:
        return await bmoni_service.get_real_transactions(user_id, smart_wallet_id)
    except Exception as err:
        logger.error("bmoni_get_real_transactions failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/nigerian-banks", dependencies=[Depends(require_agent)])
async def bmoni_list_nigerian_banks(user_id: str):
    try:
        return await bmoni_service.list_nigerian_banks(user_id)
    except Exception as err:
        logger.error("bmoni_list_nigerian_banks failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


class BmoniVerifyAccountBody(BaseModel):
    bankCode: str
    accountNumber: str


@app.post("/api/bmoni/users/{user_id}/verify-nigerian-account", dependencies=[Depends(require_agent)])
async def bmoni_verify_nigerian_account(user_id: str, body: BmoniVerifyAccountBody):
    try:
        return await bmoni_service.verify_nigerian_account(user_id, body.bankCode, body.accountNumber)
    except Exception as err:
        logger.error("bmoni_verify_nigerian_account failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


class BmoniWithdrawalAccountBody(BaseModel):
    accountNumber: str
    bankCode: str
    bankName: str
    accountHolderName: str


@app.post("/api/bmoni/users/{user_id}/withdrawal-account", dependencies=[Depends(require_agent)])
async def bmoni_create_withdrawal_account(user_id: str, body: BmoniWithdrawalAccountBody):
    try:
        return await bmoni_service.create_withdrawal_account(
            user_id, body.accountNumber, body.bankCode, body.bankName, body.accountHolderName
        )
    except Exception as err:
        logger.error("bmoni_create_withdrawal_account failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


class BmoniInitiateWithdrawalBody(BaseModel):
    sourceSmartWalletId: str
    bankAccountId: str
    fromAmount: str


@app.post("/api/bmoni/users/{user_id}/withdraw-nigeria/initiate-only", dependencies=[Depends(require_agent)])
async def bmoni_initiate_withdrawal_only(user_id: str, body: BmoniInitiateWithdrawalBody):
    """Debug-only: creates the offramp proposal but does not sign or
    submit it, so the raw signPayload can be inspected directly — the
    full round trip lives at /withdraw-nigeria below. Doesn't move any
    money; a proposal left unsigned just stays pending."""
    try:
        return await bmoni_service.initiate_nigeria_withdrawal(
            user_id, body.sourceSmartWalletId, body.bankAccountId, body.fromAmount
        )
    except Exception as err:
        logger.error("bmoni_initiate_withdrawal_only failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.post("/api/bmoni/users/{user_id}/withdraw-nigeria", dependencies=[Depends(require_agent)])
async def bmoni_initiate_withdrawal(user_id: str, body: BmoniInitiateWithdrawalBody):
    """Initiates the offramp proposal, signs the returned EIP-712 payload
    with our owner key, and submits the signature — a full round trip of
    the real BMONI withdrawal flow in one call."""
    try:
        initiated = await bmoni_service.initiate_nigeria_withdrawal(
            user_id, body.sourceSmartWalletId, body.bankAccountId, body.fromAmount
        )
        if bmoni_service.is_mock_mode() or initiated.get("signPayloadPending"):
            return initiated
        signature = bmoni_service.sign_withdrawal_payload(initiated["signPayload"])
        return await bmoni_service.submit_proposal_signature(user_id, initiated["proposalId"], signature)
    except Exception as err:
        logger.error("bmoni_initiate_withdrawal failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


class AgentBmoniOnboardBody(BaseModel):
    firstName: str
    email: str
    phoneNumber: str
    bvn: str = bmoni_service.SANDBOX_TEST_BVN
    bankAccountNumber: Optional[str] = None
    bankCode: Optional[str] = None


@app.post("/api/agent/bmoni-onboard", dependencies=[Depends(require_agent)])
async def agent_bmoni_onboard(body: AgentBmoniOnboardBody):
    """One-time setup for the POS agent's own BMONI identity — run this
    once (e.g. right before the live demo), not per customer. Customers
    never onboard onto BMONI themselves; every customer action stays on
    this app's local ledger (see app.services.store.accounts), and only
    the agent's own wallet moves real money through BMONI.

    Idempotent per stage: re-calling this after the user/wallet/KYC/rail
    stage already succeeded skips straight to (re)attempting bank-account
    linking if bankAccountNumber/bankCode are supplied and no withdrawal
    account is linked yet -- so a failed bank link can be retried without
    redoing the whole chain."""
    profile = store.get_agent_bmoni_profile()

    if not profile.bmoniOnboarded:
        try:
            identifiers = await bmoni_service.onboard_full(body.firstName, body.email, body.phoneNumber, body.bvn)
        except Exception as err:
            logger.error("agent bmoni onboarding failed: %s", err, exc_info=True)
            raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})
        profile = store.update_agent_bmoni_profile(**identifiers, bmoniOnboarded=True)

    bank_link_error = None
    if body.bankAccountNumber and body.bankCode and not profile.bmoniWithdrawalAccountId:
        try:
            withdrawal_account = await bmoni_service.link_nigerian_bank_account(
                profile.bmoniUserId, body.bankAccountNumber, body.bankCode
            )
            profile = store.update_agent_bmoni_profile(bmoniWithdrawalAccountId=withdrawal_account["id"])
        except Exception as err:
            logger.error("agent bank-account linking failed: %s", err, exc_info=True)
            bank_link_error = str(err)

    return {**profile.model_dump(), "bankLinkError": bank_link_error}


@app.get("/api/agent/bmoni-status", dependencies=[Depends(require_agent)])
def agent_bmoni_status():
    return store.get_agent_bmoni_profile()


class AgentBmoniRestoreBody(BaseModel):
    bmoniUserId: str
    bmoniSmartWalletId: str
    bmoniWalletAddress: str
    bmoniWithdrawalAccountId: Optional[str] = None
    bmoniOnboarded: bool = True


@app.post("/api/agent/bmoni-restore", dependencies=[Depends(require_agent)])
def agent_bmoni_restore(body: AgentBmoniRestoreBody):
    """Manually re-point this app's local record of the agent's BMONI
    identity at a known-good one — recovery path for when that record
    was lost locally (e.g. an in-memory profile wiped by a process
    restart before persistence was added) even though the identity
    still legitimately exists and is funded on BMONI's own side. Does
    not call BMONI's API; only corrects this app's own bookkeeping."""
    return store.update_agent_bmoni_profile(**body.model_dump())


@app.get("/api/accounts/{account_id}/balance")
def accounts_balance(account_id: str, session_user: Optional[str] = Depends(get_session_user)):
    require_owner(account_id, session_user)
    balance = transaction_service.get_account_balance(account_id)
    if balance is None:
        raise HTTPException(status_code=404, detail={"error": "ACCOUNT_NOT_FOUND"})
    return {"accountId": account_id, "balance": balance, "currency": "NGN"}


class AccountRegisterBody(BaseModel):
    userId: str
    fullName: str
    address: str
    email: Optional[str] = None
    language: str


@app.post("/api/accounts/register", dependencies=[Depends(require_agent)])
def accounts_register(body: AccountRegisterBody):
    if store.get_account(body.userId):
        raise HTTPException(status_code=409, detail={"error": "ACCOUNT_EXISTS"})
    account = store.create_account(body.userId, body.fullName, body.language, body.address, body.email or None)
    return account


@app.get("/api/accounts/by-card/{card_number}", dependencies=[Depends(require_agent)])
def accounts_get_by_card(card_number: str):
    """Pre-session identification step (customer hasn't verified their
    face yet, so there's no session token to require) — the shared
    agent key still gates it against being called by an arbitrary
    internet client when AGENT_API_KEY is configured."""
    account = store.get_account_by_card(card_number)
    if not account:
        raise HTTPException(status_code=404, detail={"error": "CARD_NOT_RECOGNIZED"})
    return account


@app.get("/api/accounts/search", dependencies=[Depends(require_agent)])
def accounts_search(name: str):
    """Fallback for customers who can't recall their card number (common
    among elderly users) — look up by the name given at registration
    instead. Returns only id/name, not full account details, since a
    match here isn't itself an authorization decision — the face check
    after startSession still gates everything."""
    matches = store.find_accounts_by_name(name)
    return [{"id": a.id, "name": a.name} for a in matches]


@app.get("/api/accounts/{account_id}")
def accounts_get(account_id: str, session_user: Optional[str] = Depends(get_session_user)):
    require_owner(account_id, session_user)
    account = store.get_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail={"error": "ACCOUNT_NOT_FOUND"})
    return account


class VoiceprintBody(BaseModel):
    userId: str
    featureVector: list[float]


@app.post("/api/voice/register")
def voice_register(body: VoiceprintBody):
    return voice_auth.register_voiceprint(body.userId, body.featureVector)


@app.post("/api/voice/authorize")
def voice_authorize(body: VoiceprintBody):
    return voice_auth.authorize_by_voice(body.userId, body.featureVector)


@app.get("/api/voice/status/{user_id}")
def voice_status(user_id: str):
    return {"registered": voice_auth.has_voiceprint(user_id)}


class FaceDescriptorBody(BaseModel):
    userId: str
    descriptor: list[float]


@app.post("/api/face/register")
def face_register(body: FaceDescriptorBody):
    try:
        return face_auth.register_face(body.userId, body.descriptor)
    except face_auth.InvalidDescriptorError as err:
        raise HTTPException(status_code=400, detail={"error": "INVALID_FACE_DESCRIPTOR", "message": str(err)})


@app.post("/api/face/authorize")
def face_authorize(body: FaceDescriptorBody):
    try:
        return face_auth.authorize_by_face(body.userId, body.descriptor)
    except face_auth.InvalidDescriptorError as err:
        raise HTTPException(status_code=400, detail={"error": "INVALID_FACE_DESCRIPTOR", "message": str(err)})


@app.get("/api/face/status/{user_id}")
def face_status(user_id: str):
    return {"registered": face_auth.has_face(user_id)}
