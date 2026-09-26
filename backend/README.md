# NativePay Backend

FastAPI service backing the NativePay frontend: speech-to-text + intent parsing, the transaction state machine, face-based auth, and account enrollment. Storage is in-memory unless `DATABASE_URL` is set (Postgres); BMONI runs in sandbox mode — built for the NITHUB Innovation Fair Hackathon 2026, not production.

## Setup
```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in OPENAI_API_KEY (primary) and GROQ_API_KEY (fallback) at minimum
uvicorn app.main:app --reload --port 4000
```
Runs on `http://localhost:4000`. Visit `http://localhost:4000/docs` for the auto-generated Swagger UI.

## Tests
```bash
python -m pytest tests/ -v
```
(Run as `python -m pytest`, not bare `pytest` — the module needs the repo root on `sys.path`.)

34 cases in `tests/test_critical_flow.py` (service-layer): invalid amount, unknown recipient, low-confidence clarification, blocked out-of-order execution, the confirm→face-verify→send→success happy path, idempotency, cancellation, name lookup, and face/voice auth.

59 cases in `tests/test_api_endpoints.py` (HTTP layer, via FastAPI's `TestClient`): every route below, plus the security-relevant negative paths — rejected/invalid face descriptors, the production-vs-dev face-fallback behavior, session/ownership enforcement, the agent-key guard, transaction expiry, reconciliation-on-ledger-failure, and concurrent `/api/transactions/send` calls only executing once.

## Security / production settings

Everything below is opt-in and defaults to the previous hackathon-demo behavior — nothing changes until you set these. See `.env.example` for the full list and `app/services/config.py` for the source of truth.

| Setting | Default | What it does |
|---|---|---|
| `ENVIRONMENT=production` | `development` | Makes `DATABASE_URL` and `FRONTEND_ORIGIN` mandatory at startup (refuses to boot without them), turns `REQUIRE_AUTH` on by default, and permanently disables the client-asserted face-match fallback regardless of an account's enrollment state |
| `FRONTEND_ORIGIN` | unset (CORS `*`) | Restricts CORS to this one origin |
| `REQUIRE_AUTH` | `false` (`true` in production) | Requires a session token (`POST /api/session/start`, obtained via a real face match) on account/transaction endpoints, and enforces that a session can only touch its own userId's data |
| `AGENT_API_KEY` | unset (open) | Requires this value in an `X-Agent-Key` header on account registration/lookup and every `/api/bmoni/*` / `/api/agent/*` route |
| `SESSION_TTL_SECONDS` / `TRANSACTION_TTL_SECONDS` | `1800` / `300` | How long a session or an unconfirmed transaction stays valid |

## API reference

### Voice & language
| Route | Method | Purpose |
|---|---|---|
| `/api/voice/process` | POST | Transcribe audio (multipart `audio` + optional `language`) and parse it into an intent |
| `/api/transcribe` | POST | Transcribe only, no intent parsing |
| `/api/ai/intent` | POST | Parse intent from raw text |
| `/api/voice/register` | POST | Store a voiceprint (`userId`, `featureVector`) — overwrites any existing one |
| `/api/voice/authorize` | POST | Compare a feature vector against the stored voiceprint; returns `{authorized, similarity, threshold}` |
| `/api/voice/status/{userId}` | GET | Whether a voiceprint is on file for this user |
| `/api/languages` | GET | Supported language codes/labels |

### Accounts
Requires an `X-Session-Token` (see `/api/session/start` below) owning the given `id` when `REQUIRE_AUTH` is on; `register`/`by-card`/`search` require `X-Agent-Key` instead when `AGENT_API_KEY` is set (pre-session identification/agent operations, not customer-owned data).

| Route | Method | Purpose |
|---|---|---|
| `/api/session/start` | POST | `{userId, faceDescriptor}` → verifies the face match server-side and returns a session token (required by other endpoints once `REQUIRE_AUTH` is on) |
| `/api/accounts/register` | POST | Create an account (`userId`, `fullName`, `address`, `language`, optional `email`) — 409 if the userId already exists |
| `/api/accounts/by-card/{cardNumber}` | GET | Pre-session identification by card number |
| `/api/accounts/search?name=` | GET | Pre-session identification by name (returns id/name only) |
| `/api/accounts/{id}` | GET | Fetch an account profile |
| `/api/accounts/{id}/balance` | GET | Balance lookup |

### Transactions
Requires the owning session's `X-Session-Token` when `REQUIRE_AUTH` is on.

| Route | Method | Purpose |
|---|---|---|
| `/api/transactions/confirm` | POST | Two shapes: no `id` → evaluate a new intent into a transaction; `id` present → advance `CONFIRMATION_REQUIRED` → `FACE_VERIFICATION_REQUIRED` |
| `/api/transactions/verify-face` | POST | Record the face-match result for a transaction — verifies server-side against the stored descriptor whenever the account has one on file (a request with no descriptor is rejected outright in that case); the client-asserted `matched` fallback is honored only for an account with *no* registered face, and only outside `ENVIRONMENT=production` |
| `/api/transactions/send` | POST | Execute a `FACE_VERIFIED` transaction against BMONI (mock); idempotent and safe under concurrent calls (only one execution ever debits/credits the ledger) |
| `/api/transactions/{id}/cancel` | POST | Cancel a transaction |
| `/api/transactions` | GET | List transactions, optional `?userId=` filter |
| `/api/transactions/{id}` | GET | Fetch one transaction |
| `/api/transactions/{id}/receipt` | GET | Receipt for a `TRANSACTION_SUCCESS` transaction |
| `/api/banks` | GET | Nigerian bank list (BMONI sandbox in mock mode) |
| `/api/verify-account?accountNumber=&bankCode=` | GET | Standalone name-enquiry utility — same lookup `resolve-recipient` uses internally |

A transaction left unconfirmed/unverified for longer than `TRANSACTION_TTL_SECONDS` moves to `TRANSACTION_EXPIRED` on the next call touching it. If BMONI's side of a `send` succeeds but the local balance update then fails, the transaction lands in `RECONCILIATION_REQUIRED` (never a false `TRANSACTION_SUCCESS`).

### BMONI onboarding + withdrawal (real sandbox, per BMONI's OpenAPI reference)
Every route below requires `X-Agent-Key` when `AGENT_API_KEY` is set.

BMONI identity belongs to the **POS agent/platform, not the customer** — like real agent-banking networks (OPay, Moniepoint, Paga agents), the agent is the one KYC'd business operator with a real wallet; customers only ever have a local NativePay ledger balance (`store.accounts`) and never touch BMONI's KYC/SumSub review themselves. That would reintroduce exactly the digital-onboarding friction NativePay exists to remove.

Self-custodied smart-wallet flow (run once for the agent, not per customer): create user → create wallet (owner-proof challenge + EIP-191 signature) → KYC (profile PATCH + SumSub activation) → activate NGN rail → read wallet/balance/transactions → withdraw to a real Nigerian bank account (offramp proposal + EIP-712 signature). Runs in mock mode until `BMONI_API_KEY`/`BMONI_OWNER_PRIVATE_KEY` are set.

| Route | Method | Purpose |
|---|---|---|
| `/api/agent/bmoni-onboard` | POST | **One-time setup for the agent's own BMONI identity** — runs the full chain (user → wallet → KYC → activate rail → optional bank-account link) and persists it to the shared `AgentBmoniProfile`. Idempotent — no-ops if already onboarded. |
| `/api/agent/bmoni-status` | GET | The agent's current BMONI onboarding state |

Once the agent's profile is onboarded + bank-linked, every customer's `withdraw` action automatically routes through the real BMONI offramp chain (`transaction_service._execute_real_nigeria_withdrawal`) instead of the mock — the agent's wallet settles the cash, the customer's own local balance is what's debited.

The routes below are granular per-step testing utilities over the raw BMONI API (the `{id}` in each is a `bmoniUserId`, always the agent's in this app — never a customer's):
| Route | Method | Purpose |
|---|---|---|
| `/api/bmoni/generate-owner-wallet` | POST | Generates the EVM keypair that signs owner-proof challenges and withdrawal proposals |
| `/api/bmoni/users` | POST | Create a BMONI sandbox user (optionally with a BVN to auto-fill profile fields) |
| `/api/bmoni/users/{id}/wallet` | POST | Owner-proof challenge → sign (EIP-191) → create managed smart wallet |
| `/api/bmoni/users/{id}/kyc` | POST | PATCH the KYC profile (BVN) then activate it for SumSub review |
| `/api/bmoni/users/{id}/onboarding-status` | GET | Check onboarding status across providers |
| `/api/bmoni/users/{id}/activate-nigeria` | POST | Activate the NGN rail |
| `/api/bmoni/users/{id}/wallets` | GET | Real wallet list |
| `/api/bmoni/users/{id}/real-balances` | GET | Real wallet balances |
| `/api/bmoni/users/{id}/wallets/{smartWalletId}/real-transactions` | GET | Real wallet transaction history |
| `/api/bmoni/users/{id}/nigerian-banks` | GET | Supported banks + CBN codes for withdrawal |
| `/api/bmoni/users/{id}/verify-nigerian-account` | POST | Name-enquiry on a Nigerian account number before creating a withdrawal account |
| `/api/bmoni/users/{id}/withdrawal-account` | POST | Register the payout bank account a withdrawal settles to |
| `/api/bmoni/users/{id}/withdraw-nigeria` | POST | Full real withdrawal round trip: creates the offramp proposal, signs the EIP-712 payload, submits the signature |

There's no BMONI endpoint for arbitrary P2P "send" or an NGN-only deposit (only card/crypto deposit exist), so this app's send/deposit/airtime actions keep using its own balance bookkeeping — matching the quick-start doc's note that sandbox wallets are funded manually by BMONI staff, not via API.

### Health
`/api/health` — `{ok, environment, demoMode, bmoniMockMode, aiProvider, dbConnected, authRequired}`

## Structure
```
app/
  main.py                    FastAPI routes
  models.py                  Pydantic models (mirrors frontend/src/types.ts)
  services/
    groq_service.py            Whisper STT + LLM intent parsing via Groq — the fallback provider (see ai_provider.py)
    openai_service.py          Same job via OpenAI (gpt-4o-transcribe + gpt-5-mini) — the primary provider
    ai_provider.py              Tries OpenAI first, falls back to Groq automatically on missing config or a failed call
    yarngpt_service.py         YarnGPT TTS (speech-out) — Nigerian-accented read-back voice
    bmoni_service.py           Real BMONI sandbox integration (mock fallback) — money movement AND bank-account name-enquiry (recipient resolution); Paystack was dropped in favor of consolidating on one provider
    transaction_service.py     State machine, server-side validation
    face_auth.py               Face descriptor storage + Euclidean-distance match (the real auth gate)
    voice_auth.py              MFCC cosine-similarity voice pre-check (not wired into the active flow — see Notes)
    db.py                      Optional Postgres persistence for accounts/face/voice data (DATABASE_URL)
    languages.py                Fixed-phrase translations
    store.py                    Account/transaction storage — Postgres-backed via db.py when configured, in-memory otherwise
tests/
  test_critical_flow.py        pytest
```

## Notes
- Voice is two separate real integrations, not one: **speech-to-text + intent parsing** (via `ai_provider.py` — OpenAI primary, Groq fallback, see below) transcribes what the user says and extracts the transaction intent; **YarnGPT** synthesizes the Nigerian-accented voice that reads confirmations/balances back (speech-out). Requires at least one of `OPENAI_API_KEY`/`GROQ_API_KEY`, plus `YARNGPT_API_KEY` for TTS — without them, `/api/voice/process` or `/api/tts` fail (the frontend falls back to `speechSynthesis` for TTS, and surfaces STT failures as a network error rather than crashing).
- **STT + intent parsing provider fallback** (`app/services/ai_provider.py`): OpenAI (`gpt-4o-transcribe` for transcription, `gpt-5-mini` for intent extraction) is tried first. Groq (`whisper-large-v3` + `openai/gpt-oss-120b`) is used automatically whenever `OPENAI_API_KEY` isn't set, or whenever a live OpenAI call raises (timeout, rate limit, outage) — logged as a warning, not surfaced as an error, since the whole point is that the caller shouldn't notice. `/api/health`'s `aiProvider` field reports which one is configured as primary (not which one served the last request). `main.py` always calls `ai_provider`, never `groq_service`/`openai_service` directly, so this fallback can't accidentally be bypassed.
- BMONI calls use `httpx.AsyncClient` against the real sandbox (`x-api-key` auth, no `/v1` appended to the base URL) once `BMONI_API_KEY`/`BMONI_OWNER_PRIVATE_KEY` are set; `bmoniMockMode` in `/api/health` reflects that. The self-custodied wallet's owner-proof challenge is signed with `eth_account` (EIP-191), and Nigeria bank withdrawals are signed with EIP-712 typed data — both since this backend has no Flutter/React Native SDK access. P2P send and NGN deposit have no corresponding BMONI endpoint, so those stay on this app's own balance bookkeeping.
- Pydantic (`models.py`) validates request bodies — malformed shapes get a 422 automatically.
- CORS is open (`allow_origins=["*"]`) whenever `FRONTEND_ORIGIN` is unset, for local-dev convenience — `ENVIRONMENT=production` requires `FRONTEND_ORIGIN` and refuses to start without it (see the Security/production-settings section above).
- Face capture (`face_auth.py`) is the mandatory authorization gate for every transaction and for login when a stored face descriptor exists for that account — no PIN, no password. `voice_auth.py` (MFCC cosine similarity, not trained speaker-verification) still exists and is still tested, including a stricter transaction-time path that *can* skip the mandatory face check (`POST /api/transactions/confirm`'s optional `voiceFeatureVector`, `TRANSACTION_VOICE_MATCH_THRESHOLD`), but the current frontend never sends that field — voice auth is parked for a later phase, not deleted. Every transaction still records which method actually verified it (`verificationMethod: "face" | "voice"`).
- Storage: `store.py`/`face_auth.py`/`voice_auth.py` write to Postgres when `DATABASE_URL` is set (`db.py` creates the schema and seeds the demo account on startup); otherwise everything lives in process memory and restarting the server clears every account, face/voice data, and transaction. If `DATABASE_URL` is set but unreachable at startup: in development it logs the failure and falls back to in-memory; with `ENVIRONMENT=production` it raises instead and the process refuses to start, rather than silently running a production deployment on in-memory storage.
- Supported `action` values: `send`, `withdraw`, `deposit`, `airtime`, `balance` (`bill`, and anything the intent parser can't classify, resolve to the explicit `UNSUPPORTED_ACTION` state rather than being treated as one of the above). Send/withdraw/airtime debit the account's balance and require an amount that doesn't exceed it (`INSUFFICIENT_FUNDS` otherwise); deposit credits it. `airtime` uses `recipient` to hold the phone number being topped up, not a contact name — it isn't checked against the recipient book the way `send` is.
