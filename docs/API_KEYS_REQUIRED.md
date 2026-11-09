# SmritiVani API Keys Required

## Summary

SmritiVani runs in **MOCK MODE by default** and works completely offline. No API keys are required to start.

To activate full AI capabilities, you need to add optional keys below.

---

## Current Status: MOCK MODE (Default)

✅ **Works completely offline**
- Local rule-based intent classification (Hindi + Hinglish)
- Browser speech recognition (Web Speech API)
- Browser text-to-speech (speechSynthesis API)
- Emergency detection via keyword matching
- All caregiver dashboard features

⚠️ **Limited without external providers:**
- Responses are pre-written templates (not LLM-generated)
- Speech recognition limited to browser language support (typically English + one other)
- No provider redundancy if browser APIs unavailable

---

## Optional API Keys (For Enhanced AI)

### 1. **GEMINI_API_KEY** ⭐ RECOMMENDED
**Purpose:** LLM-generated responses in conversation  
**Provider:** Google AI Studio  
**Cost:** Free tier available (generous limits)  
**Setup:**
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key
4. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.0-flash
   ```
5. Set `AI_MODE=hybrid` in `backend/.env`

**Effect:** Responses become context-aware, warm, personalized

---

### 2. **GROQ_API_KEY** (Optional Fallback)
**Purpose:** Faster LLM fallback if Gemini fails  
**Provider:** Groq (free tier)  
**Cost:** Free  
**Setup:**
1. Go to https://console.groq.com/keys
2. Create API key
3. Add to `backend/.env`:
   ```
   GROQ_API_KEY=your_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

**Effect:** If Gemini is down, Groq handles responses. If both fail, falls back to local rules.

---

### 3. **GNANI_API_KEY** (Future Integration)
**Purpose:** Hindi-optimized speech recognition + synthesis  
**Provider:** Gnani.ai (from your challenge dashboard)  
**Cost:** Likely paid or included in challenge  
**Status:** ⚠️ ADAPTER EXISTS BUT NOT INTEGRATED
- Adapter skeleton: `backend/services/ai/providers/gnani.py`
- Requires API endpoint documentation (awaiting from Gnani)
- Currently falls back to browser speech APIs

**When Available:**
1. Get Gnani credentials from your challenge dashboard
2. Add to `backend/.env`:
   ```
   GNANI_API_KEY=your_key_here
   GNANI_BASE_URL=https://...
   GNANI_ASR_ENDPOINT=/transcribe
   GNANI_TTS_ENDPOINT=/synthesize
   GNANI_NLU_ENDPOINT=/classify
   GNANI_DEFAULT_VOICE_ID=female_hi
   GNANI_DEFAULT_LANGUAGE=hi-IN
   ```
3. Set `AI_MODE=gnani` in `backend/.env`

---

### 4. **DEEPGRAM_API_KEY** (Optional Alternative ASR)
**Purpose:** Alternative speech-to-text provider  
**Provider:** Deepgram  
**Cost:** Free tier available  
**Status:** Adapter skeleton exists, not integrated yet  

---

### 5. **ELEVENLABS_API_KEY** (Optional Alternative TTS)
**Purpose:** High-quality text-to-speech  
**Provider:** ElevenLabs  
**Cost:** Free tier available  
**Status:** Adapter skeleton exists, not integrated yet  

---

## Configuration Guide

### For Development (Start Here)
```bash
# backend/.env
AI_MODE=mock                    # Use local rules, no external APIs
ENABLE_BROWSER_FALLBACK=true    # Fall back to browser speech APIs
GEMINI_API_KEY=                 # Leave empty for mock mode
GROQ_API_KEY=                   # Leave empty for mock mode
```

**Result:** App works fully offline with template responses.

---

### For Testing with LLM (Recommended)
```bash
# backend/.env
AI_MODE=hybrid                           # Use local rules + Gemini/Groq
ENABLE_BROWSER_FALLBACK=true
GEMINI_API_KEY=<your_gemini_key>
GEMINI_MODEL=gemini-2.0-flash
GROQ_API_KEY=                            # Optional fallback
```

**Result:** Intelligent context-aware responses, still works offline via fallback.

---

