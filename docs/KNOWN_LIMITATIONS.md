# Known limitations

- The new database migration is proposed only; pairing, persistent voice interactions, safety-alert insight pages, and voice summaries need it to be applied before they can run against Supabase.
- Gnani's adapter is a disabled skeleton until its current API contracts are available and implemented.
- Browser speech recognition and speech synthesis depend on browser/platform support, permission, and available language voices.
- Recorded-audio ASR endpoint returns a clear unavailable response; the MediaRecorder hook is not yet wired to a verified provider. Audio is not retained.
- `AI_MODE=mock` uses local rules and short templates. `AI_MODE=hybrid` requires Gemini/Groq keys and Python packages.
- Intent classification is rule-based and can miss phrases, dialects, or ambiguous context. Emergency detection is a supportive cue and is not a replacement for emergency services.
- Pairing attempt throttling is in-process only. Production deployments with multiple workers need shared rate limiting.
- Daily summaries are generated on demand; there is no scheduler. Mood is an approximate lexicon score, not a clinical measure.
- Alerts are polled by the caregiver dashboard every 30 seconds. No push notification, SMS, automatic phone call, or external emergency webhook is wired.
- No translation provider is active. Caregiver interaction transcripts are shown in the original recognized language.
- One Hanuman Chalisa video is embedded from T-Series Bhakti Sagar. Other music preferences are caregiver-saved metadata; a full catalog/player backend is not available. Browser autoplay settings may require a tap on Play.
- Subscription billing and audio upload/download remain unavailable.
- No application build, automated test, API request, audio test, or manual click-through was run for this task, at the user's request.
