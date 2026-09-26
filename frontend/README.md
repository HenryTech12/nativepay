# NativePay — Banking That Speaks to You

> A hackathon-ready voice-first financial accessibility platform designed for people who face barriers to conventional digital banking.

---

## 🌟 The Product

**NativePay** is built on the core belief that **financial access should not depend on how well someone uses a smartphone**.

Conventional banking apps are overcrowded with nested menus, fine-print text, complex passwords, and unfamiliar terminology. NativePay completely reimagines the financial interaction layer around a natural, human flow:

```
SPEAK  →  UNDERSTAND  →  CONFIRM  →  VERIFY  →  TRANSACT  →  DONE
```

### Primary Users Served
- **Older adults**: Clear, readable typography, auditory confirmations, large touch targets, and zero passwords to remember.
- **People with limited literacy or digital literacy**: Conversational spoken interface, visual clarity, and simple agent-assisted terminal mode.
- **Local language speakers**: Direct support for Nigerian Pidgin, Yorùbá, Hausa, Igbo, and English.
- **Underserved retail communities**: Accessible both as a personal mobile experience and as an agency banking POS terminal.

---

## 🚀 Key Features

1. **Voice-First Financial Interface**
   - Natural spoken interaction with instant recognition.
   - Dual-engine speech architecture: Real-time Web Speech recognition + cloud Whisper transcription.
   - Intelligent multi-dialect intent interpretation covering transfers, balance inquiries, withdrawals, and airtime.

2. **Double-Confirmation Guard**
   - No transaction is ever executed blindly upon speech recognition.
   - NativePay repeats the interpreted request clearly (both visually and audibly), requiring customer confirmation.

3. **Biometric Face Verification**
   - Passwordless identity validation: users confirm who they are simply by looking into the camera.
   - Normalizes 128-dimensional biometric facial descriptors matching the backend contract.
   - Strictly hides raw mathematical descriptors and distances from users and agents.

4. **Dedicated Agent / POS Interface**
   - Designed for large-screen agency kiosks and POS terminals.
   - Fast customer lookup by full name or NativePay card number.
   - Agent assisted workflow without exposing customer biometrics or secrets.

5. **5 Local Language Experiences**
   - English (`en`)
   - Nigerian Pidgin (`pcm` — *«Bank wey dey follow you talk»*)
   - Yorùbá (`yo` — *«Ìfowópamọ́ tó ń bá ọ sọ̀rọ̀»*)
   - Hausa (`ha` — *«Bankin da ke magana da ku»*)
   - Igbo (`ig` — *«Ụlọ akụ na-agwa gị okwu»*)

6. **Instant Digital & Printable Receipts**
   - Formal transaction reference numbers (`NP-XXXXXX`).
   - Detailed audit breakdown with one-click print and share options.

---

## 🔌 Centralized API Architecture

All backend communication is centralized in `src/services/api.ts` and strongly typed.

- **Default Backend**: `https://nativepay.onrender.com`
- **Configurable**: Via `VITE_API_BASE` in `.env`
- **Fallback URL Sanitization**: Normalizes trailing slashes, preventing URL duplication (`//api` or `api/api`).
- **Resilient Error Handling**: Every endpoint handles loading, validation, network errors, timeouts, and unavailable services with human-readable messaging.

### Key API Routes Integrated:
- `GET /api/health` — Backend health and sandbox mode indicator.
- `GET /api/languages` — Supported local languages.
- `GET /api/accounts/search?name={name}` — Name-based customer lookup.
- `GET /api/accounts/by-card/{cardNumber}` — Card-based customer lookup.
- `GET /api/accounts/{id}` & `GET /api/accounts/{id}/balance` — Account profile & real-time balance.
- `POST /api/accounts/register` — Customer onboarding and card issuance.
- `POST /api/face/register` & `POST /api/face/authorize` — Biometric face vector enrollment & authorization.
- `POST /api/session/start` — Face-authenticated customer session initiation.
- `GET /api/transactions` — Transaction ledger history.
- `POST /api/transactions/confirm` — Transaction intent confirmation.
- `POST /api/transactions/verify-face` — Transaction biometric validation.
- `POST /api/transactions/send` — Final funds settlement.
- `POST /api/ai/intent` — AI-powered natural language intent extraction.
- `POST /api/tts` — Cloud Text-To-Speech speech synthesis.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (financial accessibility design system)
- **Icons**: Lucide React
- **Biometrics**: HTML5 Video Canvas frame analysis with 128-d L2-normalized vector extraction
- **Speech**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) + Cloud Voice Fallbacks

---

## 💻 Getting Started

### 1. Environment Configuration
Create a `.env` file (or copy `.env.example`):
```bash
VITE_API_BASE="https://nativepay.onrender.com"
```

### 2. Install & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Build & Lint
```bash
npm run lint
npm run build
```
