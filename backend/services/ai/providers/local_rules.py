"""Rule-based Hindi/Hinglish intent and emergency classification."""

from __future__ import annotations

import re
import time

from backend.services.ai.base import EmergencyResult, IntentResult, SentimentResult

_INTENTS: tuple[tuple[str, tuple[str, ...], str, str], ...] = (
    ("emergency", ("madad", "help", "bachao", "gir gayi", "gir gaya", "fall", "ambulance", "saans nahi", "chest pain", "dil dard", "emergency", "मदद", "बचाओ", "गिर गई", "गिर गया"), "emergency", "/elderly/emergency"),
    ("pause", ("ruk jao", "ruko", "band karo", "pause", "stop the music", "रुक जाओ", "रुको", "बंद करो"), "pause", "/elderly/bhajan"),
    ("medicine", ("dawai", "dawa", "davai", "medicine", "tablet", "goli", "dose", "दवाई", "दवा", "गोली"), "navigate", "/elderly/medicine"),
    ("family", ("beti", "beta", "pota", "poti", "bahu", "parivaar", "family", "phone kar", "call kar", "baat karni", "yaad aa rahi", "परिवार", "बेटी", "बेटा"), "navigate", "/elderly/family"),
    ("bhajan", ("bhajan", "aarti", "chalisa", "gayatri", "mandir", "kirtan", "music", "gaana", "भजन", "आरती"), "play", "/elderly/bhajan"),
    ("symptom", ("dard", "chakkar", "kamzori", "bukhar", "saans", "pain", "sar dard", "pet dard", "दर्द", "चक्कर", "बुखार"), "navigate", "/elderly/medicine"),
    ("loneliness", ("akela", "akeli", "udaas", "dukhi", "lonely", "bore", "koi nahi", "अकेला", "अकेली", "उदास"), "none", ""),
    ("memory", ("bachpan", "shaadi", "kahaani", "kahani", "yaad", "bhool", "बचपन", "शादी", "कहानी", "याद"), "none", ""),
    ("greeting", ("namaste", "namaskar", "hello", "good morning", "नमस्ते", "नमस्कार"), "none", ""),
)
_NEGATION = re.compile(r"\b(nahi|nahin|mat|no|not)\b|नहीं")
_NEGATABLE_SYMPTOMS = ("dard", "pain", "chakkar", "bukhar", "दर्द", "चक्कर", "बुखार")
_POSITIVE = ("khush", "accha", "achha", "theek", "happy", "खुश", "अच्छा", "ठीक")
_NEGATIVE = ("udaas", "dukhi", "akela", "dard", "pareshan", "sad", "lonely", "उदास", "दुखी", "अकेला", "दर्द")


def classify_intent(text: str) -> IntentResult:
    started = time.perf_counter()
    normalized = " ".join(text.lower().split())
    if _NEGATION.search(normalized) and any(word in normalized for word in _NEGATABLE_SYMPTOMS):
        return IntentResult(provider="local_rules", confidence=0.84, latency_ms=round((time.perf_counter() - started) * 1000), intent="general", sentiment="neutral")
    for intent, words, action, target in _INTENTS:
        if any(word in normalized for word in words):
            return IntentResult(provider="local_rules", confidence=0.86 if intent == "emergency" else 0.78, latency_ms=round((time.perf_counter() - started) * 1000), intent=intent, sentiment=classify_sentiment(normalized).label, action_type=action, action_target=target)
    return IntentResult(provider="local_rules", confidence=0.5, latency_ms=round((time.perf_counter() - started) * 1000), intent="general", sentiment=classify_sentiment(normalized).label)


def detect_emergency(text: str) -> EmergencyResult:
    started = time.perf_counter()
    normalized = " ".join(text.lower().split())
    critical = ("madad", "bachao", "gir gayi", "gir gaya", "saans nahi", "chest pain", "मदद", "बचाओ", "गिर गई", "गिर गया")
    strong = ("ambulance", "emergency", "hospital", "heart attack", "दिल का दौरा")
    terms = [term for term in (*critical, *strong) if term in normalized]
    if any(term in normalized for term in critical): severity = "critical"
    elif terms: severity = "high"
    elif any(term in normalized for term in _NEGATIVE): severity = "medium"
    else: severity = "low"
    return EmergencyResult(provider="local_rules", confidence=0.9 if terms else 0.65, latency_ms=round((time.perf_counter() - started) * 1000), is_emergency=bool(terms), severity=severity, terms=terms)


def classify_sentiment(text: str) -> SentimentResult:
    normalized = text.lower()
    positive = sum(term in normalized for term in _POSITIVE)
    negative = sum(term in normalized for term in _NEGATIVE)
    score = max(-1.0, min(1.0, (positive - negative) / max(1, positive + negative)))
    return SentimentResult(provider="local_rules", confidence=0.55 if positive or negative else 0.4, label="positive" if score > 0 else "negative" if score < 0 else "neutral", score=score)


class LocalRulesProvider:
    async def classify_intent(self, text: str, context: dict | None = None) -> IntentResult:
        del context
        return classify_intent(text)

    async def detect(self, text: str, audio: bytes | None = None) -> EmergencyResult:
        del audio
        return detect_emergency(text)

    async def analyze(self, text_or_audio: str | bytes, language: str = "hi-IN") -> SentimentResult:
        del language
        return classify_sentiment(text_or_audio if isinstance(text_or_audio, str) else "")

    async def translate(self, text: str, source: str, target: str) -> str:
        raise RuntimeError(f"Local translation from {source} to {target} is unavailable.")
