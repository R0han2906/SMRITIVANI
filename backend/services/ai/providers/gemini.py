"""Google Gemini LLM provider using the current Google GenAI Python SDK."""

from __future__ import annotations

import os
import asyncio


class ProviderConfigurationError(RuntimeError):
    pass


class GeminiProvider:
    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()

    async def generate(self, messages: list[dict[str, str]], system_prompt: str, temperature: float = 0.4) -> str:
        if not self.api_key:
            raise ProviderConfigurationError("GEMINI_API_KEY is not configured.")
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:
            raise ProviderConfigurationError("Install the google-genai package to enable Gemini.") from exc
        client = genai.Client(api_key=self.api_key)
        prompt = "\n".join(f"{item['role']}: {item['content']}" for item in messages)
        for attempt in range(3):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(system_instruction=system_prompt, temperature=temperature),
                )
                break
            except Exception as exc:
                status = getattr(exc, "status_code", None) or getattr(exc, "code", None)
                if attempt == 2 or status not in {429, 500, 502, 503, 504}:
                    raise
                await asyncio.sleep(0.5 * (2 ** attempt))
        text = (response.text or "").strip()
        if not text:
            raise RuntimeError("Gemini returned an empty response.")
        return text
