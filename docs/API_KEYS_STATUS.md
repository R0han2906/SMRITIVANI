# 🔑 API Keys Status & Configuration

## Current Status

### ✅ **Ready (Keys Already in `.env`)**
| Key | Purpose | Status |
|-----|---------|--------|
| `SUPABASE_URL` | Database + Auth | ✅ Active |
| `SUPABASE_PUBLISHABLE_KEY` | Frontend auth | ✅ Active |
| `DATABASE_URL` | PostgreSQL connection | ✅ Active |
| `GNANI_API_KEY` | Speech-to-Text + Text-to-Speech | ✅ Added |
| `GROQ_API_KEY` | LLM (Llama-3.3-70B) | ✅ Added |
| `DEVICE_PAIRING_PEPPER` | Pairing code hashing | ✅ Added (dev) |

---

## 🚀 How It Works (Architecture)

```
┌─────────────────┐
│   Elderly Voice │
└────────┬────────┘
         │ (transcription)
         ↓
    [STT Provider]
    ├─ Browser SpeechRecognition (offline fallback)
    └─ Gnani ASR (if key + AI_MODE=hybrid)
         │
         ↓
    [Intent Classification]
    ├─ Local rules (medicine/family/bhajan/emergency)
    └─ LLM intent classifier (if key)
         │
         ↓
    [LLM Response Generation]
    ├─ Groq (primary, fast)
    ├─ Gemini (fallback)
    └─ Local rules (fallback)
         │
         ↓
    [TTS Provider]
    ├─ Browser speechSynthesis (offline fallback)
    └─ Gnani TTS (if key + AI_MODE=hybrid)
         │
         ↓
    ┌──────────────┐
    │ Audio Response
    └──────────────┘
```

---

## 📋 Key Details

### **Groq (LLM Brain)**
```
Status:     ✅ Configured in .env (key not shown for security)
Key:        [Set in .env, not committed to repo]
Model:      llama-3.3-70b-versatile
Purpose:    Generate intelligent responses to elderly queries
Latency:    ~100-200ms (very fast)
Cost:       Free tier available (100 requests/min)
Region:     Global
```

**What it does:**
- Understands Hindi/Hinglish queries
- Generates contextual responses
- Can detect emergency situations
- Powers caregiver summaries

**Example Flow:**
```
Elderly: "मेरा सिर दर्द करता है"
         (My head hurts)
         ↓
Groq:    "आपको बुखार तो नहीं है? 
         आइए डॉक्टर को कॉल करते हैं।"
         (Do you have fever? Let's call the doctor.)
```

---

### **Gnani (Indian Language Expert)**
```
Status:     ✅ Configured in .env (key not shown for security)
Key:        [Set in .env, not committed to repo]
Provider:   One API key covers all features:
  - STT (Speech-to-Text) for Hindi/Hinglish
  - TTS (Text-to-Speech) with natural pronunciation
  - Voice Cloning (clone elderly's voice for confirmations)
Models:     Prisma v3.0 (auto-language detection)
Purpose:    Best-in-class speech recognition for Indian languages
Latency:    ~200ms P95
Cost:       Pay-as-you-go (generous free tier)
Region:     India-optimized
```

**What it does:**
- Converts elderly's voice to text (handles accents, code-switching Hindi-English)
- Converts system responses back to natural Hindi speech
- Perfect for "नमस्ते", "आधार", "ईएमआई" pronunciation
- No separate endpoints for NLU/sentiment (single unified key)

**Example:**
```
Elderly (Hindi):  "भजन सुनना चाहता हूँ"
Gnani STT:        Transcribes to text ✓
System:           Processes intent=bhajan ✓
Gnani TTS:        "भजन प्लेलिस्ट शुरू हो रहा है" ✓
```

---

### **Gemini (Optional Fallback)**
```
Status:     ❌ Not configured yet (optional)
Get Key:    https://aistudio.google.com/apikey
Model:      gemini-2.0-flash
Purpose:    Backup LLM if Groq unavailable
Cost:       Free tier: 50 requests/min
```

---

### **Deepgram (Audio Enhancement - Future)**
```
Status:     ❌ Not configured yet (optional)
Purpose:    Better speech-to-text for noisy environments
Cost:       Free tier available
Useful for: Elderly speaking softly, background noise
```

---

