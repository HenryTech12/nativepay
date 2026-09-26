"""
Single entry point for speech-to-text and intent parsing. OpenAI is the
primary provider; Groq is the fallback — used automatically whenever
OpenAI isn't configured (no OPENAI_API_KEY) or a live OpenAI call fails
(outage, rate limit, timeout, bad response). Callers (app/main.py)
should import THIS module, not groq_service or openai_service directly,
so the fallback behavior can't accidentally be bypassed.

Both provider modules expose the identical async signature
(transcribe_audio / parse_intent) on purpose, so swapping between them
here is just "call the other one" with no translation layer needed.
"""

import logging

from app.models import ParsedIntent
from app.services import groq_service, openai_service

logger = logging.getLogger("nativepay.ai_provider")


async def transcribe_audio(audio_bytes: bytes, filename: str, language_hint: str | None = None) -> str:
    if openai_service.is_configured():
        try:
            return await openai_service.transcribe_audio(audio_bytes, filename, language_hint)
        except Exception as err:
            logger.warning("OpenAI transcription failed (%s) — falling back to Groq", err)
    return await groq_service.transcribe_audio(audio_bytes, filename, language_hint)


async def parse_intent(transcript_text: str, language: str | None = None) -> ParsedIntent:
    if openai_service.is_configured():
        try:
            return await openai_service.parse_intent(transcript_text, language)
        except Exception as err:
            logger.warning("OpenAI intent parsing failed (%s) — falling back to Groq", err)
    return await groq_service.parse_intent(transcript_text, language)


def active_provider() -> str:
    """For /api/health — reports which provider is actually configured as
    primary, not which one served the last request (a mid-request
    fallback doesn't change this)."""
    return "openai" if openai_service.is_configured() else "groq"
