"""Mock/local voice orchestration that works without external provider keys."""

from __future__ import annotations

import time
from dataclasses import asdict, dataclass
from typing import Any

from backend.services.ai.base import EmergencyResult, IntentResult, SentimentResult
from backend.services.ai.emergency_detector import detect_emergency
from backend.services.ai.intent_classifier import classify_intent
from backend.services.ai.providers.local_rules import classify_sentiment
from backend.services.ai.response_generator import generate_response, local_response


@dataclass(slots=True)
class VoiceResponse:
    transcript: str
    intent: dict[str, Any]
    sentiment: dict[str, Any]
    emergency: dict[str, Any]
    assistant_text: str
    assistant_audio_base64: str | None
    audio_mime: str | None
    action: dict[str, str]
    providers_used: dict[str, str]
    latency_ms: int
    degraded_mode: bool
    warnings: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class VoiceOrchestrator:
    """Use local rules in mock mode; external providers can be added by config."""

    async def process_text(self, text: str, elderly_id: str, session_id: str | None = None, language: str = "hi-IN", name: str = "", history: list[dict[str, str]] | None = None, care_context: str = "", asr_provider: str = "browser") -> VoiceResponse:
        del elderly_id, session_id
        started = time.perf_counter()
        cleaned = " ".join(text.split())
        if not cleaned:
            raise ValueError("Please say a few words so I can help.")
        emergency: EmergencyResult = detect_emergency(cleaned)
        intent: IntentResult = classify_intent(cleaned)
        sentiment: SentimentResult = classify_sentiment(cleaned)
        if emergency.is_emergency:
            intent = IntentResult(provider="local_rules", confidence=emergency.confidence, intent="emergency", sentiment=sentiment.label, action_type="emergency", action_target="/elderly/emergency")
        if emergency.is_emergency:
            response, llm_provider = local_response(intent, name, language), "local_rules"
        else:
            response, llm_provider = await generate_response(intent, cleaned, name, history, language, care_context)
        warnings = []
        if llm_provider == "local_rules" and not emergency.is_emergency:
            warnings.append("Conversational AI did not respond; using a short language-matched fallback.")
        return VoiceResponse(
            transcript=cleaned,
            intent=asdict(intent),
            sentiment=asdict(sentiment),
            emergency=asdict(emergency),
            assistant_text=response,
            assistant_audio_base64=None,
            audio_mime=None,
            action={"type": intent.action_type, "target": intent.action_target},
            providers_used={"asr": asr_provider, "nlu": "local_rules", "sentiment": "local_rules", "emergency": "local_rules", "llm": llm_provider, "tts": "pending"},
            latency_ms=round((time.perf_counter() - started) * 1000),
            degraded_mode=llm_provider == "local_rules" and not emergency.is_emergency,
            warnings=warnings,
        )


voice_orchestrator = VoiceOrchestrator()
