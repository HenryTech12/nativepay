"""
YarnGPT — Nigerian-accented text-to-speech, used for the confirmation/
read-back voice in place of the browser's generic speechSynthesis.

IMPORTANT: YarnGPT's real API (per their current docs) is NOT a plain
"POST text, get audio bytes back" endpoint. There are three distinct ways
to get audio out of it:

  1. POST /api/v1/tts            -- async job: returns a job_id, you poll
                                     GET /api/v1/status/{job_id} until
                                     status == "completed" and read
                                     audio_url. Built for long-form content
                                     (up to 15,000 chars / 60 segments).
  2. POST /api/v1/tts/prepare     -- mints a {ticket, stream_url}; the
                                     unauthenticated GET /api/v1/tts/stream
                                     /{ticket} then streams bytes (or a 303
                                     redirect to a signed URL once cached).
                                     Meant for handing a URL to a browser,
                                     not for a server-to-server call.
  3. POST /api/v1/streaming/conversation
                                     -- synchronous: returns raw audio
                                     bytes directly in the response body,
                                     no job_id, no polling. Built exactly
                                     for "voice agent / live chat reply"
                                     use cases -- which is what this is.

We use (3), since NativePay just needs "speak this confirmation sentence
now" and our own /api/tts route is itself a plain synchronous
request/response (the frontend does one fetch and expects bytes back) --
polling a job here would mean either blocking this request for the whole
poll loop, or redesigning /api/tts into its own async job API. If
responses start exceeding the conversation route's 5,000-character cap
(unlikely for a short confirmation sentence, but possible for a long
error explanation), switch that specific call to the (1) job+poll pattern
instead of silently truncating the text.

Docs: https://yarngpt.ai (Text-to-Speech > Conversation section).
Voice ids are NOT a fixed/stable set per YarnGPT's docs -- the mapping
below is a best-effort pick for variety, not a documented pairing. Verify
these against GET /api/v1/voices before relying on them; an id that no
longer exists comes back as 404 VOICE_NOT_FOUND, which we retry once
without a voice (falling back to the provider's own default) rather than
failing the whole request outright.
"""

import os
import uuid
import logging
from typing import Optional

import httpx

logger = logging.getLogger("nativepay.yarngpt")

YARNGPT_BASE_URL = os.environ.get("YARNGPT_BASE_URL", "https://api.yarngpt.ai/api/v1")
YARNGPT_API_KEY = os.environ.get("YARNGPT_API_KEY", "").strip()

VOICE_BY_LANGUAGE = {
    "en": "zainab",
    "pcm": "zainab",
    "yo": "idera",
    "ha": "umar",
    "ig": "chinenye",
}

# Conversation route's own documented cap -- if this is ever exceeded we
# should switch to the job+poll TTS route rather than truncate someone's
# transaction confirmation mid-sentence.
MAX_CONVERSATION_CHARS = 5000


def is_configured() -> bool:
    """Used by /api/health so it's possible to tell from the outside
    whether YARNGPT_API_KEY is actually set, instead of only discovering
    it's missing the next time someone tries to speak something."""
    return bool(YARNGPT_API_KEY)


class YarnGptError(RuntimeError):
    """Carries the parts of YarnGPT's documented error shape
    ({"error": {"code", "message", "user_message", ...}}) that are
    actually safe/useful to act on or show, rather than a bare string."""

    def __init__(self, code: str, user_message: str, status_code: int, raw: Optional[dict] = None):
        super().__init__(f"{code}: {user_message}")
        self.code = code
        self.user_message = user_message
        self.status_code = status_code
        self.raw = raw or {}


def _parse_error(res: httpx.Response) -> "YarnGptError":
    try:
        body = res.json()
        err = body.get("error", {})
        code = err.get("code", "UNKNOWN_ERROR")
        user_message = err.get("user_message") or err.get("message") or "Voice synthesis failed."
        return YarnGptError(code, user_message, res.status_code, err)
    except Exception:
        return YarnGptError("UNKNOWN_ERROR", "Voice synthesis failed.", res.status_code)


async def _call_conversation(text: str, voice: Optional[str]) -> bytes:
    idempotency_key = str(uuid.uuid4())
    payload = {"text": text, "output_format": "mp3"}
    if voice:
        payload["voice"] = voice

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"{YARNGPT_BASE_URL}/streaming/conversation",
            headers={
                "Authorization": f"Bearer {YARNGPT_API_KEY}",
                "Content-Type": "application/json",
                "Idempotency-Key": idempotency_key,
            },
            json=payload,
        )

    if res.status_code == 200:
        warnings = res.headers.get("X-Synthesis-Warning")
        if warnings:
            logger.warning("YarnGPT synthesis warning(s): %s", warnings)
        return res.content

    raise _parse_error(res)


async def synthesize_speech(text: str, language: str) -> bytes:
    if not YARNGPT_API_KEY:
        raise RuntimeError("YARNGPT_API_KEY not configured")

    if len(text) > MAX_CONVERSATION_CHARS:
        # Rather than silently truncating (which could cut off exactly the
        # part of a transaction confirmation that matters -- the amount or
        # recipient), fail loudly so the caller knows to shorten the text
        # or move this call to the async job+poll TTS route.
        raise RuntimeError(
            f"Text is {len(text)} chars, over the conversation route's "
            f"{MAX_CONVERSATION_CHARS}-char cap -- use the job-based /api/v1/tts "
            "route for longer text instead of truncating."
        )

    voice = VOICE_BY_LANGUAGE.get(language)
    try:
        return await _call_conversation(text, voice)
    except YarnGptError as err:
        if err.code == "VOICE_NOT_FOUND" and voice:
            # Voice ids aren't guaranteed stable -- retry once with the
            # provider's own default rather than failing the whole request
            # over a stale id in our static mapping.
            logger.warning("YarnGPT voice '%s' no longer exists, retrying with provider default", voice)
            return await _call_conversation(text, None)
        # Re-raise with the safe, user-facing message YarnGPT gave us so
        # /api/tts can surface something more useful than a bare 502.
        raise RuntimeError(err.user_message) from err
