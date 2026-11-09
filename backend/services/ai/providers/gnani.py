"""Gnani Prisma REST speech-to-text adapter."""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from backend.services.ai.base import TranscriptResult

STT_URL = "https://api.vachana.ai/stt/v3"
TTS_URL = "https://api.vachana.ai/api/v1/tts/inference"


class GnaniConfigurationError(RuntimeError):
    pass


class GnaniAPIError(RuntimeError):
    def __init__(self, status_code: int, error_code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code


class GnaniProvider:
    def __init__(self) -> None:
        self.api_key = os.getenv("GNANI_API_KEY", "").strip()
        self.model = os.getenv("GNANI_STT_MODEL", "prisma-v2.5").strip()
        self.tts_model = os.getenv("GNANI_TTS_MODEL", "timbre-v2.5").strip()

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "hi-IN",
        sample_rate: int = 16000,
    ) -> TranscriptResult:
        del sample_rate  # The REST endpoint detects the WAV file's properties.
        if not self.api_key:
            raise GnaniConfigurationError("GNANI_API_KEY is not configured in backend/.env.")
        if not audio_bytes:
            raise GnaniAPIError(422, "EMPTY_AUDIO", "The recording is empty.")

        boundary = f"smritivani-{uuid.uuid4().hex}"
        body = b"".join(
            (
                self._form_file(boundary, audio_bytes),
                self._form_field(boundary, "language_code", language or "hi-IN"),
                self._form_field(boundary, "model", self.model),
                f"--{boundary}--\r\n".encode("ascii"),
            )
        )
        request = Request(
            STT_URL,
            data=body,
            headers={
                "Accept": "application/json",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "X-API-Key-ID": self.api_key,
                "X-API-Request-ID": str(uuid.uuid4()),
                "User-Agent": "SmritiVani-Backend/1.0",
            },
            method="POST",
        )

        try:
            status, content = await asyncio.to_thread(self._send, request)
        except GnaniAPIError:
            raise
        except (URLError, TimeoutError) as exc:
            raise GnaniAPIError(502, "UPSTREAM_UNAVAILABLE", "Could not reach Gnani speech recognition.") from exc

        try:
            result = json.loads(content)
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise GnaniAPIError(502, "INVALID_RESPONSE", "Gnani returned an unreadable response.") from None
        if status < 200 or status >= 300:
            raise self._api_error(status, result)
        transcript = result.get("transcript")
        if result.get("success") is not True or not isinstance(transcript, str):
            raise GnaniAPIError(502, "INVALID_RESPONSE", "Gnani did not return a transcript.")
        return TranscriptResult(
            provider="gnani",
            text=transcript.strip(),
            language=result.get("detected_language_code") or language,
            metadata={"model": result.get("model", self.model), "request_id": result.get("request_id")},
        )

    @staticmethod
    def _form_field(boundary: str, name: str, value: str) -> bytes:
        return (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n"
        ).encode("utf-8")

    @staticmethod
    def _form_file(boundary: str, audio_bytes: bytes) -> bytes:
        return (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="audio_file"; filename="speech.wav"\r\n'
            "Content-Type: audio/wav\r\n\r\n"
        ).encode("ascii") + audio_bytes + b"\r\n"

    @staticmethod
    def _send(request: Request, timeout: int = 45) -> tuple[int, bytes]:
        try:
            with urlopen(request, timeout=timeout) as response:
                return response.status, response.read()
        except HTTPError as exc:
            return exc.code, exc.read()

    @staticmethod
    def _api_error(status: int, result: object) -> GnaniAPIError:
        error_code = "UPSTREAM_ERROR"
        if isinstance(result, dict):
            error = result.get("error")
            detail = result.get("detail")
            if isinstance(error, dict) and isinstance(error.get("type"), str):
                error_code = error["type"]
            elif isinstance(detail, dict) and isinstance(detail.get("error_code"), str):
                error_code = detail["error_code"]

        messages = {
            400: "Gnani rejected the speech request. Check the configured model, voice, and language.",
            401: "Gnani rejected the configured API key.",
            402: "The Gnani account needs available speech credits.",
            403: "Gnani rejected the speech request for this API key or account. Check the upstream error code before changing key permissions.",
            422: "Gnani rejected the audio or language setting.",
            429: "Gnani is rate limiting requests. Wait briefly and try again.",
        }
        return GnaniAPIError(status, error_code, messages.get(status, f"Gnani speech request failed (HTTP {status})."))

    async def synthesize(self, text: str, language: str = "hi-IN", voice_id: str | None = None, speed: float = 1.0):
        if not self.api_key:
            raise GnaniConfigurationError("GNANI_API_KEY is not configured in backend/.env.")
        if not text.strip():
            raise GnaniAPIError(422, "EMPTY_TEXT", "There is no response text to synthesize.")
        language_code = language if language in {"hi-IN", "en-IN", "hi-en", "ta-IN", "te-IN", "kn-IN", "ml-IN", "mr-IN", "pa-IN", "bn-IN", "gu-IN"} else "auto"
        default_voices = {
            "bn-IN": "Kirra", "en-IN": "Kaveri", "gu-IN": "Falak", "hi-IN": "Nalini",
            "kn-IN": "Saanvi", "ml-IN": "Reshma", "mr-IN": "Zahira", "pa-IN": "Mehuli",
            "ta-IN": "Asmita", "te-IN": "Suhana", "hi-en": "Poorvi",
        }
        voice = voice_id or default_voices.get(language_code, "Nalini")
        payload = {
            "text": text[:4000],
            "model": self.tts_model,
            "voice": voice,
            "language": language_code,
            "speed": min(1.15, max(0.85, float(speed))),
            "audio_config": {
                "encoding": "linear_pcm", "container": "wav", "num_channels": 1,
                "sample_rate": 48000, "sample_width": 2,
            },
        }
        request = Request(
            TTS_URL,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={
                "Accept": "audio/wav", "Content-Type": "application/json",
                "X-API-Key-ID": self.api_key, "X-API-Request-ID": str(uuid.uuid4()),
                "User-Agent": "SmritiVani-Backend/1.0",
            },
            method="POST",
        )
        try:
            status, content = await asyncio.to_thread(self._send, request, 20)
        except (URLError, TimeoutError) as exc:
            raise GnaniAPIError(502, "UPSTREAM_UNAVAILABLE", "Could not reach Gnani speech synthesis.") from exc
        if status < 200 or status >= 300:
            try:
                details = json.loads(content)
            except (json.JSONDecodeError, UnicodeDecodeError):
                details = {}
            raise self._api_error(status, details)
        if not content or not content.startswith(b"RIFF"):
            raise GnaniAPIError(502, "INVALID_AUDIO", "Gnani returned an invalid audio response.")
        return content

    async def classify_intent(self, text: str, context: dict | None = None):
        del text, context
        raise GnaniConfigurationError("Gnani intent classification is not connected yet.")

    async def analyze(self, text_or_audio: str | bytes, language: str = "hi-IN"):
        del text_or_audio, language
        raise GnaniConfigurationError("Gnani sentiment analysis is not connected yet.")

    async def detect(self, text: str, audio: bytes | None = None):
        del text, audio
        raise GnaniConfigurationError("Gnani keyword detection is not connected yet.")

    async def translate(self, text: str, source: str, target: str):
        del text, source, target
        raise GnaniConfigurationError("Gnani translation is not connected yet.")
