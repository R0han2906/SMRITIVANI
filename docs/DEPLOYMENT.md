# Deployment preparation

## Local configuration

Use the existing backend and frontend `.env.example` templates. Keep local `.env` files private; `.gitignore` excludes them. The backend still needs its existing `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` for the database and Auth connections. Pairing also requires a unique random `DEVICE_PAIRING_PEPPER` of at least 32 characters.

Start the API from the repository root with the project's Python virtual environment active:

```powershell
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8020 --reload
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm run dev
```

## Production setup checklist

- Set `APP_ENV=production`, a private `DATABASE_URL`, Supabase URL and publishable key, `DEVICE_PAIRING_PEPPER`, and the chosen AI mode on the backend host.
- Configure `VITE_API_URL` to the deployed API base path and restrict CORS to the actual frontend domain before deployment.
- Review each new table's RLS grants and policies in a disposable Supabase project before production. The proposed migration is not applied.
- Place provider keys only in backend environment settings. Never expose Gemini, Groq, Gnani, Deepgram, or ElevenLabs keys in `VITE_*` variables.
- Add edge/API rate limiting for pairing code attempts; the in-process limiter is not shared across multiple workers or instances.
- Configure database backups, point-in-time recovery, credential rotation, health monitoring, and log retention.
- Consider a durable job scheduler for daily summaries, a push provider for alerts, and a verified telephony provider before relying on emergency notifications.

## AI mode changes

`mock` is the safe no-key mode. `hybrid` enables Gemini response generation and Groq fallback when keys and packages are configured. `gnani` does not make live Gnani requests yet; complete the adapter from verified documentation first.

