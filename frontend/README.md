# ElderPay Frontend

React + TypeScript + Vite client for ElderPay — the voice UI, the onboarding wizard, the virtual POS, and the agent status view.

## Setup
```bash
npm install
cp .env.example .env   # VITE_API_BASE=http://localhost:4000
npm run dev
```
Requires the backend running (see `../backend/README.md`) — most pages call it directly and don't work standalone. Browser microphone/camera permissions are required for voice input and face verification.

## Scripts
- `npm run dev` — dev server
- `npm run build` — typecheck (`tsc -b`) then production build
- `npm run lint` — oxlint
- `npm run preview` — preview a production build

## Routes
| Path | Page | Purpose |
|---|---|---|
| `/` | `Landing.tsx` | Marketing/pitch page |
| `/onboarding` | `Onboarding.tsx` | Onboarding wizard: language → name → email (optional) → address → face capture → review |
| `/app` | `App.tsx` | The virtual POS: look up by name/phone → face verify → speak a request → confirm → face verify → receipt |
| `/pos` | `Pos.tsx` | Read-only agent view — BMONI/storage status, transaction status lookup by ID, no customer data |
| `/history` | `History.tsx` | Transaction history for the demo account |

## Structure
```
src/
  lib/
    api.ts          Every backend call, one function per route
    audio.ts        getUserMedia recording + Meyda MFCC feature extraction (spoken commands, and the unused voice-auth path)
    faceAuth.ts      face-api.js model loading + client-side face descriptor capture
    challenge.ts     Random-digit spoken challenge generator — unused by the active flow, kept for the parked voice-auth path
    phrases.ts       Per-language spoken/display strings + speechSynthesis wrapper
  pages/
    Landing.tsx, Onboarding.tsx, App.tsx, Pos.tsx, History.tsx
  types.ts          Shared types — mirrors backend/app/models.py
```

## Key flows

**Onboarding** (`Onboarding.tsx`): pick a language, the agent types the customer's full name, address, and optional email as they say them, then captures a real face descriptor via the device camera, before `POST /api/accounts/register` + `POST /api/face/register`.

**Session auth** (`App.tsx`, `card`/`faceAuth`/`authFailed` steps): agent enters the customer's name or phone number (no card number needed once onboarded), then a real face check gates entry — client-captured descriptor, `POST /api/face/authorize`. Accounts with no registered face (the two seeded demo accounts) fall back to a disclosed simulated match instead.

**Transaction** (`listen`/`confirm`/`clarify`/`face`/`processing`/`receipt` steps): speak or pick a quick-demo intent; if the recipient isn't recognized, the agent looks them up by bank + account number and the resolved name is read back (with a repeat button) for the customer to confirm; a real face check gates the transaction before the backend executes against BMONI (mock or live sandbox) and a receipt is shown.

## Honest limitations
- Face verification is real for any account with a registered descriptor; only the two seeded legacy demo accounts fall back to a disclosed simulated match, shown clearly on-screen.
- `voice_auth`-related client code (`authorizeVoice`, `registerVoice`, `challenge.ts`) still exists and works against the backend, but nothing in the active UI calls it — voice authentication is parked for a later phase, not deleted.
- Yorùbá/Hausa/Igbo/Pidgin strings in `phrases.ts` are best-effort translations, not reviewed by native speakers.
