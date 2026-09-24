# ElderPay — Pitch Thesis & Demo Readiness

Notes for pitching ElderPay at the NITHUB Innovation Fair — the argument to lead with, why the demo lands, and what to fix before you're in front of judges.

## The thesis

The easy pitch is "a banking app for the unbanked." Don't lead with that — it's weaker than what's actually true, and it invites the obvious pushback ("OPay/PalmPay/Moniepoint already did this").

The sharper, more defensible version: **Nigeria's agent-banking networks already solved physical access.** There's an agent within reach of most people, card-reading POS hardware already exists, cash-in/cash-out already works. What's still locked out is the *interaction layer* — an app UI in English, PINs to remember, menus to read. Roughly 30–36% of Nigerian adults remain financially excluded or under-served (EFInA/CBN), and a meaningful share of that isn't a distance-to-an-agent problem, it's a literacy/language problem sitting on top of infrastructure that already reaches them.

ElderPay doesn't propose new banking rails. It replaces the interface on top of the rails that already exist — voice instead of a screen you have to read, a spoken confirmation instead of a PIN, face verification instead of a password. That framing survives a skeptical judge better than "another fintech app" does, because it's precise about what's actually new here versus what's being reused.

## Why the demo lands (three pillars)

**1. Language authenticity, heard live.** Judges don't read a slide claiming multilingual support — they hear Yorùbá, Hausa, Igbo, Pidgin, and English actually being spoken and understood, in the room. That's a materially different (and harder to fake) impression than most hackathon demos give.

**2. The physical-device illusion.** A card visibly slides into a slot on a device that looks like real POS hardware, a receipt prints out of a slot, a keypad actually works. This is a deliberate trick to make a browser demo read as "real hardware" rather than "a webpage" — and it's the kind of visual, memorable moment that sticks with judges scoring dozens of pitches in a row.

**3. Security depth that survives probing.** Face verification — a real, client-captured facial descriptor compared server-side, not a stand-in — is the mandatory hard gate before any money moves, both at login and again before every transaction executes. Confirmation-before-execution isn't a UI convention — it's enforced in the backend state machine itself (a send/withdraw literally cannot reach `TRANSACTION_SUCCESS` without passing through confirmation and face verification first, and this is covered by automated tests). When a judge asks "what if the AI mishears the amount" or "what stops someone else from cashing out," there's a real, specific, technical answer — not hand-waving.

## Pre-demo readiness

### Critical — resolve before demo day

**Groq (STT/intent parsing) and YarnGPT (TTS) have never been exercised with real API keys against real speech, in an environment with real network access.** Everything was built, typechecked, and tested against the parts of the system that don't require those two external services — the auth/confirmation/transaction logic is thoroughly verified — but the actual speech-in, speech-out path is the one piece still unproven in practice. This matters most for:
- **Numeral parsing**, especially traditional Yorùbá/Hausa/Igbo number words, which are the highest-risk input (see `backend/tests/numeral_phrases.json` and `backend/scripts/verify_numeral_parsing.py` — built specifically to test this, but not yet run against a live key).
- **TTS voice quality** for the confirmation read-back — the whole "reads it back to you in your language" promise depends on this actually sounding right.

Do a full real-key, real-network dry run — ideally with a native speaker sanity-checking the Yorùbá/Hausa/Igbo phrases — before demo day, not during it.

### Already-disclosed limitations (fine to say out loud, don't get caught off guard by them)

- Face verification is real for any account onboarded through the app (client-side descriptor capture via face-api.js, server-side Euclidean-distance match) — the only place it's simulated is a disclosed fallback ("Simulate: match/no match") for the two seeded demo accounts, which predate the feature and have no face on file.
- A voice-authentication path (cosine-similarity heuristic over MFCC vectors) exists in the backend and is still tested, but it's not wired into the active login/transaction flow — face is the sole biometric gate today; voice is parked for a later phase when it scales back in.
- BMONI runs in mock mode by default — no real money moves unless the sandbox API keys are configured.
- Storage persists to Postgres if `DATABASE_URL` is set; otherwise it's in-memory and restarting the backend clears every account and transaction. Check the "Account/face storage" badge on `/pos` to see which mode is actually active.
- Yorùbá/Hausa/Igbo/Pidgin phrase translations are best-effort, not reviewed by a native speaker.

Being upfront about these if asked reads as technical maturity, not weakness — judges tend to trust a team more when they clearly know the edges of what they built.

### Pre-demo checklist

- [ ] Real `GROQ_API_KEY` and `YARNGPT_API_KEY` tested end-to-end outside a network-restricted environment.
- [ ] `backend/scripts/verify_numeral_parsing.py` run for real; review and address any failures.
- [ ] Rehearse the "what if it mishears the amount" question — point to the confirmation gate and the backend test suite (34/34 passing, including the test that proves execution can't happen without confirmation).
- [ ] Have a fallback ready in case live mic/STT struggles in the room (a pre-recorded backup clip, or lean on the quick-demo buttons already built into the UI).
- [ ] If at all possible, get a native Yorùbá/Hausa/Igbo speaker to sanity-check the phrases before they're spoken in front of judges.

## One-line version

*ElderPay doesn't build new banking rails — it replaces the one thing standing between someone and the agent already near them: the interface.*
