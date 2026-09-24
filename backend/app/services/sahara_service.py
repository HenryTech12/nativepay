"""
Sahara (Intron Voice API) integration: code-switching-aware speech-to-text.
Mirrors transcribe_audio() in groq_service.py so the two are interchangeable
behind a common interface — same signature, same return type (plain
transcript string).

Docs: https://docs.voice.intron.io/docs/stt/file-upload-sync

Notes on the API:
- Sync endpoint only accepts audio <=120 seconds. Fine for our per-command
  voice clips; a longer recording would need the async /upload + /status
  flow instead (see poll fallback below, used only if Sahara answers 503).
- `use_language_asr_input` takes the SAME codes we already use in
  languages.py (en, pcm, yo, ha, ig) — Sahara's docs list Yoruba-English,
  Hausa-English, Igbo-English and Pidgin-English as native code-switched
  language codes (yo/ha/ig/pcm), so no remapping needed.
"""

import os
import asyncio
from typing import Optional

import httpx

SAHARA_BASE_URL = os.environ.get("SAHARA_BASE_URL", "https://infer.voice.intron.io")
SAHARA_API_KEY = os.environ.get("SAHARA_API_KEY")

# Sahara's own codes for our five supported languages — identical to what
# languages.py already uses, kept as an explicit map in case that changes.
LANGUAGE_CODE_MAP = {
    "en": "en",
    "pcm": "pcm",
    "yo": "yo",
    "ha": "ha",
    "ig": "ig",
}

_CONTENT_TYPE_BY_EXT = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".mp4": "audio/mp4",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
    ".flac": "audio/flac",
}


def _guess_content_type(filename: str) -> str:
    ext = os.path.splitext(filename or "")[1].lower()
    return _CONTENT_TYPE_BY_EXT.get(ext, "application/octet-stream")


async def _poll_file_status(client: httpx.AsyncClient, file_id: str, headers: dict) -> str:
    """Fallback for the 503 (still-processing) case the docs describe:
    the sync endpoint can time out after 120s and return a file_id instead
    of a transcript, at which point we poll /file/v1/status/{file_id}."""
    for _ in range(20):  # ~40s of polling at 2s intervals, generous but bounded
        await asyncio.sleep(2)
        res = await client.get(
            f"{SAHARA_BASE_URL}/file/v1/status/{file_id}",
            headers=headers,
        )
        res.raise_for_status()
        body = res.json()
        status = body.get("data", {}).get("processing_status")
        if status == "FILE_TRANSCRIBED":
            return body["data"].get("audio_transcript", "")
        if status == "FILE_PROCESSING_FAILED":
            raise RuntimeError(f"Sahara transcription failed for file_id={file_id}")
    raise TimeoutError(f"Sahara transcription still processing after polling, file_id={file_id}")


async def transcribe_audio(audio_bytes: bytes, filename: str, language_hint: Optional[str] = None) -> str:
    if not SAHARA_API_KEY:
        raise RuntimeError("SAHARA_API_KEY not configured")

    headers = {"Authorization": f"Bearer {SAHARA_API_KEY}"}
    data = {"audio_file_name": filename or "audio"}
    if language_hint:
        data["use_language_asr_input"] = LANGUAGE_CODE_MAP.get(language_hint, language_hint)

    files = {
        "audio_file_blob": (
            filename or "audio.webm",
            audio_bytes,
            _guess_content_type(filename or "audio.webm"),
        )
    }

    async with httpx.AsyncClient(timeout=125) as client:  # endpoint's own timeout is 120s
        res = await client.post(
            f"{SAHARA_BASE_URL}/file/v1/upload/sync",
            headers=headers,
            data=data,
            files=files,
        )

        if res.status_code == 503:
            # Docs: sync call can time out at 120s and return a file_id to poll instead.
            body = res.json()
            file_id = body.get("data", {}).get("file_id")
            if not file_id:
                res.raise_for_status()
            return await _poll_file_status(client, file_id, headers)

        res.raise_for_status()
        body = res.json()
        return body.get("data", {}).get("audio_transcript", "")
