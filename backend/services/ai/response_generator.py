"""Safe short Hindi companion responses for local mode."""

from __future__ import annotations

import logging
import os

from backend.services.ai.base import IntentResult
from backend.services.ai.providers.gemini import GeminiProvider
from backend.services.ai.providers.groq import GroqProvider

logger = logging.getLogger(__name__)

_GENERAL_FALLBACKS = {
    "en-IN": "I’m listening. Tell me a little more about what you mean.",
    "hi-IN": "Main sun rahi hoon. Aap jo keh rahe hain, uske baare mein thoda aur bataiye.",
    "bn-IN": "আমি আপনার কথা শুনছি। এ বিষয়ে আমাকে আরেকটু বলুন।",
    "gu-IN": "હું તમારી વાત સાંભળી રહી છું. એ વિશે મને થોડું વધુ કહો.",
    "kn-IN": "ನಾನು ನಿಮ್ಮ ಮಾತು ಕೇಳುತ್ತಿದ್ದೇನೆ. ಇದರ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ಹೇಳಿ.",
    "ml-IN": "ഞാൻ നിങ്ങളുടെ വാക്കുകൾ ശ്രദ്ധിക്കുന്നു. ഇതിനെക്കുറിച്ച് കുറച്ചുകൂടി പറയൂ.",
    "mr-IN": "मी तुमचं ऐकत आहे. याबद्दल मला आणखी सांगा.",
    "pa-IN": "ਮੈਂ ਤੁਹਾਡੀ ਗੱਲ ਸੁਣ ਰਹੀ ਹਾਂ। ਇਸ ਬਾਰੇ ਮੈਨੂੰ ਹੋਰ ਦੱਸੋ।",
    "ta-IN": "நான் உங்கள் பேச்சைக் கேட்கிறேன். இதைப் பற்றி இன்னும் சொல்லுங்கள்.",
    "te-IN": "నేను మీ మాట వింటున్నాను. దీని గురించి ఇంకొంచెం చెప్పండి.",
}

_AI_UNAVAILABLE = {
    "en-IN": "I’m having trouble replying right now. Please try again in a moment.",
    "hi-IN": "Abhi mujhe jawab dene mein dikkat ho rahi hai. Kripya thodi der baad phir boliye.",
    "bn-IN": "এই মুহূর্তে উত্তর দিতে সমস্যা হচ্ছে। একটু পরে আবার বলবেন।",
    "gu-IN": "હમણાં જવાબ આપવામાં મુશ્કેલી થઈ રહી છે. થોડી વાર પછી ફરીથી કહેશો.",
    "kn-IN": "ಈಗ ಉತ್ತರಿಸಲು ತೊಂದರೆಯಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    "ml-IN": "ഇപ്പോൾ മറുപടി നൽകാൻ ബുദ്ധിമുട്ടുണ്ട്. കുറച്ച് കഴിഞ്ഞ് വീണ്ടും പറയൂ.",
    "mr-IN": "आत्ता उत्तर देण्यात अडचण येत आहे. कृपया थोड्या वेळाने पुन्हा बोला.",
    "pa-IN": "ਇਸ ਵੇਲੇ ਜਵਾਬ ਦੇਣ ਵਿੱਚ ਮੁਸ਼ਕਲ ਆ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਫਿਰ ਕਹੋ।",
    "ta-IN": "இப்போது பதிலளிப்பதில் சிக்கல் உள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    "te-IN": "ఇప్పుడు సమాధానం ఇవ్వడంలో ఇబ్బంది ఉంది. దయచేసి కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
}


def configured_ai_mode() -> str:
    """Respect explicit mode; otherwise use configured Groq before mock mode."""
    mode = os.getenv("AI_MODE", "").strip().lower()
    if mode:
        return mode
    return "groq" if os.getenv("GROQ_API_KEY", "").strip() else "mock"


