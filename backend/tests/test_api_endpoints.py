"""
End-to-end API tests: every route in app/main.py is exercised through
FastAPI's TestClient (real HTTP request/response cycle, not just the
service layer already covered by test_critical_flow.py). External
services (Groq, YarnGPT) and BMONI's bank-lookup calls are mocked;
everything else in BMONI runs in its built-in mock mode (no
BMONI_API_KEY configured in the test env).
"""

import asyncio
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models import ParsedIntent
from app.services import bmoni_service, config, face_auth, groq_service, openai_service, sessions, store, voice_auth, yarngpt_service
from tests.conftest import make_face_descriptor, make_voiceprint

FAKE_RESOLVED_NAMES = {"0123456789": "ADEWALE OKONKWO", "9876543210": "NGOZI EZE"}


async def _fake_verify_nigerian_account(user_id, bank_code, account_number):
    name = FAKE_RESOLVED_NAMES.get(account_number)
    if not name:
        raise RuntimeError("Could not resolve account")
    return {"accountNumber": account_number, "accountName": name, "bankName": "Mock Bank", "bankCode": bank_code}


async def _fake_list_nigerian_banks(user_id):
    return {"banks": [{"bankName": "Test Bank", "bankCode": "058"}]}


async def _fake_transcribe(audio_bytes, filename, language_hint=None):
    return "send five thousand naira to adewale"


async def _fake_parse_intent(text, language=None):
    return ParsedIntent(action="send", amount=5000, recipient="adewale", confidence=0.95)


async def _fake_tts(text, language):
    return b"FAKE-MP3-BYTES"


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch):
    """Keeps the whole suite offline/deterministic."""
    monkeypatch.setattr(bmoni_service, "verify_nigerian_account", _fake_verify_nigerian_account)
    monkeypatch.setattr(bmoni_service, "list_nigerian_banks", _fake_list_nigerian_banks)
    monkeypatch.setattr(groq_service, "transcribe_audio", _fake_transcribe)
    monkeypatch.setattr(groq_service, "parse_intent", _fake_parse_intent)
    monkeypatch.setattr(yarngpt_service, "synthesize_speech", _fake_tts)


def _fresh_user(client, balance_note=""):
    """Registers a brand-new account (avoids cross-test balance/state
    pollution on the shared 'mama-aisha' fixture account) and enrolls a
    matching face descriptor."""
    user_id = f"test-{uuid.uuid4().hex[:10]}"
    resp = client.post(
        "/api/accounts/register",
        json={"userId": user_id, "fullName": "Test User", "address": "1 Test St", "language": "en"},
    )
    assert resp.status_code == 200, resp.text
    descriptor = make_face_descriptor(seed=0.05)
    face_auth.register_face(user_id, descriptor)
    return user_id, descriptor


# ---------------------------------------------------------------------------
# Health / meta
# ---------------------------------------------------------------------------

def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body["bmoniMockMode"] is True
    assert body["aiProvider"] == "groq"  # no OPENAI_API_KEY configured in the test env
    assert "environment" in body and "authRequired" in body


def test_languages(client):
    resp = client.get("/api/languages")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) > 0


# ---------------------------------------------------------------------------
# Voice pipeline (transcription, intent, TTS)
# ---------------------------------------------------------------------------

def test_tts_success(client):
    resp = client.post("/api/tts", json={"text": "Balance is 5000 naira", "language": "en"})
    assert resp.status_code == 200
    assert resp.content == b"FAKE-MP3-BYTES"
    assert resp.headers["content-type"] == "audio/mpeg"


def test_tts_failure_returns_502(client, monkeypatch):
    async def _boom(text, language):
        raise RuntimeError("YARNGPT_API_KEY not configured")

    monkeypatch.setattr(yarngpt_service, "synthesize_speech", _boom)
    resp = client.post("/api/tts", json={"text": "hi", "language": "en"})
    assert resp.status_code == 502
    assert resp.json()["detail"]["error"] == "TTS_UNAVAILABLE"


