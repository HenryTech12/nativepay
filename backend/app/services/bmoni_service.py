"""
BMONI sandbox integration, per BMONI's hackathon quick-start doc and the
full OpenAPI reference at embedded-dev.bmoni.com/docs:

    Create user -> Create wallet -> Complete KYC -> Activate NGN rail ->
    Fund wallet -> Read or move money

Mock mode runs automatically whenever BMONI_API_KEY is unset, so the rest
of the app stays testable before real sandbox access is confirmed.

Wallets are self-custodied smart contract wallets (ERC-4337-style). BMONI
expects an owner keypair whose address:
  1. Signs a short-lived EIP-191 challenge message to prove ownership
     before wallet creation (owner-proof-challenges / create-managed).
  2. Signs an EIP-712 typed-data payload to authorize each money-moving
     proposal (e.g. a Nigeria bank withdrawal) before it's submitted
     on-chain (withdrawal/wallet/nigeria -> proposals/{id}/sign).
BMONI's own SDK (Flutter/React Native) normally does this signing, but
this backend is plain Python/FastAPI, so both signature types are
produced here with eth_account instead — verification on BMONI's side is
just ECDSA address recovery, so it doesn't matter which library produced
a given signature.

Real money movement in this demo is scoped to Nigeria bank withdrawal
(withdraw action) — the one BMONI flow with a fully documented request/
response shape for cash-out to a real Nigerian bank account. There's no
BMONI endpoint for P2P "send" between arbitrary recipients or NGN-only
deposit (BMONI's deposit endpoints are card/crypto-only), so those stay
on this app's own balance bookkeeping — matching the quick-start doc's
note that sandbox wallets are funded manually by BMONI staff, not via API.
"""

import asyncio
import os
import random
import time
from typing import Optional

import httpx
from eth_account import Account
from eth_account.messages import encode_defunct, encode_typed_data

from app.models import TransactionRecord

BASE_URL = os.environ.get("BMONI_BASE_URL") or "https://embedded-dev.bmoni.com"
API_KEY = os.environ.get("BMONI_API_KEY")
OWNER_PRIVATE_KEY = os.environ.get("BMONI_OWNER_PRIVATE_KEY")

MOCK_MODE = not API_KEY or API_KEY == "your_bmoni_sandbox_key_here"

SANDBOX_TEST_BVN = "22222222222"
SANDBOX_COUNTRY_CODE = "NGA"
WALLET_CURRENCY = "CNGN"  # doc: "Use CNGN, not NGN, when a wallet endpoint asks for the wallet currency."
DEFAULT_SUMSUB_LEVEL = "id-and-liveness"
REQUEST_TIMEOUT = 30.0  # httpx defaults to 5s, too tight for a hackathon-day sandbox under load


def _headers() -> dict:
    return {"x-api-key": API_KEY or "", "Content-Type": "application/json"}


def _mock_reference() -> str:
    return f"EP-MOCK-{int(time.time() * 1000)}-{random.randint(0, 9999)}"


def is_mock_mode() -> bool:
    return MOCK_MODE


def generate_owner_wallet() -> dict:
    """One-time setup helper — generates a fresh EVM keypair for the
    self-custodied smart-wallet owner. Save the privateKey as
    BMONI_OWNER_PRIVATE_KEY in .env; every onboarded user in this demo
    reuses that one owner key."""
    acct = Account.create()
    return {"address": acct.address, "privateKey": acct.key.hex()}


def _owner_account() -> Account:
    if not OWNER_PRIVATE_KEY:
        raise RuntimeError(
            "BMONI_OWNER_PRIVATE_KEY not set — call generate_owner_wallet() once "
            "and save the returned privateKey to .env"
        )
    return Account.from_key(OWNER_PRIVATE_KEY)


def get_owner_address() -> dict:
    """Public address only, safe to expose — lets us confirm the owner key
    currently configured on this deployment is the same one a given
    wallet was actually created with, without ever revealing the private
    key itself."""
    if not OWNER_PRIVATE_KEY:
        return {"configured": False, "ownerAddress": None}
    return {"configured": True, "ownerAddress": _owner_account().address}


async def list_users(page: int = 1, limit: int = 100) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.1)
        return {"users": [], "total": 0, "page": page}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.get("/v1/users", params={"page": page, "limit": limit})
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI list_users failed ({res.status_code}): {res.text}")
        return res.json()


