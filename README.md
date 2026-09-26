# NativePay

> **Banking that speaks to you.**

NativePay is a **voice-first financial access platform** designed for people who face barriers to conventional digital banking — including older adults, people with disabilities, people with limited literacy or digital literacy, and users who are more comfortable communicating in local languages.

Instead of requiring customers to navigate a smartphone banking app, NativePay brings a conversational financial experience to an **agent/POS environment**.

**Speak → Understand → Confirm → Verify → Transact → Done.**

---

## The Problem

Digital banking has made financial services more convenient, but digital access is not equally accessible to everyone.

Many financial products assume that customers can:

- use a smartphone
- navigate a banking application
- read menus and instructions
- remember authentication credentials
- communicate comfortably in the application's supported language
- interact with conventional digital interfaces

This can create additional barriers for:

- 👵 Older adults
- ♿ People with disabilities
- 📖 People with limited literacy
- 📱 People with limited digital literacy
- 🗣️ People who prefer local languages
- 🌍 Other users underserved by conventional digital banking interfaces

Nigeria already has an extensive agent-banking ecosystem. NativePay focuses on the **interaction layer** that can prevent some users from taking full advantage of that infrastructure.

---

# The Solution

NativePay transforms an agent/POS terminal into a **conversational financial interface**.

Instead of:

```text
Customer → Smartphone → Banking App → Menus / Text / PIN → Transaction
```

NativePay provides:

```text
Customer → NativePay Agent / POS → Natural conversation
         → Transaction confirmation → Biometric verification
         → Financial transaction
```

A customer can speak naturally:

> “I want to send ₦5,000 to my daughter.”

NativePay understands the request, resolves the recipient, reads the transaction back to the customer, obtains confirmation, verifies their identity, and completes the transaction through the configured financial rail or demo ledger.

---

# Core Experience

## 1. Onboard

An agent helps the customer create their NativePay profile.

The customer selects their preferred language and provides the required account information.

The system can capture a facial descriptor using the device camera for identity verification.

## 2. Identify the Customer

The customer can be located using information such as their name or phone number.

## 3. Verify Identity

NativePay uses face verification as the biometric authorization layer.

```text
Camera
  ↓
face-api.js
  ↓
128-dimensional face descriptor
  ↓
Server-side comparison
  ↓
Verified / Rejected
```

## 4. Speak Naturally

The customer interacts with NativePay using voice.

Examples:

> “Send ten thousand naira to Adewale.”

> “How much money do I have?”

> “I want to withdraw five thousand.”

> “Buy airtime for my phone.”

The voice pipeline uses speech recognition and structured intent extraction.

## 5. Confirm Before Money Moves

NativePay does not immediately execute a transaction simply because the AI interpreted a request.

Example:

> **“You are sending ₦5,000 to Ngozi Okafor. Would you like to continue?”**

The customer can confirm or cancel.

## 6. Authorize the Transaction

After confirmation, NativePay requires another identity verification step before the transaction is executed.

```text
Voice request
    ↓
Intent extraction
    ↓
Transaction details
    ↓
Customer confirmation
    ↓
Face verification
    ↓
Transaction execution
```

This separates **understanding what the customer wants** from **authorizing the financial action**.

## 7. Complete the Transaction

Depending on the configured environment and transaction type, NativePay can support:

- transfers
- withdrawals
- deposits/cash-in flows
- airtime
- balance checks

The project currently supports both connected sandbox integrations and simulated/demo transaction flows.

## 8. Receipt

```text
Transaction successful

₦5,000

To:
Ngozi Okafor

Reference:
NP-XXXXXXXX

Status:
Successful
```

---

# Supported Languages

- 🇬🇧 English
- 🇳🇬 Nigerian Pidgin
- 🇳🇬 Yorùbá
- 🇳🇬 Hausa
- 🇳🇬 Igbo

Local-language speech and output should be validated with native speakers before production deployment.

---

# Architecture

