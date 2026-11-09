# API reference additions

All paths below are under the configured API prefix (default `/api`). The existing bearer-authenticated caregiver routes remain unchanged. The device routes use `X-Device-Token`; the token is sent only by the paired elderly browser.

## Pairing

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/pairing/codes?elder_id={uuid}` | Caregiver JWT | Issue a one-time six-digit, 15-minute code. The raw value is returned once. |
| `POST` | `/pairing/verify` | Public code exchange | Body `{ "claim_code": "472901" }`; returns opaque token, device ID, and elder profile. |
| `GET` | `/pairing/profile` | `X-Device-Token` | Validate device and return the paired profile. |
| `GET` | `/pairing/resources/{resource}` | `X-Device-Token` | List allowlisted records scoped to the paired elder. |
| `POST` | `/pairing/resources/medicine-logs` | `X-Device-Token` | Record `taken`, `missed`, or `skipped` for a medicine in the paired elder profile. |
| `POST` | `/pairing/resources/alerts` | `X-Device-Token` | Record an elderly-side SOS/distress alert. |
| `DELETE` | `/pairing/device` | `X-Device-Token` | Unpair the current browser token. |
| `GET` | `/pairing/devices?elder_id={uuid}` | Caregiver JWT | List paired-device timestamps and active state. Tokens are never returned. |
| `POST` | `/pairing/unpair` | Caregiver JWT | Body `{ "elder_id": "..." }`; revoke all active devices for that profile. |

These routes require the proposed `0004_device_pairing_voice.sql` migration. Until it is applied, pairing endpoints that access its tables return a database service error.

## Voice and caregiver insights

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/voice/text` | `X-Device-Token` | Process browser-recognized text, persist interaction, return response/action. |
| `POST` | `/voice/process` | `X-Device-Token` | Audio upload contract; currently returns 503 until a verified ASR adapter is available. |
| `GET` | `/voice/history?limit=20` | `X-Device-Token` | Recent interactions for the paired profile. |
| `GET` | `/voice/status` | Public | Provider readiness and degraded services without secret values. |
| `GET` | `/caregiver/elders/{elder_id}/interactions` | Caregiver JWT | RLS-scoped voice interactions; optional `date` and `limit`. |
| `GET` | `/caregiver/elders/{elder_id}/alerts` | Caregiver JWT | RLS-scoped safety alerts; optional status filter. |
| `POST` | `/caregiver/alerts/{id}/acknowledge` | Caregiver JWT | Acknowledge a safety alert. |
| `POST` | `/caregiver/alerts/{id}/resolve` | Caregiver JWT | Resolve a safety alert. |
| `POST` | `/caregiver/alerts/{id}/false-positive` | Caregiver JWT | Mark a safety alert false positive. |
| `GET` | `/caregiver/elders/{elder_id}/daily-summary?summary_date=YYYY-MM-DD` | Caregiver JWT | Generate/cache a local day summary. |

`VoiceResponse` includes `transcript`, `intent`, `sentiment`, `emergency`, `assistant_text`, optional audio fields, `action`, providers, latency, degraded-mode status, and warnings. The browser currently supplies ASR/TTS; backend output audio is empty.