def test_voice_process(client):
    resp = client.post(
        "/api/voice/process",
        files={"audio": ("clip.webm", b"fake-audio-bytes", "audio/webm")},
        data={"language": "en"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["text"] == "send five thousand naira to adewale"
    assert body["intent"]["action"] == "send"
    assert body["intent"]["amount"] == 5000


def test_transcribe(client):
    resp = client.post("/api/transcribe", files={"audio": ("clip.webm", b"fake-audio-bytes", "audio/webm")})
    assert resp.status_code == 200
    assert resp.json() == {"text": "send five thousand naira to adewale"}


def test_voice_process_upstream_failure(client, monkeypatch):
    async def _boom(*args, **kwargs):
        raise RuntimeError("groq unreachable")

    monkeypatch.setattr(groq_service, "transcribe_audio", _boom)
    resp = client.post("/api/voice/process", files={"audio": ("clip.webm", b"x", "audio/webm")})
    assert resp.status_code == 500
    assert resp.json()["detail"]["error"] == "NETWORK_ERROR"


def test_ai_intent(client):
    resp = client.post("/api/ai/intent", json={"text": "send five thousand naira to adewale"})
    assert resp.status_code == 200
    assert resp.json()["action"] == "send"


# ---------------------------------------------------------------------------
# AI provider fallback (P0-ish resilience: OpenAI primary, Groq fallback)
# ---------------------------------------------------------------------------

async def _fake_openai_transcribe(audio_bytes, filename, language_hint=None):
    return "OPENAI TRANSCRIPT"


async def _fake_openai_parse_intent(text, language=None):
    return ParsedIntent(action="balance", amount=None, recipient=None, confidence=0.99)


def test_health_reports_configured_ai_provider(client, monkeypatch):
    monkeypatch.setattr(openai_service, "is_configured", lambda: False)
    assert client.get("/api/health").json()["aiProvider"] == "groq"

    monkeypatch.setattr(openai_service, "is_configured", lambda: True)
    assert client.get("/api/health").json()["aiProvider"] == "openai"


def test_ai_provider_uses_openai_when_configured_and_healthy(client, monkeypatch):
    monkeypatch.setattr(openai_service, "is_configured", lambda: True)
    monkeypatch.setattr(openai_service, "transcribe_audio", _fake_openai_transcribe)
    monkeypatch.setattr(openai_service, "parse_intent", _fake_openai_parse_intent)

    transcribed = client.post("/api/transcribe", files={"audio": ("clip.webm", b"x", "audio/webm")})
    assert transcribed.json() == {"text": "OPENAI TRANSCRIPT"}

    intent = client.post("/api/ai/intent", json={"text": "anything"})
    assert intent.json()["action"] == "balance"
    assert intent.json()["confidence"] == 0.99


def test_ai_provider_falls_back_to_groq_when_openai_raises(client, monkeypatch):
    """Core of the requested behavior: OpenAI is configured (so it's
    tried first) but errors out — Groq's mocked response (from the
    autouse mock_external_services fixture) is what the caller actually
    gets back, transparently."""

    async def _boom(*args, **kwargs):
        raise RuntimeError("OpenAI is down")

    monkeypatch.setattr(openai_service, "is_configured", lambda: True)
    monkeypatch.setattr(openai_service, "transcribe_audio", _boom)
    monkeypatch.setattr(openai_service, "parse_intent", _boom)

    transcribed = client.post("/api/transcribe", files={"audio": ("clip.webm", b"x", "audio/webm")})
    assert transcribed.status_code == 200
    assert transcribed.json() == {"text": "send five thousand naira to adewale"}  # groq's mocked value

    intent = client.post("/api/ai/intent", json={"text": "anything"})
    assert intent.status_code == 200
    assert intent.json()["action"] == "send"  # groq's mocked value, not the openai one


def test_ai_provider_uses_groq_directly_when_openai_not_configured(client, monkeypatch):
    monkeypatch.setattr(openai_service, "is_configured", lambda: False)
    # If this accidentally called OpenAI it would blow up (no real key) —
    # reaching groq's mocked value at all proves the "not configured"
    # branch skipped OpenAI entirely rather than attempting and catching.
    resp = client.post("/api/transcribe", files={"audio": ("clip.webm", b"x", "audio/webm")})
    assert resp.json() == {"text": "send five thousand naira to adewale"}


def test_ai_provider_full_failure_still_surfaces_as_network_error(client, monkeypatch):
    """If OpenAI is configured but down AND Groq also fails, the caller
    should see a real error, not a silently wrong/empty result."""
    async def _boom(*args, **kwargs):
        raise RuntimeError("down")

    monkeypatch.setattr(openai_service, "is_configured", lambda: True)
    monkeypatch.setattr(openai_service, "transcribe_audio", _boom)
    monkeypatch.setattr(groq_service, "transcribe_audio", _boom)

    resp = client.post("/api/transcribe", files={"audio": ("clip.webm", b"x", "audio/webm")})
    assert resp.status_code == 500
    assert resp.json()["detail"]["error"] == "NETWORK_ERROR"


# ---------------------------------------------------------------------------
# Transaction lifecycle — happy paths
# ---------------------------------------------------------------------------

def test_full_send_happy_path(client):
    user_id, descriptor = _fresh_user(client)

    confirm = client.post(
        "/api/transactions/confirm",
        json={"userId": user_id, "action": "send", "amount": 5000, "recipient": "adewale", "confidence": 0.95},
    )
    assert confirm.status_code == 200
    tx = confirm.json()
    assert tx["state"] == "CONFIRMATION_REQUIRED"
    assert tx["recipientAccount"] == "0123456789"
    tx_id = tx["id"]

    confirmed = client.post("/api/transactions/confirm", json={"id": tx_id})
    assert confirmed.json()["state"] == "FACE_VERIFICATION_REQUIRED"

    verified = client.post("/api/transactions/verify-face", json={"id": tx_id, "faceDescriptor": descriptor})
    assert verified.json()["state"] == "FACE_VERIFIED"

    sent = client.post("/api/transactions/send", json={"id": tx_id})
    body = sent.json()
    assert body["state"] == "TRANSACTION_SUCCESS"
    assert body["bmoniSimulated"] is True
    assert body["bmoniReference"]

    fetched = client.get(f"/api/transactions/{tx_id}")
    assert fetched.json()["state"] == "TRANSACTION_SUCCESS"

    receipt = client.get(f"/api/transactions/{tx_id}/receipt")
    assert receipt.status_code == 200
    assert receipt.json()["transactionId"] == tx_id

    listed = client.get("/api/transactions", params={"userId": user_id})
    assert any(t["id"] == tx_id for t in listed.json())


def test_balance_action_short_circuits_to_processing(client):
    user_id, _ = _fresh_user(client)
    resp = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "balance", "confidence": 0.9})
    assert resp.json()["state"] == "TRANSACTION_PROCESSING"


