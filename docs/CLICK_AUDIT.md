# Frontend route and click audit

Source-level audit of `frontend/src/pages` routes. Caregiver routes are protected; elderly routes are available without patient sign-in after caregiver device setup. This is a code review, not a browser/device click-through. Manual testing remains with the user.

| Page(s) | Route / navigation | Interaction review and fixes |
|---|---|---|
| Welcome | `/`; caregiver CTAs select signup or dashboard from auth state; elderly CTA opens `/elderly`; login opens `/login` | Main CTAs, section scroll, and entry links have destinations. |
| Signup | `/signup` | Controlled required fields, confirmation match, disabled submit until complete, loading/error state, existing-account login link; handles email-confirmation response. |
| Login | `/login` | Backend login, loading/error state, password visibility, signup link; password recovery is explicitly disabled because the API has no reset flow. |
| Onboarding | `/onboarding` (protected) | Four-step in-memory form retains data across steps. Removes demo seed records; validates required profile details, prevents duplicate submit, reports partial resource failures, and saves to existing profile/memory/medicine contracts. Caregiver then creates a pairing code from Dashboard for a separate elderly device. |
| Dashboard | `/caregiver` (protected) | Loads the accessible elder profile and real events, medicines/logs, memories, contacts, daily summaries, alert counts, and voice-note metadata. Empty profile routes to onboarding. |
| Caregiver Events | `/caregiver/events` (protected) | Day selector filters backend events. Event create/edit/status/delete and medicine schedule create/edit/pause/resume/delete call the API. No reminder delivery worker exists in the backend. |
| MemoryBank | `/caregiver/memory` (protected) | Family, facts, and stories load from memories; create/edit/delete persists through the API. Calling uses `tel:` for saved numbers. |
| VoiceNotes | `/caregiver/notes` (protected) | Search and filters use saved voice-note metadata/transcripts. Audio recording, upload, and playback are unavailable in the backend and identified as such. |
| EmergencyAlert | `/caregiver/emergency` (protected) | Reads saved alerts, persists status changes, and manages real emergency contacts with `tel:` links. Automatic monitoring/detection is unavailable. |
| DailyLog | `/caregiver/log` (protected) | Reads backend daily summaries, medicine dose records, events, and voice-note transcripts. Today's taken/skipped medicine action writes a medicine log; daily summaries remain backend-owned/read-only. |
| Settings | `/caregiver/settings` (protected) | Saves caregiver and elder profile edits, creates pairing codes, shows paired-device activity, supports remote unpair, and logs out through AuthContext. Subscription, notification preferences, and privacy exports are unavailable in the API. |
| ClaimCodeEntry | `/elderly/pair` | Large numeric keypad exchanges a one-time code for a persistent opaque device token. |
| ElderlyHome | `/elderly` (paired-device mode) | Loads the paired profile and care data. Mic is the primary action; large medicine, family, and bhajan tiles are visual backups. |
| AISpeaking, Listening | `/elderly/speaking`, `/elderly/listening` | Browser speech recognition sends each utterance through the backend intent pipeline; browser speech synthesis speaks the returned response. Gemini/Groq are optional. |
| Medicine, Events, Family, Activities, Recap, Bhajan | `/elderly/medicine`, `/elderly/events`, `/elderly/family`, `/elderly/activities`, `/elderly/recap`, `/elderly/bhajan` | Reads saved medicine schedules/dose logs, events, contacts/memories, daily summaries, messages/transcripts, and saved interests. Patient can record taken/skipped doses. Activity tracking and music audio are unavailable. |
| Elderly Emergency | `/elderly/emergency` | Loads saved contacts and alerts. SOS creates a backend alert record; contacts call through `tel:`. The backend does not place calls or send notifications. |
| Unknown route | `*` | Redirects to `/` so no unknown URL renders a blank page. |

All caregiver and elderly navigation targets above are declared in `frontend/src/App.tsx`. Earlier build and TypeScript checks passed before this follow-up. The new pairing/voice changes were not built or tested at the user's request.
