# Current integration issues and verification limits

- The additive pairing/voice migration is a proposal and has not been applied. Device pairing, persistent voice interactions, safety-alert review, and generated voice summaries cannot persist until the user applies it to the intended Supabase project.
- The code in this task has not been built or tested. The user explicitly asked that we wait for their API keys and not test.
- The Gemini and Groq provider adapters are present; actual generation depends on configured keys and installed Python dependencies. `AI_MODE=mock` uses local rules and templates.
- Gnani API documentation is not available in the project. Gnani calls remain intentionally disabled; adding a key alone will not turn them on.
- The elderly app currently uses browser SpeechRecognition and speechSynthesis. Recorded-audio ASR is not wired, raw audio is not stored, and the MediaRecorder hook is not connected to a verified backend provider.
- Pairing attempts are throttled per client IP in process memory. Production deployments with multiple workers/instances should add shared rate limiting.
- Emergency actions create persistent alerts only when the database and pairing migration are available. They do not send SMS, place a call, or push a notification.
- Daily summaries are generated on demand using simple sentiment averages and intent counts; there is no background schedule or clinical mood interpretation.
- Vite's development proxy serves local frontend API requests. Production requires the correct `VITE_API_URL` and explicit API CORS/reverse-proxy configuration.