### **ElevenLabs (Premium TTS - Future)**
```
Status:     ❌ Not configured yet (optional)
Purpose:    Super natural voice synthesis
Cost:       Paid (but much more natural than free TTS)
Useful for: Better elderly experience
```

---

## 🔄 Provider Priority Chain

### **Current (AI_MODE=mock)**
```
Text Generation:     Local rules → Mock response
Speech-to-Text:      Browser SpeechRecognition
Text-to-Speech:      Browser speechSynthesis
Works offline:       ✅ Yes (no internet needed)
Requires API keys:   ❌ No
```

### **When AI_MODE=hybrid (Recommended)**
```
Text Generation:
  1. Groq (fast, free, reliable)
  2. Gemini (if Groq fails)
  3. Local rules (fallback)

Speech-to-Text:
  1. Gnani (if key available)
  2. Browser SpeechRecognition (fallback)

Text-to-Speech:
  1. Gnani (if key available)
  2. Browser speechSynthesis (fallback)

Works offline:       ✅ Partial (falls back to browser)
Requires API keys:   ✅ Recommended: Groq + Gnani
```

---

## 🎯 Recommended Setup

### **For Development (Current)**
```
AI_MODE=mock
ENABLE_BROWSER_FALLBACK=true
✓ Works offline
✓ No API cost
✓ Fast testing
✗ Limited responses (local rules only)
```

### **For Testing ML Features (Recommended Now)**
```
AI_MODE=hybrid
GROQ_API_KEY=your_groq_key_here
GNANI_API_KEY=your_gnani_key_here
✓ Full AI responses (Groq)
✓ Indian language expertise (Gnani)
✓ Real ML pipeline
✗ API usage (but free tier sufficient)
```

### **For Production**
```
AI_MODE=hybrid
GROQ_API_KEY=production_key_here
GEMINI_API_KEY=production_key_here (optional)
GNANI_API_KEY=production_key_here
ENABLE_BROWSER_FALLBACK=false
APP_ENV=production
DEVICE_PAIRING_PEPPER=random_32_char_secret
✓ Reliable, scalable
✓ Multiple fallbacks
✗ Requires budget for API usage
```

---

## 🧪 Testing Each Component

### **Test Groq LLM**
```bash
# In backend
python -c "
from backend.services.ai.providers.groq import GroqProvider
p = GroqProvider()
resp = p.generate_response('आप कैसे हो?', history=[], profile={})
print(resp)
"
```

### **Test Gnani STT** (needs curl + audio file)
```bash
curl -X POST https://api.gnani.ai/v1/transcribe \
  -H "x-api-key-id: YOUR_KEY" \
  -F "audio=@test.wav" \
  -F "language_code=hi-IN"
```

### **Test Gnani TTS**
```bash
curl -X POST https://api.gnani.ai/v1/tts \
  -H "x-api-key-id: YOUR_KEY" \
  -d '{"text":"नमस्ते","language":"hi-IN","voice":"default"}' \
  > output.wav
```

### **Test Browser STT** (works offline)
- Open elderly home
- Click mic
- Speak Hindi: "मेरा नाम राज है"
- Should transcribe in browser

---

## 📊 Cost Estimate (Monthly)

| Provider | Free Tier | Cost | Usage |
|----------|-----------|------|-------|
| Groq | 100 req/min | ~$0 | Elderly interactions |
| Gnani | Generous | ~₹500-1000 | 10k STT + 10k TTS |
| Gemini | 50 req/min | ~$0 | Fallback only |
| **Total** | **Mostly free** | **~₹500-1000** | **Adequate for MVP** |

---

## ✅ Quick Checklist

- [x] GROQ_API_KEY in .env
- [x] GNANI_API_KEY in .env
- [x] DEVICE_PAIRING_PEPPER in .env
- [x] AI_MODE set to mock (switch to hybrid to test LLM)
- [x] ENABLE_BROWSER_FALLBACK=true (graceful degradation)
- [ ] GEMINI_API_KEY (optional, get from https://aistudio.google.com/apikey)
- [ ] Test flow completed (see END_TO_END_TEST_FLOW.md)

---

## 🚀 Next Action

**To activate full ML pipeline:**
```bash
# In backend/.env
AI_MODE=hybrid

# Restart backend
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8020
```

System will automatically use:
- Groq for responses (no additional key needed, already there)
- Gnani for speech (if using Gnani UI in future)
- Browser fallback if any service fails

✅ You're ready to test!

