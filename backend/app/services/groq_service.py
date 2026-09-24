"""
Groq integration: Whisper for speech-to-text, an LLM for structured intent
extraction. Mirrors groqService.ts on the TS backend.
"""

import json
import os
from typing import Optional

from groq import Groq

from app.models import ParsedIntent

_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    return _client


TRANSCRIPTION_PROMPT = (
    "Nigerian voice banking assistant. Common words: send, withdraw, deposit, "
    "balance, airtime, naira, thousand, hundred, Adewale, Ngozi, Ibrahim."
)


async def transcribe_audio(audio_bytes: bytes, filename: str, language_hint: Optional[str] = None) -> str:
    client = _get_client()
    kwargs = {}
    if language_hint:
        kwargs["language"] = language_hint
    transcription = client.audio.transcriptions.create(
        file=(filename or "audio.webm", audio_bytes),
        model="whisper-large-v3",  # full model — noticeably more accurate on Yoruba/Hausa/Igbo than the -turbo tier, worth the extra latency
        response_format="json",
        prompt=TRANSCRIPTION_PROMPT,
        **kwargs,
    )
    return transcription.text


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


async def parse_intent(transcript_text: str) -> ParsedIntent:
    client = _get_client()
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",  # current Groq-recommended general model as of mid-2026; check console.groq.com/docs/models if this has moved on
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
