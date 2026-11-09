# SmritiVani manual connection guide

This document is for the caregiver to validate later. No app startup, build, test suite, API request, sample audio, or manual click-through was run while preparing it.

## What is connected in code

| Feature | Current implementation |
|---|---|
| Caregiver access | Signup/login uses Supabase Auth; onboarding and caregiver routes are protected. Token restore/refresh and explicit logout are wired. |
| Separate elderly device | Caregiver issues a 6-digit code; elderly tablet pairs once and stores a distinct device token. Patient routes require a valid pairing and never show caregiver login. |
| Care data | Caregiver CRUD remains connected to existing RLS-backed elder profile, medicine, dose, contacts, memories, events, alerts, and voice-note metadata APIs. Elderly resources use the paired device token. |
| Voice | Browser speech recognition sends text to one backend pipeline. Local Hindi/Hinglish intent, sentiment, and emergency rules run without AI keys. Browser speech synthesis speaks responses. |
| Caregiver insights | Dashboard polls interactions, paired-device activity and pending safety alerts; Voice Interactions, Emergency Alerts, Memory Bank recalled items, and Daily Log use the new endpoints. |
| AI providers | Gemini and Groq response adapters are configured by backend environment. Gnani is intentionally disabled pending its actual API docs. |
| Media | MediaRecorder hook is present. Audio upload, provider ASR, audio storage and playback are unavailable until Gnani's request/response contract is confirmed. |

## Required database approval

The code expects new `elder_device_codes`, `paired_devices`, `voice_interactions`, `safety_alerts`, and `daily_summaries` tables. The proposed migration is [0004_device_pairing_voice.sql](../backend/schema/migrations/0004_device_pairing_voice.sql). It has **not** been applied to Supabase. Pairing and persistent voice insights will return service errors until the project owner reviews and applies it. Existing migrations and current Supabase schema were not changed by this work.

## Configuration

Set existing backend values in `backend/.env`: `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`. Set a unique random `DEVICE_PAIRING_PEPPER` with at least 32 characters. Start with `AI_MODE=mock`; browser speech and local rules need no model keys. For hybrid responses add `GEMINI_API_KEY` and optionally `GROQ_API_KEY`; these keys belong only in backend `.env`. Gnani requests remain disabled even after adding a key until its official API contract is implemented.

## Sample synthetic profile

Use only disposable, synthetic records:

| Field | Sample |
|---|---|
| Caregiver | Asha Example, `asha.test@example.com` (use an inbox you control) |
| Elder | Ramesh Example, age 72, Hindi, Pune |
| Family contact | Anita Example, daughter, use a phone number you control |
| Medicine | QA medicine A, 1 test unit, daily at a time you choose |
| Memory | Likes mango lassi |
| Event | QA test call, tomorrow at 11 AM |

Do not use a real person's personal, medical, or phone information for this check.

## Caregiver steps

1. Sign up or log in as a caregiver and complete onboarding.
2. Open Dashboard and choose **Create code**. Note the one-time code; it expires in 15 minutes.
3. Use the separate Settings page to inspect device status, generate a replacement code, or revoke active device tokens.
4. Add synthetic family, medicine, memory, and event records. Confirm caregiver CRUD saves and reloads.

## Elderly-device steps

1. Open the app on a different browser/device or an incognito window with separate storage.
2. Choose **I’m the patient**. Enter the caregiver's code using the large keypad.
3. Confirm Elderly Home opens and shows the elder's profile name. Close and reopen the browser; it should skip pairing.
4. Use the large microphone and allow browser microphone permission. Try:
   - `mujhe dawai dikha dijiye`
   - `beti ko phone karna hai`
   - `bhajan sunna hai` (the Hanuman Chalisa YouTube player should open; tap Play if the browser blocks autoplay)
   - `akela lag raha hai`
   - `madad, main gir gayi`
5. Confirm the response is spoken before the screen action. Medicine/family should open their care pages, bhajan should open its player, loneliness should remain in conversation, and the last should open Emergency.
6. Use medicine taken/skipped controls and the Emergency SOS action only on the disposable profile.

## Caregiver insight steps

1. Refresh Dashboard and check paired-device last-active time, interaction count and pending alert count.
2. Open Voice Interactions; inspect original-language transcript, response, intent, sentiment and emergency label.
3. Open Emergency Alerts; acknowledge or resolve a saved alert.
4. Open Daily Log; select today's date and inspect its on-demand voice summary and transcript timeline.
5. Open Memory Bank and review memory-intent utterances from the last week.

## Please report issues with

Send the step number, device/browser, visible message, and API path/status from the Network panel. Redact passwords, access/refresh tokens, the pairing code, email confirmation links, and any real personal details. For microphone failures, include browser name and permission setting.