async def find_user_by_identity(email: Optional[str] = None, phone_number: Optional[str] = None, max_pages: int = 5) -> Optional[dict]:
    """Paginates GET /v1/users looking for a match — used to recover the
    bmoniUserId when create_user hits a 409 because a prior attempt's
    response was lost (e.g. a Cloudflare gateway timeout) even though
    BMONI's side actually created the user."""
    for page in range(1, max_pages + 1):
        body = await list_users(page=page, limit=100)
        for user in body.get("users", []):
            if email and user.get("email") == email:
                return user
            if phone_number and user.get("phoneNumber") == phone_number:
                return user
        if page * 100 >= body.get("total", 0):
            break
    return None


async def create_user(
    first_name: str, email: str, phone_number: str, bvn: Optional[str] = None,
) -> dict:
    """Passing a BVN auto-fills lastName/middleName/address/dateOfBirth
    from the BVN record server-side — useful for the sandbox test BVN."""
    if MOCK_MODE:
        await asyncio.sleep(0.2)
        return {"bmoniUserId": f"mock-user-{random.randint(100000, 999999)}", "environment": "sandbox-mock"}
    body = {"firstName": first_name, "email": email, "phoneNumber": phone_number}
    if bvn:
        body["bvn"] = bvn
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.post("/v1/users", json=body)
        if res.status_code == 409:
            conflict_body = res.text
        elif res.status_code >= 400:
            raise RuntimeError(f"BMONI create_user failed ({res.status_code}): {res.text}")
        else:
            return res.json()

    existing = await find_user_by_identity(email=email, phone_number=phone_number)
    if existing:
        return existing
    raise RuntimeError(f"BMONI create_user conflict, but no matching existing user found: {conflict_body}")


async def create_smart_wallet(user_id: str) -> dict:
    """Requests an owner-proof challenge, signs it with our owner keypair,
    then creates the managed smart wallet."""
    if MOCK_MODE:
        await asyncio.sleep(0.2)
        return {"id": f"mock-wallet-{random.randint(100000, 999999)}", "walletAddress": "0xMOCK", "environment": "sandbox-mock"}

    owner = _owner_account()
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        challenge_res = await client.post(
            f"/v1/users/{user_id}/smart-wallets/owner-proof-challenges",
            json={"currency": WALLET_CURRENCY, "userOwnerAddress": owner.address},
        )
        if challenge_res.status_code >= 400:
            raise RuntimeError(f"BMONI owner-proof-challenge failed ({challenge_res.status_code}): {challenge_res.text}")
        challenge = challenge_res.json()

        signed = Account.sign_message(encode_defunct(text=challenge["message"]), private_key=owner.key)

        create_res = await client.post(
            f"/v1/users/{user_id}/smart-wallets/create-managed",
            json={
                "currency": WALLET_CURRENCY,
                "userOwnerAddress": owner.address,
                "ownerProofChallengeId": challenge["challengeId"],
                "ownerProofSignature": "0x" + signed.signature.hex(),
            },
        )
        if create_res.status_code >= 400:
            raise RuntimeError(f"BMONI create-managed-wallet failed ({create_res.status_code}): {create_res.text}")
        return create_res.json()


async def submit_kyc(
    user_id: str,
    first_name: str,
    phone_number: str,
    bvn: str = SANDBOX_TEST_BVN,
) -> dict:
    """Two-step: PATCH the KYC profile (identity + address), then activate
    it for SumSub review. Nigeria's sandbox BVN auto-fills most of the
    profile at user-creation time if it was passed to create_user."""
    if MOCK_MODE:
        await asyncio.sleep(0.2)
        return {"activated": True, "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        patch_res = await client.patch(f"/v1/users/{user_id}/kyc", json={
            "personalInfo": {"firstName": first_name, "phoneNumber": phone_number},
            "address": {"countryCode": SANDBOX_COUNTRY_CODE},
            "identificationNumbers": [
                {"type": "bvn", "number": bvn, "issuingCountryCode": SANDBOX_COUNTRY_CODE},
            ],
        })
        if patch_res.status_code >= 400:
            raise RuntimeError(f"BMONI kyc profile update failed ({patch_res.status_code}): {patch_res.text}")

        activate_res = await client.post(f"/v1/users/{user_id}/kyc/activate", json={
            "sumsubLevelName": DEFAULT_SUMSUB_LEVEL,
        })
        if activate_res.status_code >= 400:
            raise RuntimeError(f"BMONI kyc activate failed ({activate_res.status_code}): {activate_res.text}")
        return activate_res.json()


