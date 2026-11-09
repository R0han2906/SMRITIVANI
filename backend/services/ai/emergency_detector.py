"""Local keyword-based emergency detection; never depends on an LLM provider."""

from backend.services.ai.base import EmergencyResult
from backend.services.ai.providers.local_rules import detect_emergency as detect_local_emergency


def detect_emergency(text: str) -> EmergencyResult:
    return detect_local_emergency(text)
