# Frontend API contract

Caregiver requests use the Vite `/api` proxy in development and send `Authorization: Bearer <access_token>` for protected endpoints. Paired elderly-device requests use `X-Device-Token` for `/pairing/*` and `/voice/*` routes. JSON writes use `Content-Type: application/json`. See [API_REFERENCE.md](API_REFERENCE.md) for the new two-device and voice contracts.

| User flow | Request | Body / handling |
|---|---|---|
| Sign up | `POST /api/auth/signup` | Request `{ email, password, display_name, account_type: "caregiver" }`. Response is Supabase signup JSON with `user` and optional `access_token`/`refresh_token` (201); no session when confirmation is required. |
| Caregiver login | `POST /api/auth/login` | Request `{ email, password }`. Response includes `access_token`, `refresh_token`, token metadata, and `user` (200); invalid credentials return 401 and patient accounts are rejected (403). |
| Restore session | `GET /api/users/me` | Bearer token. Response is the user's `user_profiles` row. On 401, `POST /api/auth/refresh` takes `{ refresh_token }` and returns a new session JSON; invalid refresh returns 401. |
| Save signup phone | `PATCH /api/users/me` | Request `{ phone }`; response is the updated `user_profiles` row. |
| Logout | `POST /api/auth/logout` | Bearer token; response is 204 with no body. Client clears local tokens even if server logout fails. |
| List caregiver profiles | `GET /api/elders` | Response `{ items: [elderRow, ...], limit, offset }`; uses the previously selected accessible elder, otherwise the first result. |
| Create elder profile | `POST /api/elders` | Request `{ name, age, language, city, timezone, lives_alone, doctor_name, doctor_phone }`; response is created elder row with `id` (201). Uses only fields in the current backend model. |
| Save family / extra facts | `POST /api/elders/{elder_id}/memories` | Request `{ data: { type, name, relationship?, info? } }`; response is the created memory row with generated IDs/timestamps (201). Types include `family` and `fact`. |
| Save medicine | `POST /api/elders/{elder_id}/medicines` | Request `{ data: { name, dosage, instructions, schedule_time, days_of_week } }`; response is the created medicine row (201). Frequency text is appended to `instructions` because no separate column exists. |
| Read/update/delete shared records | `GET`, `PATCH`, `DELETE /api/elders/{elder_id}/{resource}[/{record_id}]` | Caregiver pages use existing allowlisted resources for contacts, memories, events, medicines, medicine logs, daily logs, voice-note metadata, and alerts. Record writes use `{ data: { ... } }`; the backend rejects unsupported writes (daily logs and voice-note audio are not client writable). |
| Record medicine dose | `POST /api/elders/{elder_id}/medicine-logs` | Creates a dose record against the existing medicine profile; no reminder delivery is triggered by this request. |
| Edit elder profile | `PATCH /api/elders/{elder_id}` | Updates only fields supported by the existing backend model. |
| Edit caregiver profile | `PATCH /api/users/me` | Request `{ display_name?, phone?, city? }`. |

The backend resource routes enforce their own allowlists and Supabase RLS remains the authorization boundary. The Vite proxy uses `VITE_API_PROXY_TARGET` (default `http://127.0.0.1:8020`) and `VITE_API_URL` defaults to `/api`.

## Contract limits

- No frequency or second daily schedule field exists for medicines. Current frontend frequency is retained in `instructions`; the UI does not claim that a reminder scheduler is active.
- Gender, who the elder lives with, and hospital/clinic are not elder columns. They are saved as `fact` records in the existing `memories` table.
- Binary photo/audio uploads and password recovery are not implemented by the existing backend and are not added here.
- Medicine schedules are stored records only: the backend has no reminder worker, push delivery, or real-time subscription. Voice-note rows contain metadata/transcripts only; no audio upload or playback endpoint exists. Alert list/status can be read and updated, but automatic detection/monitoring configuration is not exposed. Daily summaries are backend-owned and read-only from the caregiver UI.
- No SQL was run and no live Supabase project/schema was changed. A proposed additive migration exists at `backend/schema/migrations/0004_device_pairing_voice.sql`; the new pairing and voice endpoints depend on its owner review and manual application.
- Caregiver authentication uses a JWT on the caregiver's browser. Elderly devices pair separately using an opaque device token. The patient route checks pairing state and never asks the elderly person for email/password. Device token requests use a dedicated header and server-side profile resolution.
- Elderly pages read existing care profile resources through the paired-device API and write medicine dose logs/SOS alerts. Browser speech recognition sends utterances to `/api/voice/text`; local intent and emergency rules respond without model keys. `AI_MODE=hybrid` uses Gemini and Groq for natural responses. The Gnani adapter remains disabled until official API docs are confirmed.
- Uploaded-audio ASR, audio storage/playback, browser translation, activity tracking, reminder delivery, SMS/calls, and push notifications are not active. See `docs/KNOWN_LIMITATIONS.md` and `docs/API_REFERENCE.md`.
