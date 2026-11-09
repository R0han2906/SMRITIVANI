"""Central intent classification entry point for the local Hindi/Hinglish rules."""

from backend.services.ai.base import IntentResult
from backend.services.ai.providers.local_rules import classify_intent as classify_local_intent


def classify_intent(text: str) -> IntentResult:
    return classify_local_intent(text)
