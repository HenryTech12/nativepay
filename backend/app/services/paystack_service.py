"""
Real Nigerian bank account name-enquiry via Paystack's public "Resolve
Account Number" API — free, no business KYC needed to try with a test
key. Replaces matching a spoken name against a fixed contact list: this
looks up an actual account number + bank code and returns the real
account holder's name.

A test-mode key (sk_test_...) only resolves Paystack's documented test
account numbers, not arbitrary real ones — a live key (sk_live_...) is
needed for real Nigerian bank accounts to resolve.

https://paystack.com/docs/identity-verification/verify-account-number/
"""

import os
import httpx

PAYSTACK_BASE_URL = "https://api.paystack.co"
PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY")


def _headers() -> dict:
    if not PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY not configured")
    return {"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"}


async def list_banks() -> list[dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            f"{PAYSTACK_BASE_URL}/bank",
            params={"country": "nigeria"},
            headers=_headers(),
        )
        res.raise_for_status()
        return res.json()["data"]


async def resolve_account(account_number: str, bank_code: str) -> dict:
    """Returns {"account_number": ..., "account_name": ..., "bank_id": ...} on success."""
    async with httpx.AsyncClient(timeout=15) as client:
        res = await client.get(
            f"{PAYSTACK_BASE_URL}/bank/resolve",
            params={"account_number": account_number, "bank_code": bank_code},
            headers=_headers(),
        )
        res.raise_for_status()
        return res.json()["data"]
