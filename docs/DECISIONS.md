# Integration decisions

- Do not apply or mutate the user's live Supabase schema. The device-pairing/voice requirements need additive tables, so an unapplied migration proposal was prepared for review; no SQL was run against Supabase.
- Keep the frontend UX fields. Map additional onboarding details into existing `memories` records and medicine frequency into the current `instructions` field, which the existing backend already allows.
- Do not prefill onboarding with example people, facts, or medicines. The screen previously contained demo values that would otherwise be written to the real care profile as though they were true.
- Keep caregiver JWT auth separate from an elderly device token. The elderly device pairs once and requires no patient sign-in on future visits.
- Keep the Vite development proxy instead of adding backend CORS changes. It makes API requests same-origin during local development and does not alter backend behavior.
- Use browser speech for no-key ASR/TTS fallback and backend local intent rules. Do not guess Gnani request/response shapes; defer recorded-audio ASR until official docs are supplied.
- Enable patient mode only after the elder profile and related onboarding resources have been saved successfully. Do not use the legacy patient-claim route in the frontend.