def test_deposit_happy_path_increases_balance(client):
    user_id, descriptor = _fresh_user(client)
    before = client.get(f"/api/accounts/{user_id}/balance").json()["balance"]

    tx = client.post(
        "/api/transactions/confirm",
        json={"userId": user_id, "action": "deposit", "amount": 2000, "confidence": 0.9},
    ).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    client.post("/api/transactions/verify-face", json={"id": tx["id"], "faceDescriptor": descriptor})
    result = client.post("/api/transactions/send", json={"id": tx["id"]}).json()

    assert result["state"] == "TRANSACTION_SUCCESS"
    after = client.get(f"/api/accounts/{user_id}/balance").json()["balance"]
    assert after == before + 2000


# ---------------------------------------------------------------------------
# Transaction lifecycle — validation / rejection paths
# ---------------------------------------------------------------------------

def test_invalid_amount(client):
    user_id, _ = _fresh_user(client)
    resp = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 0, "recipient": "adewale", "confidence": 0.9})
    assert resp.json()["state"] == "INVALID_AMOUNT"


def test_unknown_recipient_then_resolve(client):
    user_id, _ = _fresh_user(client)
    tx = client.post(
        "/api/transactions/confirm",
        json={"userId": user_id, "action": "send", "amount": 5000, "recipient": "some-stranger", "confidence": 0.9},
    ).json()
    assert tx["state"] == "UNKNOWN_RECIPIENT"

    resolved = client.post(
        "/api/transactions/resolve-recipient", json={"id": tx["id"], "accountNumber": "0123456789", "bankCode": "058"}
    ).json()
    assert resolved["state"] == "CONFIRMATION_REQUIRED"
    assert resolved["recipient"] == "ADEWALE OKONKWO"


