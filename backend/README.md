# SmritiVani backend

FastAPI application using Supabase Auth/PostgREST and a PostgreSQL connection pool.

## Local setup (PowerShell, from repository root)

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8020 --reload
```

The app loads local configuration from `backend/.env`. Required keys include `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY`. Separate-device pairing also requires a unique random `DEVICE_PAIRING_PEPPER` of at least 32 characters. Set `AI_MODE=groq` and configure `GROQ_API_KEY` for conversational reply text; set `AI_MODE=hybrid` to try Gemini then Groq. Gnani uses `GNANI_API_KEY` for recorded-audio transcription and WAV speech output. Groq/Gnani keys stay on the backend and are never sent to the browser. Keep real values private; `.gitignore` excludes environment files. The default local API documentation is at `http://127.0.0.1:8020/docs`.

Database migrations are applied explicitly to the intended Supabase project and are not run on application startup. The new pairing and voice endpoints require review/application of `schema/migrations/0004_device_pairing_voice.sql`; it has not been applied by this work. See `docs/routes.md`, `../docs/API_REFERENCE.md`, and `../docs/ML_PIPELINE.md` for contracts and behavior.

Emergency detection and alert creation remain local and deterministic. Groq only writes non-emergency reply text; Gnani TTS produces spoken WAV audio. If an external text or speech provider fails, the endpoint still returns safe text and the browser can speak it as a fallback.

## Unit tests

```powershell
$env:PYTHONPATH = "."
backend\.venv\Scripts\python.exe -m unittest discover -s backend\test -v
```
