"""Predictable no-key provider used by the local mock configuration."""

from backend.services.ai.base import EmergencyResult, IntentResult, SentimentResult, TranscriptResult


class MockProvider:
    async def transcribe(self, audio_bytes: bytes, language: str = "hi-IN", sample_rate: int = 16000) -> TranscriptResult:
        del audio_bytes, sample_rate
        return TranscriptResult(provider="mock", confidence=0.5, text="namaste, mujhe apni dawai dikha dijiye", language=language)

    async def classify_intent(self, text: str = "", context: dict | None = None) -> IntentResult:
        del text, context
        return IntentResult(provider="mock", confidence=0.5, intent="general")

    async def analyze(self, text_or_audio: str | bytes, language: str = "hi-IN") -> SentimentResult:
        del text_or_audio, language
        return SentimentResult(provider="mock", confidence=0.5, label="neutral", score=0.0)

    async def detect(self, text: str, audio: bytes | None = None) -> EmergencyResult:
        del text, audio
        return EmergencyResult(provider="mock", confidence=0.5, is_emergency=False)

    async def translate(self, text: str, source: str, target: str) -> str:
        del text, source, target
        raise RuntimeError("Mock provider does not translate text.")

    async def synthesize(self, text: str = "", language: str = "hi-IN", voice_id: str | None = None, speed: float = 1.0) -> bytes:
        del text, language, voice_id, speed
        # Minimal valid silent PCM WAV, useful as a wire-format placeholder.
        import struct
        sample_rate = 8000
        pcm = b"\x00\x00" * 80
        return b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16) + b"data" + struct.pack("<I", len(pcm)) + pcm