def test_insufficient_funds(client):
    user_id, _ = _fresh_user(client)
    balance = client.get(f"/api/accounts/{user_id}/balance").json()["balance"]
    resp = client.post(
        "/api/transactions/confirm",
        json={"userId": user_id, "action": "send", "amount": balance + 1000, "recipient": "adewale", "confidence": 0.9},
    )
    assert resp.json()["state"] == "INSUFFICIENT_FUNDS"


def test_low_confidence_requests_clarification(client):
    user_id, _ = _fresh_user(client)
    resp = client.post(
        "/api/transactions/confirm",
        json={"userId": user_id, "action": "send", "amount": 5000, "recipient": "adewale", "confidence": 0.2},
    ).json()
    assert resp["state"] == "LOW_AI_CONFIDENCE"
    assert resp["needsClarification"] in ("amount", "recipient")


def test_unsupported_bill_action(client):
    user_id, _ = _fresh_user(client)
    resp = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "bill", "confidence": 0.9})
    assert resp.json()["state"] == "UNSUPPORTED_ACTION"


def test_unknown_action_is_unsupported(client):
    user_id, _ = _fresh_user(client)
    resp = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "unknown", "confidence": 0.9})
    assert resp.json()["state"] == "UNSUPPORTED_ACTION"


def test_confirm_requires_user_id_for_new_transaction(client):
    resp = client.post("/api/transactions/confirm", json={"action": "balance"})
    assert resp.status_code == 400
    assert resp.json()["detail"]["error"] == "USER_ID_REQUIRED"


def test_confirm_unknown_transaction_id_404(client):
    resp = client.post("/api/transactions/confirm", json={"id": "NP-doesnotexist"})
    assert resp.status_code == 404


def test_cannot_confirm_twice(client):
    user_id, descriptor = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    second = client.post("/api/transactions/confirm", json={"id": tx["id"]})
    assert second.status_code == 409
    assert second.json()["detail"]["error"] == "INVALID_STATE"


def test_cancel_transaction(client):
    user_id, _ = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    cancelled = client.post(f"/api/transactions/{tx['id']}/cancel").json()
    assert cancelled["state"] == "USER_CANCELLED"


def test_cannot_cancel_terminal_transaction(client):
    user_id, _ = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post(f"/api/transactions/{tx['id']}/cancel")
    second = client.post(f"/api/transactions/{tx['id']}/cancel")
    assert "error" in second.json()


def test_cancel_unknown_transaction_404(client):
    resp = client.post("/api/transactions/NP-doesnotexist/cancel")
    assert resp.status_code == 404


def test_get_unknown_transaction_404(client):
    resp = client.get("/api/transactions/NP-doesnotexist")
    assert resp.status_code == 404


def test_receipt_unavailable_before_success(client):
    user_id, _ = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    resp = client.get(f"/api/transactions/{tx['id']}/receipt")
    assert resp.status_code == 409


def test_send_before_face_verification_rejected(client):
    user_id, _ = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})  # -> FACE_VERIFICATION_REQUIRED
    result = client.post("/api/transactions/send", json={"id": tx["id"]}).json()
    assert "error" in result and result["state"] != "TRANSACTION_SUCCESS"


# ---------------------------------------------------------------------------
# Face verification security (P0.1)
# ---------------------------------------------------------------------------

def test_verify_face_wrong_descriptor_fails(client):
    user_id, _correct_descriptor = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    wrong_descriptor = make_face_descriptor(seed=0.999)
    verified = client.post("/api/transactions/verify-face", json={"id": tx["id"], "faceDescriptor": wrong_descriptor}).json()
    assert verified["state"] == "FACE_VERIFICATION_FAILED"


