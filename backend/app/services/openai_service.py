"""
OpenAI integration: speech-to-text and structured intent extraction.
Same interface as groq_service.py on purpose — app.services.ai_provider
tries this module first and falls back to groq_service if a call here
fails or OPENAI_API_KEY isn't configured, so the two modules need to
stay interchangeable.
"""

import json
import os
from typing import Optional

from openai import OpenAI

from app.models import ParsedIntent

_client: Optional[OpenAI] = None


def is_configured() -> bool:
    return bool(os.environ.get("OPENAI_API_KEY"))


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _client


TRANSCRIPTION_PROMPT = (
    "Nigerian voice banking assistant. Common words: send, withdraw, deposit, "
    "balance, airtime, naira, thousand, hundred, Adewale, Ngozi, Ibrahim."
)

# gpt-4o-transcribe is OpenAI's higher-accuracy transcription model (vs.
# whisper-1) — worth the extra cost here since a misheard amount/recipient
# is real money moving incorrectly, not just a UX annoyance. Swap to
# "whisper-1" if cost becomes the binding constraint instead.
TRANSCRIPTION_MODEL = os.environ.get("OPENAI_TRANSCRIPTION_MODEL", "gpt-4o-transcribe")


async def transcribe_audio(audio_bytes: bytes, filename: str, language_hint: Optional[str] = None) -> str:
    client = _get_client()
    kwargs = {}
    if language_hint:
        kwargs["language"] = language_hint
    transcription = client.audio.transcriptions.create(
        file=(filename or "audio.webm", audio_bytes),
        model=TRANSCRIPTION_MODEL,
        response_format="json",
        prompt=TRANSCRIPTION_PROMPT,
        **kwargs,
    )
    return transcription.text


# Mirrors groq_service.SYSTEM_PROMPT exactly — keep both in sync if this
# changes, since either provider must be able to answer the same prompt.
SYSTEM_PROMPT = """You extract structured banking intents from spoken requests, which may be in English, Nigerian Pidgin, or contain Yoruba/Igbo/Hausa words transcribed phonetically.

Return ONLY valid JSON, no prose, no markdown fences, matching this shape:
{
  "action": "send" | "balance" | "withdraw" | "deposit" | "airtime" | "bill" | "unknown",
  "amount": <integer naira amount, or null>,
  "recipient": "<name if mentioned, or null>",
  "confidence": <0-1 float, your confidence in this extraction>
}

Notes:
- "deposit" means the caller is putting money INTO their own account (cash-in at the agent) — no recipient needed.
- "withdraw" means taking cash OUT of their own account — no recipient needed.
- "airtime" means buying phone credit — put the phone number being topped up in "recipient", not a person's name.
- "send" means transferring to another person — put that person's name in "recipient"."""

# gpt-5-mini: current cost/quality default for structured extraction.
# Swap to "gpt-4.1-mini" or "gpt-4o-mini" if you need an older, more
# battle-tested model instead.
INTENT_MODEL = os.environ.get("OPENAI_INTENT_MODEL", "gpt-5-mini")


async def parse_intent(transcript_text: str) -> ParsedIntent:
    client = _get_client()
    completion = client.chat.completions.create(
        model=INTENT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": transcript_text},
        ],
        temperature=0,
        response_format={"type": "json_object"},
    )
    raw = completion.choices[0].message.content or "{}"
    try:
        data = json.loads(raw)
        return ParsedIntent(**data)
    except Exception:
        return ParsedIntent(action="unknown", amount=None, recipient=None, confidence=0.0)
