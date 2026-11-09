# SmritiVani backend

FastAPI application using Supabase Auth/PostgREST and a PostgreSQL connection pool.

## Local setup (PowerShell, from repository root)

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8020 --reload
```

The app loads local configuration from `backend/.env`. Required keys include `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`. Separate-device pairing also requires a unique random `DEVICE_PAIRING_PEPPER` of at least 32 characters. `AI_MODE=mock` runs browser speech with local rules and no AI provider keys; `hybrid` optionally uses Gemini and Groq. Keep real values private; `.gitignore` excludes environment files. The default local API documentation is at `http://127.0.0.1:8020/docs`.

Database migrations are applied explicitly to the intended Supabase project and are not run on application startup. The new pairing and voice endpoints require review/application of `schema/migrations/0004_device_pairing_voice.sql`; it has not been applied by this work. See `docs/routes.md`, `../docs/API_REFERENCE.md`, and `../docs/ML_PIPELINE.md` for contracts and behavior.

The Gnani adapter intentionally does not send requests until its official API URLs, authentication, payloads, and response formats are verified. The browser currently handles ASR/TTS; uploaded-audio transcription is unavailable.

## Unit tests

```powershell
$env:PYTHONPATH = "."
backend\.venv\Scripts\python.exe -m unittest discover -s backend\test -v
```