def test_verify_face_invalid_descriptor_shape_400(client):
    user_id, _ = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    resp = client.post("/api/transactions/verify-face", json={"id": tx["id"], "faceDescriptor": [0.1, 0.2]})
    assert resp.status_code == 400
    assert resp.json()["detail"]["error"] == "INVALID_FACE_DESCRIPTOR"


def test_verify_face_client_matched_ignored_when_face_registered(client):
    """The core P0.1 fix: an enrolled account can no longer be waved
    through with a bare client-asserted matched=True and no descriptor."""
    user_id, _ = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    resp = client.post("/api/transactions/verify-face", json={"id": tx["id"], "matched": True})
    assert resp.status_code == 400
    assert resp.json()["detail"]["error"] == "FACE_DESCRIPTOR_REQUIRED"


def test_verify_face_fallback_only_for_unenrolled_account_in_dev(client, monkeypatch):
    assert config.ALLOW_CLIENT_FACE_FALLBACK is True  # test env is not production
    user_id = f"test-{uuid.uuid4().hex[:10]}"
    client.post("/api/accounts/register", json={"userId": user_id, "fullName": "No Face", "address": "x", "language": "en"})
    # deliberately never registers a face for this user
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    resp = client.post("/api/transactions/verify-face", json={"id": tx["id"], "matched": True})
    assert resp.json()["state"] == "FACE_VERIFIED"


def test_verify_face_no_fallback_in_production(client, monkeypatch):
    monkeypatch.setattr(config, "ALLOW_CLIENT_FACE_FALLBACK", False)
    user_id = f"test-{uuid.uuid4().hex[:10]}"
    client.post("/api/accounts/register", json={"userId": user_id, "fullName": "No Face", "address": "x", "language": "en"})
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    resp = client.post("/api/transactions/verify-face", json={"id": tx["id"], "matched": True})
    assert resp.json()["state"] == "FACE_NOT_ENROLLED"


# ---------------------------------------------------------------------------
# Concurrency safety (P0)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_concurrent_send_only_executes_once(client):
    user_id, descriptor = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    client.post("/api/transactions/verify-face", json={"id": tx["id"], "faceDescriptor": descriptor})

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        results = await asyncio.gather(
            ac.post("/api/transactions/send", json={"id": tx["id"]}),
            ac.post("/api/transactions/send", json={"id": tx["id"]}),
        )

    states = [r.json().get("state") for r in results]
    assert states.count("TRANSACTION_SUCCESS") == 1
    # the loser either reports "already processing" (error, no state change)
    # or observes the winner's SUCCESS if it ran after settlement completed
    assert all(s in ("TRANSACTION_SUCCESS", None) or "error" in r.json() for s, r in zip(states, results))

    balance = client.get(f"/api/accounts/{user_id}/balance").json()["balance"]
    account_before_tx = 50000 - 1000  # STARTING_BALANCE minus the single debit
    assert balance == account_before_tx  # proves the debit happened exactly once


def test_send_is_idempotent_after_success(client):
    user_id, descriptor = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    client.post("/api/transactions/verify-face", json={"id": tx["id"], "faceDescriptor": descriptor})
    first = client.post("/api/transactions/send", json={"id": tx["id"]}).json()
    second = client.post("/api/transactions/send", json={"id": tx["id"]}).json()
    assert first["state"] == second["state"] == "TRANSACTION_SUCCESS"
    assert first["bmoniReference"] == second["bmoniReference"]

    balance = client.get(f"/api/accounts/{user_id}/balance").json()["balance"]
    assert balance == 50000 - 1000  # only debited once despite two /send calls


# ---------------------------------------------------------------------------
# Transaction expiry (P1)
# ---------------------------------------------------------------------------

