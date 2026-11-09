"""Groq async LLM provider used as the configured fallback."""

from __future__ import annotations

import os

from backend.services.ai.providers.gemini import ProviderConfigurationError


class GroqProvider:
    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    async def generate(self, messages: list[dict[str, str]], system_prompt: str, temperature: float = 0.4) -> str:
        if not self.api_key:
            raise ProviderConfigurationError("GROQ_API_KEY is not configured.")
        try:
            from groq import AsyncGroq
        except ImportError as exc:
            raise ProviderConfigurationError("Install the groq package to enable Groq.") from exc
        client = AsyncGroq(api_key=self.api_key, timeout=20.0, max_retries=1)
        completion = await client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": system_prompt}, *messages],
            temperature=temperature,
            max_tokens=180,
        )
        text = (completion.choices[0].message.content or "").strip()
        if not text:
            raise RuntimeError("Groq returned an empty response.")
        return text
