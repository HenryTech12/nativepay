# ElderPay

Voice-first banking for people the app-based banking model leaves out — built for the **NITHUB Innovation Fair Hackathon 2026**.

## The problem

Nigeria's agent-banking networks (OPay, PalmPay, Moniepoint) already solved *physical* access to financial services — there's an agent within reach of most people. What's still locked out is the *interaction layer*: an app UI in English, PINs to remember, menus to read. Nigeria has 500+ languages; English is official but not most people's first language, especially older adults, rural traders, and market women. Roughly 30–36% of Nigerian adults remain financially excluded or under-served (EFInA/CBN), and a meaningful share of that is a literacy/language barrier on top of infrastructure that already reaches them.

ElderPay replaces the app UI with a conversation. Speak in English, Nigerian Pidgin, Yorùbá, Hausa, or Igbo, at a participating agent's terminal — no reading, no PIN.

## How it works

1. **Onboard once** — the agent picks a language for the customer, then enters their name and address as they speak them (email is optional — most elderly customers don't have one, or can't recall it), and captures a real facial descriptor via the device camera.
2. **Log back in with just a name or phone number** — no card number to remember. The card being plugged into the POS is the physical gesture; the actual lookup only needs what the customer can tell the agent.
3. **Verify it's you** — a real face check, client-captured and server-matched, gates both login and every transaction.
4. **Speak naturally** — "Send ten thousand naira to Adewale" — transcribed and parsed into an intent (amount, recipient, action).
5. **Confirm out loud** — ElderPay reads the transaction back before anything moves, with a repeat button if the customer needs to hear it again.
6. **BMONI executes** it — send, withdraw, deposit, airtime top-up, or a balance check — and a spoken + digital receipt confirms it. Send/withdraw/airtime/deposit all move the account's real balance; an insufficient-funds check blocks send/withdraw/airtime before confirmation if the amount exceeds it.

## Architecture

```
native-pay/
  frontend/    React + TypeScript + Vite client — the voice UI, the virtual POS, the agent status view
  backend/     FastAPI service — speech-to-text, intent parsing, the transaction state machine, face auth
```

The two talk over HTTP; the frontend expects the backend at `http://localhost:4000` by default (`frontend/.env`'s `VITE_API_BASE`). See `frontend/README.md` and `backend/README.md` for setup and endpoint details on each side.

## Identity & auth model

**Face verification is the sole biometric gate** — at login (whenever an account has a registered face) and again before every transaction executes, regardless of anything else in the session. It's real: a 128-float facial descriptor captured client-side (face-api.js, self-hosted model weights) and compared server-side via Euclidean distance — never a raw photo sent or stored.

Voice does real work elsewhere — Groq Whisper transcribes spoken commands, an LLM parses them into intents, YarnGPT speaks confirmations back — but it isn't used to authenticate anyone right now. A voice-authentication path (MFCC cosine similarity) still exists in the backend and is tested, parked for a later phase when it scales back in.

The two seeded demo accounts predate face enrollment and have no descriptor on file, so logging in or transacting with them shows a clearly-labeled simulated fallback ("Simulate: match/no match") instead — every other account onboarded through the app uses the real check.

## Quickstart

**Backend** (see `backend/README.md` for details):
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY
uvicorn app.main:app --reload --port 4000
```

**Frontend** (see `frontend/README.md` for details):
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE=http://localhost:4000
npm run dev
```

Then open the printed local URL. Key routes: `/` (landing), `/onboarding` (sign up), `/app` (virtual POS), `/pos` (agent status view), `/history`.

## Honest limitations (sandbox/demo mode)

- **Face verification is real for onboarded accounts**, but only ever simulated (openly, on-screen) for the two seeded legacy demo accounts that predate the feature.
- **BMONI runs in mock mode** by default — no real money moves unless sandbox API keys are configured.
- **Storage persists to Postgres if `DATABASE_URL` is set**; otherwise it's in-memory and restarting the backend clears every account and transaction. The `/pos` agent view shows which mode is actually active.
- **Yorùbá/Hausa/Igbo/Pidgin translations** are best-effort, not reviewed by native speakers — sanity-check before a live pitch if you have access to one.
- **Voice matching** (MFCC cosine similarity) exists in the backend but isn't wired into the active auth flow — not a production biometric claim either way.

## Tests

```bash
cd backend && python -m pytest tests/ -v   # 34 cases: validation, the confirm→face→send→success happy path, idempotency, cancellation, name lookup, face/voice auth
cd frontend && npx tsc -b && npm run build # typecheck + production build
```