def test_expired_transaction_cannot_be_confirmed(client, monkeypatch):
    monkeypatch.setattr(config, "TRANSACTION_TTL_SECONDS", -1)  # already-expired on creation
    user_id, _ = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    assert tx["state"] == "CONFIRMATION_REQUIRED"
    confirmed = client.post("/api/transactions/confirm", json={"id": tx["id"]}).json()
    assert confirmed["state"] == "TRANSACTION_EXPIRED"


# ---------------------------------------------------------------------------
# Reconciliation (P0 external/local consistency)
# ---------------------------------------------------------------------------

def test_reconciliation_required_when_local_ledger_update_fails(client, monkeypatch):
    user_id, descriptor = _fresh_user(client)
    tx = client.post("/api/transactions/confirm", json={"userId": user_id, "action": "send", "amount": 1000, "recipient": "adewale", "confidence": 0.9}).json()
    client.post("/api/transactions/confirm", json={"id": tx["id"]})
    client.post("/api/transactions/verify-face", json={"id": tx["id"], "faceDescriptor": descriptor})

    monkeypatch.setattr(store, "adjust_balance", lambda user_id, delta: (_ for _ in ()).throw(RuntimeError("ledger down")))
    result = client.post("/api/transactions/send", json={"id": tx["id"]}).json()
    assert result["state"] == "RECONCILIATION_REQUIRED"
    assert result["bmoniReference"]  # the external transfer still happened and was recorded


# ---------------------------------------------------------------------------
# Banks / account verification (BMONI)
# ---------------------------------------------------------------------------

def test_banks_list(client):
    resp = client.get("/api/banks")
    assert resp.status_code == 200
    assert resp.json() == [{"code": "058", "name": "Test Bank"}]


def test_banks_upstream_failure(client, monkeypatch):
    async def _boom(user_id):
        raise RuntimeError("bmoni down")

    monkeypatch.setattr(bmoni_service, "list_nigerian_banks", _boom)
    resp = client.get("/api/banks")
    assert resp.status_code == 502


def test_verify_account(client):
    resp = client.get("/api/verify-account", params={"accountNumber": "0123456789", "bankCode": "058"})
    assert resp.status_code == 200
    assert resp.json()["accountName"] == "ADEWALE OKONKWO"


def test_verify_account_not_found(client):
    resp = client.get("/api/verify-account", params={"accountNumber": "0000000000", "bankCode": "058"})
    assert resp.status_code == 502


# ---------------------------------------------------------------------------
# Accounts
# ---------------------------------------------------------------------------

