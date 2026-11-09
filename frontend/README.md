# SmritiVani frontend

React 19, TypeScript, Vite, React Router, and Tailwind CSS 4.

## Local setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The development server proxies `/api` to `http://127.0.0.1:8020` by default, so browser requests are same-origin and do not need backend CORS headers. Set `VITE_API_PROXY_TARGET` in `.env` if the backend uses a different origin. `VITE_API_URL` defaults to `/api`.

## Production build

```powershell
npm run build
```

## Authentication flow

Only caregivers sign up and log in. The backend rejects patient signup/login. The frontend stores caregiver Supabase access and refresh tokens in local storage, checks `/api/users/me` on app start, refreshes an expired access token, and protects caregiver/onboarding routes. Signup can require email confirmation, depending on Supabase settings; in that case the caregiver confirms their email and then logs in.

Onboarding creates the elder profile, saves medicines to the existing `medicines` resource, and saves family members and extra profile details as `memories` records. Medicine frequency is retained in the existing `instructions` field because the current database has no frequency column. The caregiver generates a one-time pairing code; a separate elderly device exchanges it for its own opaque device token and never requires caregiver login. The elderly app is voice-first, using browser speech recognition and synthesis with a backend local intent pipeline. The new pairing and voice insight endpoints require the proposed backend migration `0004_device_pairing_voice.sql`, which has not been applied.

Local configuration belongs in `.env`, which is ignored by Git. Do not put secrets in `VITE_*` variables because frontend variables are public. See `../docs/END_TO_END_TEST_GUIDE.md` for caregiver-run manual checks after the database migration is approved and configured. No application tests or builds were run during this implementation at the user's request.