### For Production (When All Keys Available)
```bash
# backend/.env
AI_MODE=gnani                    # Use Gnani for Hindi optimization
ENABLE_BROWSER_FALLBACK=true     # Always keep browser fallback
GNANI_API_KEY=<your_gnani_key>
GNANI_BASE_URL=<gnani_url>
GNANI_ASR_ENDPOINT=/transcribe
GNANI_TTS_ENDPOINT=/synthesize
GEMINI_API_KEY=<your_gemini_key> # Secondary LLM
GROQ_API_KEY=<your_groq_key>     # Tertiary LLM
```

**Result:** Optimized Hindi voice experience with full provider redundancy.

---

## Frontend Environment Variables

File: `frontend/.env.example`

```env
# API Gateway
VITE_API_URL=http://localhost:8020/api    # Backend URL for API calls

# Optional proxy for development
VITE_API_PROXY_TARGET=http://127.0.0.1:8020

# Browser speech API configuration
VITE_ENABLE_BROWSER_FALLBACK=true         # Enable fallback to browser speech
VITE_AUDIO_SAMPLE_RATE=16000              # Sample rate for audio capture (Hz)
```

**No sensitive keys in frontend .env** (security best practice).

---

## Priority Order (What to Get First)

| Priority | Key | Why | Timeline |
|----------|-----|-----|----------|
| 1 | GEMINI_API_KEY | Free, works instantly, dramatically improves responses | Get now (5 min) |
| 2 | GROQ_API_KEY | Free fallback, prevents response failures | Get now (5 min) |
| 3 | GNANI_API_KEY | Hindi-optimized, but needs API docs | Later (awaiting docs) |
| 4 | DEEPGRAM_API_KEY | Alternative ASR, not critical | Optional enhancement |
| 5 | ELEVENLABS_API_KEY | Premium TTS, not critical | Optional enhancement |

---

## How the Orchestrator Uses Keys (Priority Chain)

```
For Responses:
  1. Gemini (GEMINI_API_KEY) → if available and configured
  2. Groq (GROQ_API_KEY) → if Gemini fails or not available
  3. Local rules → always available, never fails

For Speech Recognition:
  1. Gnani (GNANI_API_KEY) → if available and configured
  2. Browser SpeechRecognition → always available, never fails

For Text-to-Speech:
  1. Gnani (GNANI_API_KEY) → if available and configured
  2. Browser speechSynthesis → always available, never fails
```

**Result:** System is resilient. At minimum, you get responses + speech from browser APIs.

---

## Testing Each Mode

### Test Mock Mode (No Keys Required)
```bash
cd backend
AI_MODE=mock python -c "from backend.services.ai.orchestrator import voice_orchestrator; import asyncio; print(asyncio.run(voice_orchestrator.process_text('mujhe dawai dikhao', 'elder123', language='hi-IN', name='Papa')))"
```

**Expected:** Transcript + medicine intent + local template response

---

### Test Hybrid Mode (Gemini Key Required)
```bash
cd backend
AI_MODE=hybrid GEMINI_API_KEY=your_key python -c "..."
```

**Expected:** Same as above, but response is LLM-generated, more natural Hindi.

---

## Where to Store Keys Safely

**NEVER commit .env to git:**
```bash
# .gitignore already includes:
.env
.env.local
.env.*.local
```

**Safe storage per environment:**

| Environment | Storage |
|-------------|---------|
| Development | `.env` file locally (git-ignored) |
| Staging | Vercel/Render secrets panel |
| Production | Vercel/Render secrets panel + rotate keys quarterly |

---

## Troubleshooting

### "Using local rule-based responses" warning
- Means GEMINI_API_KEY is missing or empty
- Response will be a template instead of LLM
- This is fine! Fallback works perfectly

### "External AI providers not configured" warning
- Expected when AI_MODE=mock
- Everything still works
- Add Gemini key and set AI_MODE=hybrid to improve

### Backend can't reach Gemini
- Check GEMINI_API_KEY is valid
- Check firewall/VPN isn't blocking googleapis.com
- Check rate limits (free tier has limits)
- Falls back to Groq or local rules automatically

---

## Next Steps

1. **Right now:** Copy `backend/.env.example` to `backend/.env`
2. **Get Gemini key:** https://aistudio.google.com/apikey (5 minutes)
3. **Get Groq key:** https://console.groq.com/keys (5 minutes)
4. **Add to `.env`:** Set GEMINI_API_KEY and GROQ_API_KEY, set AI_MODE=hybrid
5. **Wait for Gnani docs** to add GNANI_API_KEY later

---

**Status:** ✅ Documentation complete. App runs now in mock mode. Gemini/Groq optional for enhancement.
