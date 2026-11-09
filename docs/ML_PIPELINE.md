# Voice and ML pipeline

## Modes

- `AI_MODE=mock` (default): browser ASR/TTS with local Hindi/Hinglish intent, sentiment, emergency rules, and response templates. It runs without provider keys.
- `AI_MODE=hybrid`: local rules remain authoritative for routing and emergency handling; Gemini generates a short response, with Groq as fallback. If both fail, a safe local reply is returned.
- `AI_MODE=gnani`: reserved for a future verified Gnani ASR/TTS/NLU adapter. Current Gnani methods fail clearly until the official endpoints and request/response shapes are documented.

## Intents and actions

Supported intents: `medicine`, `family`, `bhajan`, `pause`, `loneliness`, `symptom`, `emergency`, `memory`, `greeting`, and `general`. Emergency classification takes priority over normal intent routing. Hindi/Hinglish phrase matching includes common Romanized and Devanagari forms. Negated common symptoms such as “dard nahi hai” do not route to symptom care.

The model does not diagnose, modify medicine schedules, or claim a caregiver has been notified unless alert persistence succeeds. Severe phrases route to the emergency screen and create a caregiver alert.

## Provider boundary

Frontend code calls the voice API, not a provider SDK. Backend providers implement neutral contracts and use environment configuration. Provider errors are logged by provider and exception type only; transcripts, audio bytes, API keys, and names are excluded from logs. Gemini and Groq are optional dependencies and keys stay on the backend.

Browser speech is currently used for both recognition and spoken playback. There is a MediaRecorder hook for future upload wiring, but `/api/voice/process` intentionally returns a clear unavailable response until Gnani's real audio contract is confirmed. No raw audio is retained.

