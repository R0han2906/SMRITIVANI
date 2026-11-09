"""Gnani adapter skeleton.

VERIFY ACTUAL GNANI API STRUCTURE BEFORE PRODUCTION USE. No endpoint path,
request shape, response shape, or authentication header is assumed here.
"""

from __future__ import annotations

import os


class GnaniConfigurationError(RuntimeError):
    pass


class GnaniProvider:
    def __init__(self) -> None:
        self.api_key = os.getenv("GNANI_API_KEY", "").strip()
        self.base_url = os.getenv("GNANI_BASE_URL", "").strip()
        self.endpoints = {
            "asr": os.getenv("GNANI_ASR_ENDPOINT", "").strip(),
            "tts": os.getenv("GNANI_TTS_ENDPOINT", "").strip(),
            "nlu": os.getenv("GNANI_NLU_ENDPOINT", "").strip(),
            "sentiment": os.getenv("GNANI_SENTIMENT_ENDPOINT", "").strip(),
            "keyword": os.getenv("GNANI_KEYWORD_ENDPOINT", "").strip(),
            "translate": os.getenv("GNANI_TRANSLATE_ENDPOINT", "").strip(),
            "biometrics": os.getenv("GNANI_BIOMETRICS_ENDPOINT", "").strip(),
        }

    def require_verified_config(self, service: str) -> None:
        endpoint = self.endpoints.get(service, "")
        if not self.api_key or not self.base_url or not endpoint or "<" in endpoint or "placeholder" in endpoint.lower():
            raise GnaniConfigurationError(f"Gnani {service} configuration is incomplete; verify its official API contract first.")
        raise GnaniConfigurationError("Gnani request/response mapping is intentionally disabled until its official API contract is verified.")

    async def transcribe(self, audio_bytes: bytes, language: str = "hi-IN", sample_rate: int = 16000):
        del audio_bytes, language, sample_rate
        self.require_verified_config("asr")

    async def synthesize(self, text: str, language: str = "hi-IN", voice_id: str | None = None, speed: float = 1.0):
        del text, language, voice_id, speed
        self.require_verified_config("tts")

    async def classify_intent(self, text: str, context: dict | None = None):
        del text, context
        self.require_verified_config("nlu")

    async def analyze(self, text_or_audio: str | bytes, language: str = "hi-IN"):
        del text_or_audio, language
        self.require_verified_config("sentiment")

    async def detect(self, text: str, audio: bytes | None = None):
        del text, audio
        self.require_verified_config("keyword")

    async def translate(self, text: str, source: str, target: str):
        del text, source, target
        self.require_verified_config("translate")
