"""Provider metadata for text recognized and audio spoken by the browser."""

from backend.services.ai.base import TranscriptResult


class BrowserSpeechProvider:
    """The browser performs Web Speech recognition/synthesis; backend receives text."""

    async def accept_transcript(self, text: str, language: str = "hi-IN", confidence: float | None = None) -> TranscriptResult:
        return TranscriptResult(provider="browser", confidence=confidence, text=text, language=language)

    async def synthesize(self, text: str, language: str = "hi-IN", voice_id: str | None = None, speed: float = 1.0) -> None:
        del text, language, voice_id, speed
        # Browser speechSynthesis performs playback on the client device.
        return None