async def get_onboarding_status(user_id: str) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.1)
        return {"anchorStatus": "active", "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.get(f"/v1/users/{user_id}/onboarding/status")
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI onboarding status check failed ({res.status_code}): {res.text}")
        return res.json()


async def activate_nigeria_rail(
    user_id: str, ngn_wallet_address: str, ngn_wallet_index: int = 0, bvn: str = SANDBOX_TEST_BVN,
) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.2)
        return {"message": "Nigeria onboarding started successfully", "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.post(f"/v1/users/{user_id}/onboarding/start-nigeria", json={
            "bvn": bvn, "ngnWalletAddress": ngn_wallet_address, "ngnWalletIndex": ngn_wallet_index,
        })
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI start-nigeria failed ({res.status_code}): {res.text}")
        return res.json()


async def list_nigerian_banks(user_id: str) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.1)
        return {"banks": [{"bankName": "GTBank", "bankCode": "058"}], "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.get(f"/v1/users/{user_id}/bank-accounts/nigerian-banks")
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI list_nigerian_banks failed ({res.status_code}): {res.text}")
        return res.json()


async def verify_nigerian_account(user_id: str, bank_code: str, account_number: str) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.2)
        return {"accountNumber": account_number, "accountName": "MOCK ACCOUNT HOLDER", "bankName": "Mock Bank", "bankCode": bank_code, "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.post(f"/v1/users/{user_id}/bank-accounts/verify-nigerian-account", json={
            "bankCode": bank_code, "accountNumber": account_number,
        })
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI verify_nigerian_account failed ({res.status_code}): {res.text}")
        return res.json()


async def create_withdrawal_account(
    user_id: str, account_number: str, bank_code: str, bank_name: str, account_holder_name: str,
) -> dict:
    """Looks up or creates the Nigerian payout account a withdrawal will
    settle to. Call verify_nigerian_account first to get the exact
    accountHolderName BMONI expects."""
    if MOCK_MODE:
        await asyncio.sleep(0.2)
        return {"id": f"mock-bank-account-{random.randint(100000, 999999)}", "accountNumber": account_number, "bankName": bank_name, "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.post(f"/v1/users/{user_id}/bank-accounts/withdrawal-accounts/nigeria", json={
            "accountNumber": account_number, "bankCode": bank_code,
            "bankName": bank_name, "accountHolderName": account_holder_name,
        })
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI create_withdrawal_account failed ({res.status_code}): {res.text}")
        return res.json()


async def initiate_nigeria_withdrawal(
    user_id: str, source_smart_wallet_id: str, bank_account_id: str, from_amount: str,
) -> dict:
    """Creates and auto-approves an offramp proposal, returning an
    EIP-712 sign payload. Sign it (sign_withdrawal_payload) and submit via
    submit_proposal_signature to actually move money — on-chain execution
    triggers the equivalent NGN payout via Anchor NIP."""
    if MOCK_MODE:
        await asyncio.sleep(0.3)
        return {"proposalId": f"mock-proposal-{random.randint(100000, 999999)}", "signPayload": {"mock": True}, "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.post(f"/v1/users/{user_id}/withdrawal/wallet/nigeria", json={
            "sourceSmartWalletId": source_smart_wallet_id,
            "bankAccountId": bank_account_id,
            "fromAmount": from_amount,
        })
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI initiate_nigeria_withdrawal failed ({res.status_code}): {res.text}")
        return res.json()


def sign_withdrawal_payload(sign_payload: dict) -> str:
    """The withdrawal proposal's signPayload is a standard EIP-712
    typed-data object (domain/types/primaryType/message) — sign it
    directly with the owner key, independent of BMONI's SDK."""
    if MOCK_MODE:
        return "0xMOCKSIGNATURE"
    owner = _owner_account()
    typed_data = sign_payload.get("typedData") or sign_payload
    signable = encode_typed_data(full_message=typed_data)
    signed = Account.sign_message(signable, private_key=owner.key)
    return "0x" + signed.signature.hex()


async def submit_proposal_signature(user_id: str, proposal_id: str, signature: str) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.3)
        return {"data": {"proposal": {"id": proposal_id, "status": "EXECUTED"}}, "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.post(f"/v1/users/{user_id}/smart-wallets/proposals/{proposal_id}/sign", json={
            "signature": signature,
        })
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI submit_proposal_signature failed ({res.status_code}): {res.text}")
        return res.json()


