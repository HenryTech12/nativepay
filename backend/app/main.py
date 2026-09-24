import logging
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services import bmoni_service, db, face_auth, groq_service, paystack_service, store, transaction_service, voice_auth, yarngpt_service
from app.services.languages import supported_languages
from app.services.transaction_service import STATES

logger = logging.getLogger("nativepay")

app = FastAPI(title="ElderPay API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon simplicity — tighten to the real frontend origin before production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db.init_schema()  # no-op if DATABASE_URL isn't set; falls back to in-memory storage on failure


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "demoMode": True,
        "bmoniMockMode": bmoni_service.is_mock_mode(),
        "dbConnected": db.is_ready(),
    }


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
        text = await groq_service.transcribe_audio(audio_bytes, audio.filename, language)
        intent = await groq_service.parse_intent(text)
        return {"text": text, "intent": intent.model_dump()}
    except Exception as err:
        logger.error("voice_process failed: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "NETWORK_ERROR", "message": str(err)})


@app.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...), language: Optional[str] = Form(None)):
    try:
        audio_bytes = await audio.read()
        text = await groq_service.transcribe_audio(audio_bytes, audio.filename, language)
        return {"text": text}
    except Exception as err:
        logger.error("transcribe failed: %s", err, exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "NETWORK_ERROR", "message": str(err)})


class IntentTextBody(BaseModel):
    text: str


@app.post("/api/ai/intent")
async def ai_intent(body: IntentTextBody):
    try:
        return (await groq_service.parse_intent(body.text)).model_dump()
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
def transactions_confirm(body: ConfirmBody):
    if not body.id:
        if not body.userId:
            raise HTTPException(status_code=400, detail={"error": "USER_ID_REQUIRED"})
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
    if existing.state != STATES["CONFIRMATION_REQUIRED"]:
        raise HTTPException(status_code=409, detail={"error": "INVALID_STATE", "state": existing.state})

    voice_verified = False
    if body.voiceFeatureVector:
        result = voice_auth.authorize_for_transaction(existing.userId, body.voiceFeatureVector)
        voice_verified = result["authorized"]
    return transaction_service.confirm_transaction(body.id, voice_verified=voice_verified)


@app.post("/api/transactions/{tx_id}/cancel")
def transactions_cancel(tx_id: str):
    result = transaction_service.cancel_transaction(tx_id)
    if not result:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    return result


class VerifyFaceBody(BaseModel):
    id: str
    faceDescriptor: Optional[list[float]] = None
    matched: bool = False  # fallback only for accounts with no registered face descriptor


@app.get("/api/banks")
async def banks():
    try:
        return await paystack_service.list_banks()
    except Exception as err:
        logger.error("banks failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BANKS_UNAVAILABLE", "message": str(err)})