```text
                         CUSTOMER
                            │
                            │ Voice
                            ▼
                  ┌────────────────────┐
                  │   NativePay POS    │
                  │  Agent Interface   │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Voice Processing   │
                  │ Speech → Text      │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Intent Processing  │
                  │ Action / Amount /  │
                  │ Recipient / etc.  │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Transaction FSM    │
                  │ Validation +       │
                  │ Confirmation       │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Biometric Auth     │
                  │ Face Verification  │
                  └─────────┬──────────┘
                            │
                            ▼
                  ┌────────────────────┐
                  │ Transaction Layer  │
                  └─────────┬──────────┘
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
             BMONI Sandbox       Demo Ledger
                  │                   │
                  └─────────┬─────────┘
                            ▼
                         Receipt
```

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- face-api.js
- Meyda
- Browser MediaRecorder / microphone APIs
- Web Speech Synthesis fallback

## Backend

- Python
- FastAPI
- PostgreSQL
- Pydantic
- HTTPX
- Groq
- YarnGPT
- Paystack
- BMONI

## AI / Voice

### Speech-to-text

Groq Whisper is used to transcribe customer speech.

### Intent extraction

The language model converts natural-language requests into structured transaction intents.

```json
{
  "action": "send",
  "amount": 5000,
  "recipient": "Ngozi"
}
```

### Text-to-speech

YarnGPT is used for spoken responses, with browser speech synthesis available as a fallback where appropriate.

---

# Transaction State Machine

```text
INTENT_DETECTED
       ↓
CONFIRMATION_REQUIRED
       ↓
USER_CONFIRMED
       ↓
FACE_VERIFICATION_REQUIRED
       ↓
FACE_VERIFIED
       ↓
TRANSACTION_PROCESSING
       ↓
TRANSACTION_SUCCESS
```

The AI interprets requests, but the backend remains responsible for deterministic validation and authorization.

---

# Recipient Resolution

NativePay can resolve recipients using:

1. Known NativePay contacts
2. Paystack account resolution where configured

---

# Agent / POS Experience

The POS is designed to be the bridge between the customer and the digital financial system.

The agent should see relevant information such as:

```text
Customer
✓ Identity verified

Current request
Send ₦5,000

Recipient
Ngozi Okafor

Status
✓ Customer confirmed
✓ Identity verified
⏳ Processing
```

Sensitive biometric information should not be exposed to agents.

---

# Project Structure

```text
nativepay/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   └── services/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── DEMO_VIDEO_SCRIPT.md
├── PITCH.md
└── README.md
```

---

# Quick Start

## Requirements

- Python 3.10+
- Node.js
- npm
- PostgreSQL for persistent deployment
- Camera for face enrollment/verification
- Microphone for voice interaction

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 4000
```

Backend:

```text
http://localhost:4000
```

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Configure:

```env
VITE_API_BASE=http://localhost:4000
```

Then:

```bash
npm run dev
```

---

# Environment Variables

## Backend

```env
GROQ_API_KEY=

BMONI_BASE_URL=https://embedded-dev.bmoni.com
BMONI_API_KEY=
BMONI_OWNER_PRIVATE_KEY=

VOICE_MATCH_THRESHOLD=0.85

YARNGPT_API_KEY=
YARNGPT_BASE_URL=https://yarngpt.ai/api/v1

PAYSTACK_SECRET_KEY=

