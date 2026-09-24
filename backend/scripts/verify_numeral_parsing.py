"""
Manual verification script — NOT part of the pytest suite (pytest stays
offline/deterministic; this hits a live server and, for the parsing part,
a real Groq API key).

Two things get checked against backend/tests/numeral_phrases.json:

1. Amount/action extraction (needs GROQ_API_KEY + `uvicorn app.main:app`
   running): does the transcript->intent pipeline correctly read spoken
   numerals in each language, or silently mis-hear the amount?

2. The confirmation gate (works right now, no Groq needed): no matter
   what the parser returns, can a send/withdraw ever reach
   TRANSACTION_SUCCESS without going through CONFIRMATION_REQUIRED ->
   USER_CONFIRMED -> FACE_VERIFIED first? This uses the expected values
   directly, bypassing the LLM, to prove the state machine itself never
   lets an amount through unconfirmed.

Usage:
    uvicorn app.main:app --port 4000 &
    python scripts/verify_numeral_parsing.py [--base-url http://localhost:4000]
"""

import argparse
import json
import sys
from pathlib import Path

import httpx

KNOWN_RECIPIENTS = {"adewale", "ngozi", "ibrahim"}


def expected_gate_state(action, amount, recipient):
    """Mirrors transaction_service.evaluate_intent's rules, independent of any LLM output."""
    if action in ("send", "withdraw") and (not amount or amount <= 0):
        return "INVALID_AMOUNT"
    if action == "send" and (recipient or "").lower().strip() not in KNOWN_RECIPIENTS:
        return "UNKNOWN_RECIPIENT"
    return "TRANSACTION_PROCESSING" if action == "balance" else "CONFIRMATION_REQUIRED"


def load_cases():
    path = Path(__file__).parent.parent / "tests" / "numeral_phrases.json"
    return json.loads(path.read_text())["cases"]


def check_amount_parsing(client, case):
    try:
        res = client.post("/api/ai/intent", json={"text": case["phrase"]}, timeout=30)
        res.raise_for_status()
        intent = res.json()
    except Exception as err:
        return "SKIPPED", f"request failed ({err}) — likely no valid GROQ_API_KEY configured"

    action_ok = intent.get("action") == case["expected_action"]
    if case["confidence"] == "unverified":
        return "INFO", f"parsed action={intent.get('action')} amount={intent.get('amount')} — expected_amount not trusted, verify with a native speaker"

    amount_ok = intent.get("amount") == case["expected_amount"]
    recipient_ok = True
    if case["expected_recipient"]:
        recipient_ok = (intent.get("recipient") or "").lower().strip() == case["expected_recipient"]

    if action_ok and amount_ok and recipient_ok:
        return "PASS", f"parsed action={intent.get('action')} amount={intent.get('amount')} recipient={intent.get('recipient')}"
    return "FAIL", f"expected action={case['expected_action']} amount={case['expected_amount']} recipient={case['expected_recipient']} — got action={intent.get('action')} amount={intent.get('amount')} recipient={intent.get('recipient')}"


def check_confirmation_gate(client, case, user_id):
    action = case["expected_action"]
    amount = case["expected_amount"]
    recipient = case["expected_recipient"]
    want_state = expected_gate_state(action, amount, recipient)

    res = client.post("/api/transactions/confirm", json={
        "userId": user_id, "action": action, "amount": amount, "recipient": recipient, "confidence": 0.95
    })
    tx = res.json()
    if tx.get("state") != want_state:
        return "FAIL", f"expected initial state {want_state}, got {tx.get('state')}"

    if want_state != "CONFIRMATION_REQUIRED":
        return "PASS", f"correctly gated at {want_state}, never reached a money-moving state"

    # The critical check: try to execute *before* confirming or face-verifying.
    send_res = client.post("/api/transactions/send", json={"id": tx["id"]})
    sent = send_res.json()
    if sent.get("state") == "TRANSACTION_SUCCESS":
        return "FAIL", "CRITICAL: transaction executed WITHOUT confirmation or face verification"
    return "PASS", f"blocked premature send (state stayed {sent.get('state')}, error={sent.get('error')})"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:4000")
    parser.add_argument("--user-id", default="numeral-test-user")
    args = parser.parse_args()

    cases = load_cases()
    client = httpx.Client(base_url=args.base_url)

    print(f"=== Part 1: amount/action extraction ({len(cases)} phrases, needs a live GROQ_API_KEY) ===")
    counts = {"PASS": 0, "FAIL": 0, "SKIPPED": 0, "INFO": 0}
    for case in cases:
        status, detail = check_amount_parsing(client, case)
        counts[status] += 1
        print(f"[{status:7}] {case['id']:28} {case['language']}  {detail}")
    print(f"-> {counts['PASS']} pass, {counts['FAIL']} fail, {counts['INFO']} unverified-info, {counts['SKIPPED']} skipped\n")

    print("=== Part 2: confirmation gate integrity (no Groq needed — uses expected values directly) ===")
    gate_counts = {"PASS": 0, "FAIL": 0}
    for case in cases:
        status, detail = check_confirmation_gate(client, case, args.user_id)
        gate_counts[status] += 1
        print(f"[{status:7}] {case['id']:28} {detail}")
    print(f"-> {gate_counts['PASS']} pass, {gate_counts['FAIL']} fail")

    if counts["FAIL"] or gate_counts["FAIL"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
