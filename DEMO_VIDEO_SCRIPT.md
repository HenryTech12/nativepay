# ElderPay — 3-Minute Backup Demo Video Script

Target runtime: ~3:00. Record screen (browser tab on the deployed app) + your voice narrating over it. Where the *app itself* speaks (YarnGPT), let that audio play through — it's part of the proof, not something to talk over.

Central persona for this cut: **an elderly Nigerian who has never used a banking app.** Every stat cited below is real and sourced (listed at the bottom) — nothing here is a guessed number.

Default demo language is **Yorùbá** for the voice-command segment, since it's the most fully fleshed-out phrase set in this build. Swap to Pidgin/Hausa/Igbo if someone on the team speaks it more naturally on camera — the structure doesn't change, just the spoken lines.

**Before recording**: onboard one fresh test customer (`/onboarding`) so you have an account with a *real* registered face to demonstrate — the two seeded demo accounts predate this feature and only show the honestly-labeled simulated fallback. Doing this live on camera also doubles as proof the enrollment itself is real.

---

## 0:00–0:25 — Hook: the person, then the numbers (presenter to camera or voice-over over a title card)

> "Picture an elderly woman in Lagos. She's never opened a banking app in her life — not because she doesn't have money, but because no one designed one for her. This isn't a hypothetical. According to the World Bank, roughly 36 percent of Nigerian adults are still unbanked. EFInA's 2023 survey put financial exclusion nationwide at 26 percent — real progress from 32 percent in 2020, but tens of millions still locked out. And a Covenant University study on elderly adults in Ekiti State found something specific: most of them never adopted internet banking at all — they simply went back to traditional, in-person banking, because the digital option wasn't built with them in mind."

## 0:25–0:40 — One-line solution

> "ElderPay is a voice-first banking assistant for agent-run terminals — the same ATM-style kiosks already common across Nigeria. She walks up, an agent looks her up by name, she speaks and shows her face. No reading, no PIN, no card number to remember."

*(Cut to: browser showing the virtual ATM device frame — card slot, keypad, receipt printer visible)*

## 0:40–2:15 — Live walkthrough, in character (screen recording, ~95 seconds)

Narrate this as *her* interaction, not a generic feature tour — "she tells the agent her name," "she says," "she hears," "she looks at the camera" — keep the persona present throughout. Move briskly through 1–4 (onboarding); they're proof beats, not the main event.

1. **Onboard her** (10s) — on `/onboarding`, the agent picks her language, then types her name and address as she speaks them (voice is for the system's spoken prompts, not for the agent's data entry). Skip email — most elderly customers don't have one. Say: *"No literacy required from her at any point — the agent enters what she tells them."*
2. **Register her face** (8s) — she looks at the camera, the agent taps "Capture my face." Say: *"That's a real facial descriptor, captured and stored right now, client-side — not a photo."*
3. **Look her up** (5s) — on `/app`, the agent types her name (or phone number) instead of a card number. Say: *"Her card is just the physical gesture now — the agent only needs her name or phone number to find her."*
4. **Real face verification at login** (7s) — she looks at the camera again, agent taps "Verify my face." Say: *"Matched against the descriptor from step 2 — computed server-side, in real time."*
5. **Speak a transaction** (12s) — tap the mic, say in Yorùbá: **"Mo fẹ́ yọ ẹgbẹ̀ẹ́dógún náírà"** ("I want to withdraw fifteen thousand naira"). Let Whisper transcribe it on-screen.
6. **System reads back and confirms** (8s) — let YarnGPT's Yorùbá voice speak the confirmation phrase, tap the 🔊 repeat icon once to show it, then tap "Yes, continue."
7. **Face verification gates the money movement** (8s) — she looks at the camera one more time; only after this real match does the withdrawal actually execute.
8. **Success + receipt** (8s) — let the receipt-paper animation play, YarnGPT speaks the success message, screen shows the transaction ID and reference.
9. **Check the new balance** (8s) — say "What's my balance" (or tap the quick-demo balance button). Say: *"Debited by exactly what she just withdrew — her real balance, not a static number."*
10. **Language switch** (8s) — briefly show all five language options. Say: *"English, Pidgin, Yorùbá, Hausa, Igbo — she banks in the language she actually thinks in."*

