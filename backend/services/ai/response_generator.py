"""Safe short Hindi companion responses for local mode."""

from __future__ import annotations

import logging
import os

from backend.services.ai.base import IntentResult
from backend.services.ai.providers.gemini import GeminiProvider
from backend.services.ai.providers.groq import GroqProvider

logger = logging.getLogger(__name__)


def local_response(intent: IntentResult, name: str = "", language: str = "hi-IN") -> str:
    if language.lower().startswith("en") or language.lower() == "english":
        greeting = f"{name}, " if name else ""
        responses = {
            "emergency": f"{greeting}I’m opening the help screen. Please stay calm and move near someone you trust.",
            "pause": f"{greeting}I’m stopping the bhajan.",
            "medicine": f"{greeting}I’m opening your saved medicine schedule. Please speak with your family or doctor before changing any medicine.",
            "family": f"{greeting}I’m opening your saved family contacts.",
            "bhajan": f"{greeting}I’m opening your saved bhajan preferences.",
            "symptom": f"{greeting}I’m sorry you’re uncomfortable. I can show your saved care information; please also tell your family or doctor.",
            "loneliness": f"{greeting}I’m here listening. I’m sorry you’re feeling alone. Would you like to call someone in your family?",
            "memory": f"{greeting}Those memories sound special. Please tell me more; I’m listening.",
            "greeting": f"Hello {name or 'there'}! How are you feeling today?",
        }
        return responses.get(intent.intent, f"{greeting}I’m listening. You can ask about medicine, family, bhajans, or help.")
    greeting = f"{name} ji, " if name else ""
    responses = {
        "emergency": f"{greeting}main madad ka alert khol rahi hoon. Kripya shaant rahiye aur apne parivaar ke paas rahiye.",
        "pause": f"{greeting}bhajan rok rahi hoon.",
        "medicine": f"{greeting}aapki dawai ki jaankari khol rahi hoon. Koi bhi badlav karne se pehle apne doctor ya parivaar se baat karein.",
        "family": f"{greeting}aapke parivaar ki jaankari khol rahi hoon.",
        "bhajan": f"{greeting}aapke bhajan khol rahi hoon.",
        "symptom": f"{greeting}mujhe afsos hai ki aapko takleef hai. Main aapki parivaar ko batane mein madad kar sakti hoon; kripya doctor se bhi baat karein.",
        "loneliness": f"{greeting}main aapki baat sun rahi hoon. Aap akela mehsoos kar rahe hain, yeh sun kar mujhe afsos hua. Kya aap kisi apne ko phone karna chahenge?",
        "memory": f"{greeting}aapki yaadein bahut khaas hain. Mujhe aur bataiye, main sun rahi hoon.",
        "greeting": f"Namaste {name + ' ji' if name else 'ji'}! Aaj aap kaise hain?",
    }
    return responses.get(intent.intent, f"{greeting}main sun rahi hoon. Aap dawai, parivaar, bhajan, ya madad ke baare mein bol sakte hain.")


async def generate_response(intent: IntentResult, transcript: str, name: str = "", history: list[dict[str, str]] | None = None, language: str = "hi-IN", care_context: str = "") -> tuple[str, str]:
    """Try configured LLM providers in order, then return a safe local reply."""
    mode = os.getenv("AI_MODE", "mock").strip().lower()
    if mode not in {"hybrid", "gnani"}:
        return local_response(intent, name, language), "local_rules"
    system_prompt = (
        "You are SmritiVani, a warm Hindi companion for an older adult in India. "
        "Reply in the user's language in at most two short sentences. Use respectful aap/ji language. "
        "Acknowledge emotion first. Never diagnose or change medicine instructions; suggest family/doctor for symptoms. "
        "Do not claim that a caregiver was notified unless a stored alert was created. Keep the response calm and clear. "
        f"Respond in the user's configured language ({language}). The elder's preferred name is {name or 'not provided'}. "
        f"Relevant caregiver-provided care notes are: {care_context[:1800] or 'none available'}. "
        f"Use these notes only when relevant; do not invent details. The classified intent is {intent.intent}."
    )
    messages = [*(history or [])[-6:], {"role": "user", "content": transcript[:4000]}]
    for provider_name, provider in (("gemini", GeminiProvider()), ("groq", GroqProvider())):
        try:
            text = await provider.generate(messages, system_prompt)
            return text, provider_name
        except Exception as exc:
            logger.warning("AI response provider failed provider=%s error_type=%s", provider_name, type(exc).__name__)
    return local_response(intent, name, language), "local_rules"