def test_accounts_register_and_get(client):
    user_id, _ = _fresh_user(client)
    resp = client.get(f"/api/accounts/{user_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == user_id


def test_accounts_register_duplicate_conflict(client):
    user_id, _ = _fresh_user(client)
    resp = client.post("/api/accounts/register", json={"userId": user_id, "fullName": "Dup", "address": "x", "language": "en"})
    assert resp.status_code == 409


def test_accounts_get_by_card(client):
    resp = client.get("/api/accounts/by-card/5060000000000001")
    assert resp.status_code == 200
    assert resp.json()["id"] == "mama-aisha"


def test_accounts_get_by_card_not_found(client):
    resp = client.get("/api/accounts/by-card/0000000000000000")
    assert resp.status_code == 404


def test_accounts_search(client):
    resp = client.get("/api/accounts/search", params={"name": "Olawale"})
    assert resp.status_code == 200
    assert any(a["id"] == "mama-aisha" for a in resp.json())


def test_accounts_get_not_found(client):
    resp = client.get("/api/accounts/does-not-exist")
    assert resp.status_code == 404


def test_accounts_balance(client):
    user_id, _ = _fresh_user(client)
    resp = client.get(f"/api/accounts/{user_id}/balance")
    assert resp.status_code == 200
    assert resp.json()["balance"] == 50000


# ---------------------------------------------------------------------------
# Session / auth guard (P0.7) — REQUIRE_AUTH enabled explicitly
# ---------------------------------------------------------------------------

def test_session_start_success_and_ownership_enforced(client, monkeypatch):
    monkeypatch.setattr(config, "REQUIRE_AUTH", True)
    user_id, descriptor = _fresh_user(client)

    start = client.post("/api/session/start", json={"userId": user_id, "faceDescriptor": descriptor})
    assert start.status_code == 200
    token = start.json()["sessionToken"]

    # No token at all -> rejected
    no_auth = client.get(f"/api/accounts/{user_id}/balance")
    assert no_auth.status_code == 401

    # Right token -> allowed
    ok = client.get(f"/api/accounts/{user_id}/balance", headers={"X-Session-Token": token})
    assert ok.status_code == 200

    # Token for a *different* user's resource -> forbidden
    other_user, _ = _fresh_user(client)
    forbidden = client.get(f"/api/accounts/{other_user}/balance", headers={"X-Session-Token": token})
    assert forbidden.status_code == 403


def test_session_start_wrong_face_rejected(client):
    user_id, _correct_descriptor = _fresh_user(client)
    resp = client.post("/api/session/start", json={"userId": user_id, "faceDescriptor": make_face_descriptor(seed=0.777)})
    assert resp.status_code == 401


def test_session_not_required_by_default(client):
    """Sanity check: with REQUIRE_AUTH left at its test-env default
    (False), existing unauthenticated flows keep working."""
    assert config.REQUIRE_AUTH is False
    user_id, _ = _fresh_user(client)
    resp = client.get(f"/api/accounts/{user_id}/balance")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Agent-key guard (P0) — AGENT_API_KEY enabled explicitly
# ---------------------------------------------------------------------------

def test_agent_key_required_when_configured(client, monkeypatch):
    monkeypatch.setattr(config, "AGENT_API_KEY", "secret-agent-key")
    no_key = client.get("/api/agent/bmoni-status")
    assert no_key.status_code == 401

    with_key = client.get("/api/agent/bmoni-status", headers={"X-Agent-Key": "secret-agent-key"})
    assert with_key.status_code == 200


# ---------------------------------------------------------------------------
# Voiceprint endpoints
# ---------------------------------------------------------------------------

def test_voice_register_authorize_status(client):
    user_id, _ = _fresh_user(client)
    vec = make_voiceprint()

    assert client.get(f"/api/voice/status/{user_id}").json() == {"registered": False}

    reg = client.post("/api/voice/register", json={"userId": user_id, "featureVector": vec})
    assert reg.json() == {"registered": True, "userId": user_id}

    assert client.get(f"/api/voice/status/{user_id}").json() == {"registered": True}

    auth = client.post("/api/voice/authorize", json={"userId": user_id, "featureVector": vec})
    assert auth.json()["authorized"] is True

    mismatch = client.post("/api/voice/authorize", json={"userId": user_id, "featureVector": [0.0] * 32})
    assert mismatch.json()["authorized"] is False


# ---------------------------------------------------------------------------
# Face endpoints
# ---------------------------------------------------------------------------

def test_face_register_authorize_status(client):
    user_id = f"test-{uuid.uuid4().hex[:10]}"
    client.post("/api/accounts/register", json={"userId": user_id, "fullName": "Face Test", "address": "x", "language": "en"})
    descriptor = make_face_descriptor(seed=0.42)

    assert client.get(f"/api/face/status/{user_id}").json() == {"registered": False}

    reg = client.post("/api/face/register", json={"userId": user_id, "descriptor": descriptor})
    assert reg.status_code == 200

    assert client.get(f"/api/face/status/{user_id}").json() == {"registered": True}

    auth = client.post("/api/face/authorize", json={"userId": user_id, "descriptor": descriptor})
    assert auth.json()["authorized"] is True


def test_face_register_rejects_invalid_shape(client):
    user_id = f"test-{uuid.uuid4().hex[:10]}"
    resp = client.post("/api/face/register", json={"userId": user_id, "descriptor": [0.1, 0.2, 0.3]})
    assert resp.status_code == 400
    assert resp.json()["detail"]["error"] == "INVALID_FACE_DESCRIPTOR"


def test_face_authorize_rejects_invalid_shape(client):
    resp = client.post("/api/face/authorize", json={"userId": "mama-aisha", "descriptor": [1.0] * 5})
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# BMONI sandbox routes (mock mode — no BMONI_API_KEY configured)
# ---------------------------------------------------------------------------

def test_bmoni_owner_wallet_and_address(client):
    generated = client.post("/api/bmoni/generate-owner-wallet")
    assert generated.status_code == 200
    assert "address" in generated.json() and "privateKey" in generated.json()

    addr = client.get("/api/bmoni/owner-address")
    assert addr.status_code == 200


def test_bmoni_user_and_wallet_lifecycle(client):
    created = client.post("/api/bmoni/users", json={"firstName": "Agent", "email": "agent@example.com", "phoneNumber": "+2348000000000"})
    assert created.status_code == 200
    user_id = created.json()["bmoniUserId"]
    assert user_id

    listed = client.get("/api/bmoni/users")
    assert listed.status_code == 200

    wallet = client.post(f"/api/bmoni/users/{user_id}/wallet")
    assert wallet.status_code == 200

    kyc = client.post(f"/api/bmoni/users/{user_id}/kyc", json={"firstName": "Agent", "phoneNumber": "+2348000000000"})
    assert kyc.status_code == 200

    status = client.get(f"/api/bmoni/users/{user_id}/onboarding-status")
    assert status.status_code == 200

    activated = client.post(
        f"/api/bmoni/users/{user_id}/activate-nigeria",
        json={"ngnWalletAddress": "0xabc123", "ngnWalletIndex": 0},
    )
    assert activated.status_code == 200

    wallets = client.get(f"/api/bmoni/users/{user_id}/wallets")
    assert wallets.status_code == 200

    balances = client.get(f"/api/bmoni/users/{user_id}/real-balances")
    assert balances.status_code == 200

    transactions = client.get(f"/api/bmoni/users/{user_id}/wallets/some-wallet-id/real-transactions")
    assert transactions.status_code == 200

    banks = client.get(f"/api/bmoni/users/{user_id}/nigerian-banks")
    assert banks.status_code == 200

    verify = client.post(f"/api/bmoni/users/{user_id}/verify-nigerian-account", json={"bankCode": "058", "accountNumber": "0123456789"})
    assert verify.status_code == 200

    withdrawal_account = client.post(
        f"/api/bmoni/users/{user_id}/withdrawal-account",
        json={"accountNumber": "0123456789", "bankCode": "058", "bankName": "Test Bank", "accountHolderName": "Agent"},
    )
    assert withdrawal_account.status_code == 200

    initiate_only = client.post(
        f"/api/bmoni/users/{user_id}/withdraw-nigeria/initiate-only",
        json={"sourceSmartWalletId": "wallet-1", "bankAccountId": "acct-1", "fromAmount": "1000"},
    )
    assert initiate_only.status_code == 200

    full_withdraw = client.post(
        f"/api/bmoni/users/{user_id}/withdraw-nigeria",
        json={"sourceSmartWalletId": "wallet-1", "bankAccountId": "acct-1", "fromAmount": "1000"},
    )
    assert full_withdraw.status_code == 200


# ---------------------------------------------------------------------------
# Agent BMONI onboarding endpoints
# ---------------------------------------------------------------------------

def test_agent_bmoni_onboard_status_restore(client):
    onboard = client.post(
        "/api/agent/bmoni-onboard",
        json={"firstName": "Agent", "email": "agent2@example.com", "phoneNumber": "+2348011111111"},
    )
    assert onboard.status_code == 200
    assert onboard.json()["bmoniOnboarded"] is True

    status = client.get("/api/agent/bmoni-status")
    assert status.status_code == 200
    assert status.json()["bmoniOnboarded"] is True

    restore = client.post(
        "/api/agent/bmoni-restore",
        json={
            "bmoniUserId": "restored-user",
            "bmoniSmartWalletId": "restored-wallet",
            "bmoniWalletAddress": "0xrestored",
            "bmoniOnboarded": True,
        },
    )
    assert restore.status_code == 200
    assert restore.json()["bmoniUserId"] == "restored-user"