## 2:15–2:45 — Technical credibility (screen recording, ~30 seconds)

*(Navigate to `/pos` — the POS Agent View — right within the app, no need to cut away to Swagger)*

> "This isn't a mockup. Every piece talks to a real service — and you don't have to take my word for it, it's right here in the product."

- Point at the "Agent BMONI status" panel: mode badge ("Live sandbox," not mock), "Agent onboarded: Yes," and the real (truncated) `bmoniUserId` / smart wallet ID / wallet address — say: *"This is a real BMONI sandbox wallet — created, KYC'd, and NGN-rail-activated against their live sandbox, not simulated."*
- Point at the "Account/face storage" badge: say: *"Accounts, face data, and transaction history all persist to Postgres — nothing gets wiped if the server restarts."*
- One line on the AI stack: *"Speech-to-text and intent parsing run on Groq's Whisper and LLM models; the voice she just heard is YarnGPT's Nigerian-accented text-to-speech — both real, both live."*

## 2:45–2:55 — Honesty + impact close (presenter to camera)

> "We've been upfront throughout: face verification is the real, mandatory security gate for every account we onboard — a live facial descriptor captured and matched, not a photo, not a stand-in. Voice does real work too — real speech-to-text, real intent parsing, real spoken confirmations — it's just not the thing deciding whether money moves; that's reserved for face. What's real is the full transaction pipeline, the BMONI sandbox integration, and a genuine attempt to close the gap that research keeps finding in Nigeria's elderly population — not through more literacy campaigns, but by removing the requirement to read at all. That's ElderPay."

## 2:55–3:00 — Card / call to action

> "ElderPay — banking in your language, verified by your face, at a terminal you already know how to use."

*(End card: repo link + team name)*

---

## Sources cited in the script (real, verified — say them naturally, no need to show URLs on screen)

- World Bank (via Techpoint Africa): ~36% of Nigerian adults unbanked — https://techpoint.africa/general/nigerian-adults-banked/
- EFInA Access to Finance (A2F) 2023 Survey: 26% financially excluded nationally (down from 32% in 2020) — https://efina.org.ng/wp-content/uploads/2024/03/A2F-2023-Event-Day-Presentation-Version4-1.pdf
- "Digital Inclusion and the Elderly: The Case of Internet Banking Use and Non-Use among older Adults in Ekiti State, Nigeria" (Covenant University Journal of Business and Social Sciences) — https://www.researchgate.net/publication/344858260_Digital_Inclusion_and_the_Elderly_The_Case_of_Internet_Banking_Use_and_Non-Use_among_older_Adults_in_Ekiti_State_Nigeria

If a judge asks "where's that stat from" during Q&A, you have a real, named source for every number in this script — say it, don't hedge.

## Recording notes

- Do the walkthrough in ONE continuous take if possible — a live, unedited flow is more convincing for a "backup" video than a heavily cut one.
- Have the app already deployed and warmed up (hit `/api/health` once before recording) so there's no cold-start lag on camera.
- Onboard your test customer *before* you start the timed take, or budget the extra time into your run if you're doing it live — either works, but decide ahead of time so you're not improvising the pacing.
- Real face capture needs decent lighting and a camera that can actually see a face — test this on the exact device/browser you'll record with beforehand, not on the day.
- If BMONI's bank-verification sandbox is still blocked when you record, skip that specific sub-step — the onboarding/KYC/wallet proof above doesn't depend on it.
- Keep a phone timer visible off-camera; if you're running long, cut the language-switch step (10) first, then the balance check (9) — both are nice-to-haves, not load-bearing for the judging criteria.
- Practice the hook (0:00–0:25) out loud once before recording — it's the densest part with three cited stats back to back, and it needs to sound natural, not read off a page.
- The timings above are a pacing guide, not a stopwatch script — rehearse once, see where you actually land, and adjust rather than rushing to hit exact numbers on the real take.