def local_response(intent: IntentResult, name: str = "", language: str = "hi-IN") -> str:
    raw_language = language.strip().lower()
    language_code = {code.lower(): code for code in _GENERAL_FALLBACKS}.get(raw_language, {
        "english": "en-IN", "en": "en-IN", "en-us": "en-IN", "hindi": "hi-IN", "hi": "hi-IN",
    }.get(raw_language, "hi-IN"))
    if intent.intent == "general":
        return _GENERAL_FALLBACKS.get(language_code, _GENERAL_FALLBACKS["hi-IN"])
    if language_code.startswith("en"):
        greeting = f"{name}, " if name else ""
        responses = {
            "emergency": f"{greeting}I’m opening the help screen. Please stay calm and move near someone you trust.",
            "pause": f"{greeting}I’m stopping the bhajan.",
            "medicine": f"{greeting}I’m opening your saved medicine schedule. Please speak with your family or doctor before changing any medicine.",
            "family": f"{greeting}I’m opening your saved family contacts.",
            "bhajan": f"{greeting}I’m starting your bhajan." if intent.action_type == "play" else f"{greeting}I’m glad you told me about bhajans. Tell me more.",
            "symptom": f"{greeting}I’m sorry you’re uncomfortable. I can show your saved care information; please also tell your family or doctor.",
            "loneliness": f"{greeting}I’m here listening. I’m sorry you’re feeling alone. Would you like to call someone in your family?",
            "memory": f"{greeting}Those memories sound special. Please tell me more; I’m listening.",
            "greeting": f"Hello {name or 'there'}! How are you feeling today?",
        }
        return responses.get(intent.intent, f"{greeting}I’m listening. Tell me a little more about what you mean.")
    greeting = f"{name} ji, " if name else ""
    responses = {
        "emergency": f"{greeting}main madad ka alert khol rahi hoon. Kripya shaant rahiye aur apne parivaar ke paas rahiye.",
        "pause": f"{greeting}bhajan rok rahi hoon.",
        "medicine": f"{greeting}aapki dawai ki jaankari khol rahi hoon. Koi bhi badlav karne se pehle apne doctor ya parivaar se baat karein.",
        "family": f"{greeting}aapke parivaar ki jaankari khol rahi hoon.",
        "bhajan": f"{greeting}aapka bhajan chala rahi hoon." if intent.action_type == "play" else f"{greeting}bhajan ki baat achchi lagi. Mujhe aur bataiye.",
        "symptom": f"{greeting}mujhe afsos hai ki aapko takleef hai. Main aapki parivaar ko batane mein madad kar sakti hoon; kripya doctor se bhi baat karein.",
        "loneliness": f"{greeting}main aapki baat sun rahi hoon. Aap akela mehsoos kar rahe hain, yeh sun kar mujhe afsos hua. Kya aap kisi apne ko phone karna chahenge?",
        "memory": f"{greeting}aapki yaadein bahut khaas hain. Mujhe aur bataiye, main sun rahi hoon.",
        "greeting": f"Namaste {name + ' ji' if name else 'ji'}! Aaj aap kaise hain?",
    }
    return responses.get(intent.intent, f"{greeting}{_GENERAL_FALLBACKS.get(language_code, _GENERAL_FALLBACKS['hi-IN'])}")


async def generate_response(intent: IntentResult, transcript: str, name: str = "", history: list[dict[str, str]] | None = None, language: str = "hi-IN", care_context: str = "") -> tuple[str, str]:
    """Try configured LLM providers in order, then return a safe local reply."""
    mode = configured_ai_mode()
    if mode not in {"groq", "hybrid"}:
        return local_response(intent, name, language), "local_rules"
    system_prompt = (
        "You are SmritiVani, a warm and respectful voice companion for an older adult in India. "
        "Answer the elder's latest utterance directly and naturally, as a conversation partner. "
        "Do not recommend or list app features, events, schedules, or bhajans unless the elder asks about them. "
        "Do not repeat suggestions from older turns. Ask at most one brief follow-up only if it helps answer the current utterance. "
        "Reply in the configured language in at most two short sentences. Use respectful language appropriate to that language. "
        "Acknowledge emotion first. Never diagnose or change medicine instructions; suggest family/doctor for symptoms. "
        "Do not claim that a caregiver was notified unless a stored alert was created. Keep the response calm and clear. "
        f"Respond only in the elder's configured language ({language}); do not switch based on examples in memory or earlier turns. The elder's preferred name is {name or 'not provided'}. "
        f"Relevant caregiver-provided care notes are: {care_context[:1800] or 'none available'}. "
        f"Use these notes only when relevant; do not invent details. The classified intent is {intent.intent}."
    )
    messages = [*(history or [])[-6:], {"role": "user", "content": transcript[:4000]}]
    providers = (("groq", GroqProvider()),) if mode == "groq" else (("gemini", GeminiProvider()), ("groq", GroqProvider()))
    for provider_name, provider in providers:
        try:
            text = await provider.generate(messages, system_prompt)
            return text, provider_name
        except Exception as exc:
            logger.warning("AI response provider failed provider=%s error_type=%s", provider_name, type(exc).__name__)
    raw_language = language.strip().lower()
    language_code = {code.lower(): code for code in _AI_UNAVAILABLE}.get(raw_language, {
        "english": "en-IN", "en": "en-IN", "en-us": "en-IN", "hindi": "hi-IN", "hi": "hi-IN",
    }.get(raw_language, "hi-IN"))
    return _AI_UNAVAILABLE[language_code], "local_rules"
