# Remaining user-side setup and checks

## Before the new pairing and voice insight features can run

1. Review [ELDERLY_FLOW.md](ELDERLY_FLOW.md) and [migration 0004](../backend/schema/migrations/0004_device_pairing_voice.sql).
2. Decide whether to apply the additive SQL to the intended Supabase project. The coding agent did not apply it.
3. Add the backend's `DEVICE_PAIRING_PEPPER` and any available provider keys to a private `backend/.env` file.
4. Begin with `AI_MODE=mock`; use `AI_MODE=hybrid` only after Gemini/Groq keys and packages are configured.
5. Provide the official Gnani API docs before enabling real audio ASR/TTS.

## Caregiver-run validation

Use the detailed two-device sequence and synthetic example data in [END_TO_END_TEST_GUIDE.md](END_TO_END_TEST_GUIDE.md). No build, tests, API calls, or manual flow were run during this implementation because the user asked the coding agent not to test.

