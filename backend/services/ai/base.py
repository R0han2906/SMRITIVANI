"""Provider-neutral results and protocols for the SmritiVani voice pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass(slots=True)
class ProviderResult:
    provider: str
    confidence: float | None = None
    latency_ms: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class TranscriptResult(ProviderResult):
    text: str = ""
    language: str = "hi-IN"


@dataclass(slots=True)
class IntentResult(ProviderResult):
    intent: str = "general"
    sentiment: str = "neutral"
    action_type: str = "none"
    action_target: str = ""


@dataclass(slots=True)
class EmergencyResult(ProviderResult):
    is_emergency: bool = False
    severity: str = "low"
    terms: list[str] = field(default_factory=list)


@dataclass(slots=True)
class SentimentResult(ProviderResult):
    label: str = "neutral"
    score: float = 0.0


class ASRProvider(Protocol):
    async def transcribe(self, audio_bytes: bytes, language: str, sample_rate: int) -> TranscriptResult: ...


class TTSProvider(Protocol):
    async def synthesize(self, text: str, language: str, voice_id: str | None = None, speed: float = 1.0) -> bytes: ...


class NLUProvider(Protocol):
    async def classify_intent(self, text: str, context: dict[str, Any] | None = None) -> IntentResult: ...


class SentimentProvider(Protocol):
    async def analyze(self, text_or_audio: str | bytes, language: str = "hi-IN") -> SentimentResult: ...


class EmergencyProvider(Protocol):
    async def detect(self, text: str, audio: bytes | None = None) -> EmergencyResult: ...


class LLMProvider(Protocol):
    async def generate(self, messages: list[dict[str, str]], system_prompt: str, temperature: float = 0.4) -> str: ...


class TranslationProvider(Protocol):
    async def translate(self, text: str, source: str, target: str) -> str: ...