async def get_wallets(user_id: str) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.1)
        return {"wallets": [], "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.get(f"/v1/users/{user_id}/smart-wallets/account/wallets")
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI get_wallets failed ({res.status_code}): {res.text}")
        return res.json()


async def get_real_balances(user_id: str) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.1)
        return {"data": {"balances": []}, "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.get(f"/v1/users/{user_id}/smart-wallets/account/balances")
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI get_balances failed ({res.status_code}): {res.text}")
        return res.json()


async def get_real_transactions(user_id: str, smart_wallet_id: str) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.1)
        return {"transactions": [], "environment": "sandbox-mock"}
    async with httpx.AsyncClient(base_url=BASE_URL, headers=_headers(), timeout=REQUEST_TIMEOUT) as client:
        res = await client.get(f"/v1/users/{user_id}/smart-wallets/{smart_wallet_id}/transactions")
        if res.status_code >= 400:
            raise RuntimeError(f"BMONI get_transactions failed ({res.status_code}): {res.text}")
        return res.json()


async def onboard_full(first_name: str, email: str, phone_number: str, bvn: str = SANDBOX_TEST_BVN) -> dict:
    """One-time orchestration run at ElderPay account registration:
    create user -> create wallet -> KYC -> activate NGN rail. Each step
    can raise — the caller decides whether a partial failure still lets
    the local ElderPay account exist (it should; BMONI onboarding is
    best-effort, never a hard gate on using the rest of the app).
    Returns the identifiers to persist on the local Account so this
    never needs to run again for this user."""
    user = await create_user(first_name, email, phone_number, bvn)
    bmoni_user_id = user["bmoniUserId"]

    wallet = await create_smart_wallet(bmoni_user_id)
    wallet_id = wallet["id"]
    wallet_address = wallet.get("walletAddress")

    await submit_kyc(bmoni_user_id, first_name, phone_number, bvn)
    await activate_nigeria_rail(bmoni_user_id, wallet_address or "", 0, bvn)

    return {
        "bmoniUserId": bmoni_user_id,
        "bmoniSmartWalletId": wallet_id,
        "bmoniWalletAddress": wallet_address,
    }


async def link_nigerian_bank_account(user_id: str, account_number: str, bank_code: str) -> dict:
    """One-time: verifies the customer's real Nigerian bank account (name-
    enquiry) then registers it as their withdrawal payout account. Persist
    the returned id on the local Account — every future real withdrawal
    reuses it without asking the customer to re-link anything."""
    verified = await verify_nigerian_account(user_id, bank_code, account_number)
    withdrawal_account = await create_withdrawal_account(
        user_id, account_number, bank_code, verified["bankName"], verified["accountName"],
    )
    return withdrawal_account


async def create_transfer(amount: Optional[int], recipient: Optional[str]) -> dict:
    """Generic app-level transfer used by send/deposit/airtime — these
    don't map to a documented BMONI endpoint (no P2P-send-to-arbitrary-
    recipient or NGN-only deposit exists in the API; see module docstring),
    so they stay on this app's own balance bookkeeping. Real Nigeria
    withdrawal is handled separately via initiate_nigeria_withdrawal +
    sign_withdrawal_payload + submit_proposal_signature."""
    await asyncio.sleep(1.0)
    return {
        "status": "success",
        "reference": _mock_reference(),
        "amount": amount,
        "recipient": recipient,
        "environment": "sandbox-mock",
    }


async def get_transaction_status(reference: str) -> dict:
    await asyncio.sleep(0.25)
    return {"status": "confirmed", "reference": reference, "environment": "sandbox-mock"}


async def get_account_balance(account_id: str) -> dict:
    await asyncio.sleep(0.2)
    return {"accountId": account_id, "balance": 300000, "currency": "NGN", "environment": "sandbox-mock"}


def generate_receipt(tx: TransactionRecord) -> dict:
    """Labels the receipt by what actually happened to this transaction,
    not by whether BMONI is configured globally — "send"/"deposit"/
    "airtime" always settle on this app's own ledger (see create_transfer's
    docstring), so their reference is always the local EP-MOCK- one even
    when real BMONI withdrawals are live. Checking the reference itself
    avoids a receipt claiming "sandbox-live" next to an EP-MOCK- reference."""
    is_real = bool(tx.bmoniReference) and not tx.bmoniReference.startswith("EP-MOCK-")
    return {
        "transactionId": tx.id,
        "type": tx.action,
        "amount": tx.amount,
        "recipient": tx.recipient,
        "reference": tx.bmoniReference,
        "status": tx.state,
        "date": tx.createdAt,
        "environment": "sandbox-live" if is_real else "sandbox-mock",
    }