@app.get("/api/paystack/resolve-account")
async def paystack_resolve_account(accountNumber: str, bankCode: str):
    """Standalone test/utility endpoint — resolves an account directly,
    with no transaction required. What resolve-recipient calls internally."""
    try:
        return await paystack_service.resolve_account(accountNumber, bankCode)
    except Exception as err:
        logger.error("paystack_resolve_account failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "ACCOUNT_NOT_FOUND", "message": str(err)})


class ResolveRecipientBody(BaseModel):
    id: str
    accountNumber: str
    bankCode: str


@app.post("/api/transactions/resolve-recipient")
async def transactions_resolve_recipient(body: ResolveRecipientBody):
    result = await transaction_service.resolve_recipient_by_account(body.id, body.accountNumber, body.bankCode)
    if not result:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    return result


@app.post("/api/transactions/verify-face")
def transactions_verify_face(body: VerifyFaceBody):
    """Verifies server-side whenever a real face descriptor is supplied
    (the account has one on file) -- never trusts a client-asserted
    match for that case. Falls back to the client-asserted `matched`
    only for accounts with no registered face (e.g. legacy/demo
    accounts predating this feature), same graceful-degradation pattern
    used for voice."""
    existing = store.get_transaction(body.id)
    if not existing:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    matched = body.matched
    if body.faceDescriptor:
        result = face_auth.authorize_by_face(existing.userId, body.faceDescriptor)
        matched = result["authorized"]
    return transaction_service.record_face_verification(body.id, matched)


class SendBody(BaseModel):
    id: str


@app.post("/api/transactions/send")
async def transactions_send(body: SendBody):
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
def transactions_list(userId: Optional[str] = None):
    return store.list_transactions(userId)


@app.get("/api/transactions/{tx_id}")
def transactions_get(tx_id: str):
    tx = store.get_transaction(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    return tx


@app.get("/api/transactions/{tx_id}/receipt")
def transactions_receipt(tx_id: str):
    tx = store.get_transaction(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail={"error": "TRANSACTION_NOT_FOUND"})
    if tx.state != STATES["TRANSACTION_SUCCESS"]:
        raise HTTPException(status_code=409, detail={"error": "RECEIPT_NOT_AVAILABLE", "state": tx.state})
    return bmoni_service.generate_receipt(tx)


# These /api/bmoni/users/{user_id}/* routes are granular testing utilities
# over the raw BMONI API — the user_id you pass is the BMONI-side
# bmoniUserId, not an ElderPay customer id. In this app that identity
# always belongs to the POS agent/platform (see AgentBmoniProfile),
# never to an individual customer. Prefer /api/agent/bmoni-onboard below
# for the actual one-time setup; these stay for testing individual steps.


@app.post("/api/bmoni/generate-owner-wallet")
def bmoni_generate_owner_wallet():
    """One-time setup helper — generates an EVM keypair for the
    self-custodied smart-wallet owner. Save privateKey as
    BMONI_OWNER_PRIVATE_KEY in .env, then never call this again."""
    return bmoni_service.generate_owner_wallet()


@app.get("/api/bmoni/owner-address")
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


@app.post("/api/bmoni/users")
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


@app.get("/api/bmoni/users")
async def bmoni_list_users(page: int = 1, limit: int = 100):
    try:
        return await bmoni_service.list_users(page, limit)
    except Exception as err:
        logger.error("bmoni_list_users failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.post("/api/bmoni/users/{user_id}/wallet")
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


@app.post("/api/bmoni/users/{user_id}/kyc")
async def bmoni_submit_kyc(user_id: str, body: BmoniKycBody):
    try:
        return await bmoni_service.submit_kyc(user_id, body.firstName, body.phoneNumber, body.bvn)
    except Exception as err:
        logger.error("bmoni_submit_kyc failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/onboarding-status")
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


@app.post("/api/bmoni/users/{user_id}/activate-nigeria")
async def bmoni_activate_nigeria(user_id: str, body: BmoniActivateBody):
    try:
        return await bmoni_service.activate_nigeria_rail(user_id, body.ngnWalletAddress, body.ngnWalletIndex, body.bvn)
    except Exception as err:
        logger.error("bmoni_activate_nigeria failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/wallets")
async def bmoni_get_wallets(user_id: str):
    try:
        return await bmoni_service.get_wallets(user_id)
    except Exception as err:
        logger.error("bmoni_get_wallets failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/real-balances")
async def bmoni_get_real_balances(user_id: str):
    try:
        return await bmoni_service.get_real_balances(user_id)
    except Exception as err:
        logger.error("bmoni_get_real_balances failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/wallets/{smart_wallet_id}/real-transactions")
async def bmoni_get_real_transactions(user_id: str, smart_wallet_id: str):
    try:
        return await bmoni_service.get_real_transactions(user_id, smart_wallet_id)
    except Exception as err:
        logger.error("bmoni_get_real_transactions failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


@app.get("/api/bmoni/users/{user_id}/nigerian-banks")
async def bmoni_list_nigerian_banks(user_id: str):
    try:
        return await bmoni_service.list_nigerian_banks(user_id)
    except Exception as err:
        logger.error("bmoni_list_nigerian_banks failed: %s", err, exc_info=True)
        raise HTTPException(status_code=502, detail={"error": "BMONI_API_ERROR", "message": str(err)})


class BmoniVerifyAccountBody(BaseModel):
    bankCode: str
    accountNumber: str


@app.post("/api/bmoni/users/{user_id}/verify-nigerian-account")
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


@app.post("/api/bmoni/users/{user_id}/withdrawal-account")
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


@app.post("/api/bmoni/users/{user_id}/withdraw-nigeria/initiate-only")
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


@app.post("/api/bmoni/users/{user_id}/withdraw-nigeria")
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


@app.post("/api/agent/bmoni-onboard")
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


@app.get("/api/agent/bmoni-status")
def agent_bmoni_status():
    return store.get_agent_bmoni_profile()


class AgentBmoniRestoreBody(BaseModel):
    bmoniUserId: str
    bmoniSmartWalletId: str
    bmoniWalletAddress: str
    bmoniWithdrawalAccountId: Optional[str] = None
    bmoniOnboarded: bool = True


@app.post("/api/agent/bmoni-restore")
def agent_bmoni_restore(body: AgentBmoniRestoreBody):
    """Manually re-point this app's local record of the agent's BMONI
    identity at a known-good one — recovery path for when that record
    was lost locally (e.g. an in-memory profile wiped by a process
    restart before persistence was added) even though the identity
    still legitimately exists and is funded on BMONI's own side. Does
    not call BMONI's API; only corrects this app's own bookkeeping."""
    return store.update_agent_bmoni_profile(**body.model_dump())


@app.get("/api/accounts/{account_id}/balance")
def accounts_balance(account_id: str):
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


@app.post("/api/accounts/register")
def accounts_register(body: AccountRegisterBody):
    if store.get_account(body.userId):
        raise HTTPException(status_code=409, detail={"error": "ACCOUNT_EXISTS"})
    account = store.create_account(body.userId, body.fullName, body.language, body.address, body.email or None)
    return account


@app.get("/api/accounts/by-card/{card_number}")
def accounts_get_by_card(card_number: str):
    account = store.get_account_by_card(card_number)
    if not account:
        raise HTTPException(status_code=404, detail={"error": "CARD_NOT_RECOGNIZED"})
    return account


@app.get("/api/accounts/search")
def accounts_search(name: str):
    """Fallback for customers who can't recall their card number (common
    among elderly users) — look up by the name given at registration
    instead. Returns only id/name, not full account details, since a
    match here isn't itself an authorization decision — the face check
    after startSession still gates everything."""
    matches = store.find_accounts_by_name(name)
    return [{"id": a.id, "name": a.name} for a in matches]


@app.get("/api/accounts/{account_id}")
def accounts_get(account_id: str):
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
    return face_auth.register_face(body.userId, body.descriptor)


@app.post("/api/face/authorize")
def face_authorize(body: FaceDescriptorBody):
    return face_auth.authorize_by_face(body.userId, body.descriptor)


@app.get("/api/face/status/{user_id}")
def face_status(user_id: str):
    return {"registered": face_auth.has_face(user_id)}