DATABASE_URL=
```

For production, configure PostgreSQL rather than relying on in-memory storage.

## Frontend

```env
VITE_API_BASE=http://localhost:4000
```

---

# Main Routes

| Route | Purpose |
|---|---|
| `/` | NativePay landing page |
| `/onboarding` | Customer onboarding |
| `/app` | Customer / virtual POS experience |
| `/pos` | Agent status interface |
| `/history` | Transaction history |

---

# Development Commands

## Backend

```bash
uvicorn app.main:app --reload --port 4000
```

Tests:

```bash
PYTHONPATH=. python -m pytest tests/ -v
```

## Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

---

# Testing the Critical Flow

```text
1. Create customer
2. Select preferred language
3. Register face
4. Log in
5. Verify face
6. Speak transaction request
7. Parse intent
8. Resolve recipient
9. Validate amount
10. Validate balance
11. Confirm transaction
12. Verify face again
13. Execute transaction
14. Generate receipt
15. Display status on POS
16. View transaction in history
```

---

# Security Principles

### AI does not directly authorize money movement

The model produces an intent. The backend validates and authorizes the transaction.

### Confirmation is mandatory

Customers confirm the interpreted transaction before execution.

### Biometric authorization is separate

Face verification occurs before financial execution.

### Sensitive biometric information is protected

Agents should receive transaction status rather than biometric data.

### Financial operations should be idempotent

Repeated requests must not result in duplicate financial operations.

---

# Current Limitations

NativePay is a hackathon prototype rather than a production banking system.

Current limitations include:

- Some financial operations operate through the demo ledger rather than a live financial rail.
- BMONI is primarily used in sandbox/demo configuration.
- Local-language speech requires further native-speaker validation.
- Voice authentication exists in the backend but is not part of the active authentication flow.
- Production deployment requires hardened authentication, authorization, persistence, monitoring and financial reconciliation.
- Real-world deployment would require appropriate regulatory, security and financial-institution integrations.

---

# Roadmap

## Hackathon MVP

- [x] Voice interaction
- [x] Intent extraction
- [x] Multilingual interaction
- [x] Customer onboarding
- [x] Face enrollment
- [x] Face verification
- [x] Transaction confirmation
- [x] Transaction state machine
- [x] Recipient resolution
- [x] Balance validation
- [x] Transaction history
- [x] Receipt generation
- [x] POS/agent interface
- [x] BMONI sandbox integration

## Reliability & Security

- [ ] Server-enforced biometric verification
- [ ] Strong session authentication
- [ ] Role-based authorization
- [ ] Atomic transaction state transitions
- [ ] Concurrency-safe financial operations
- [ ] External transaction reconciliation
- [ ] Transaction expiry
- [ ] Production PostgreSQL requirement
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Improved external API failure handling

## Accessibility

- [ ] More African languages
- [ ] Improved local-language speech recognition
- [ ] Native-language TTS validation
- [ ] Large-text mode
- [ ] High-contrast mode
- [ ] Improved screen-reader support
- [ ] Alternative interaction methods for additional disabilities

## Financial Infrastructure

- [ ] Deeper financial-rail integrations
- [ ] Real agent cash-in/cash-out workflows
- [ ] Real airtime provider
- [ ] Additional payment providers
- [ ] Settlement and reconciliation infrastructure
- [ ] Production-grade fraud monitoring

---

# Why NativePay?

The goal isn't to build another banking app.

The goal is to make financial technology accessible to people who may not be comfortable with the interfaces that financial technology currently expects them to use.

```text
Instead of teaching everyone to use the app,

bring the financial service into an interaction
they can understand.
```

The agent remains familiar.

The customer speaks naturally.

NativePay handles the digital complexity.

---

# Hackathon

Built for:

**StacStart — Build Without Borders: Borderless Bytes Hackathon 2026**

### Track

**Access & Inclusion**

NativePay addresses access to financial services for users who face barriers to conventional digital banking interfaces.

### Judging Alignment

**Technical Execution — 35%**

Voice pipeline, intent extraction, transaction state machine, biometric verification, financial integration and backend architecture.

**Problem Fit — 25%**

Financial accessibility for older adults, people with disabilities, limited literacy/digital literacy and local-language users.

**Demo & Communication — 20%**

A simple conversational experience with clear confirmation, verification and agent/POS workflow.

**Originality & Innovation — 20%**

Agent/POS-first interaction, voice-first accessibility and separation of AI intent from transaction authorization.

---

# Product Philosophy

NativePay intentionally keeps the customer interface simple.

The customer should not need to understand APIs, AI models, transaction states, payment providers or databases.

They should only need to understand:

```text
Speak
  ↓
Understand
  ↓
Confirm
  ↓
Verify
  ↓
Transact
  ↓
Done
```

**NativePay puts the complexity in the system so the experience can remain simple for the person using it.**

---

## Disclaimer

NativePay is a hackathon prototype and demonstration system. It is not a production banking service, does not itself constitute a bank or regulated financial institution, and should not be used to process real customer funds without appropriate financial, regulatory, security and infrastructure approvals.

## License

Add the project's chosen license before public distribution.
