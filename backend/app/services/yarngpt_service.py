"""
YarnGPT — Nigerian-accented text-to-speech, used for the confirmation/
read-back voice in place of the browser's generic speechSynthesis.

The API has no separate "language" parameter — `voice` just selects a
character/timbre (per YarnGPT's docs: Idera, Emma, Zainab, Osagie, Wura,
Jude, Chinenye, Tayo, Regina, Femi, Adaora, Umar, Mary, Nonso, Remi, Adam),
and the same multilingual model renders whatever language the `text`
itself is written in. The mapping below is just picking a voice per our
language codes for variety, not a real language-to-voice pairing YarnGPT
documents — swap these based on how they actually sound once tested.

https://yarngpt.ai/api-docs — voice names are case-sensitive exact matches.
"""

import os
import httpx

YARNGPT_BASE_URL = os.environ.get("YARNGPT_BASE_URL", "https://yarngpt.ai/api/v1")
YARNGPT_API_KEY = os.environ.get("YARNGPT_API_KEY")

VOICE_BY_LANGUAGE = {
    "en": "Zainab",
    "pcm": "Zainab",
    "yo": "Idera",
    "ha": "Umar",
    "ig": "Chinenye",
}


async def synthesize_speech(text: str, language: str) -> bytes:
    if not YARNGPT_API_KEY:
        raise RuntimeError("YARNGPT_API_KEY not configured")

    voice = VOICE_BY_LANGUAGE.get(language, "Idera")
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"{YARNGPT_BASE_URL}/tts",
            headers={"Authorization": f"Bearer {YARNGPT_API_KEY}"},
            json={"text": text, "voice": voice, "response_format": "mp3"},
        )
        res.raise_for_status()
        return res.content
