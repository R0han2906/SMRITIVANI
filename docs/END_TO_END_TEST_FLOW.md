# 🧪 SmritiVani End-to-End Test Flow

Complete test scenario for caregiver + elderly (patient) voice interaction.

---

## 🔧 Prerequisites

### 1. **Start Backend**
```bash
cd backend
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8020
```

### 2. **Start Frontend (Vite)**
```bash
cd frontend
npm run dev
```

### 3. **Check API Keys in `.env`**
```
GROQ_API_KEY=Set in .env (not shown for security) ✓
GNANI_API_KEY=Set in .env (not shown for security) ✓
AI_MODE=mock (for offline testing, switch to hybrid once ready)
```

---

## 👴 **Test Flow: Elderly (Patient) Side**

### **Step 1: Elderly Signs Up (Create Profile)**

**URL:** `http://localhost:5173/elderly/register`

**Sample Input:**
```json
{
  "name": "Ramesh Kumar",
  "age": 75,
  "language": "Hindi",
  "city": "Mumbai",
  "doctor_name": "Dr. Priya Sharma",
  "doctor_phone": "+91-9876543210",
  "medical_conditions": ["Diabetes", "Hypertension"],
  "emergency_contact": "Rajesh Kumar",
  "emergency_phone": "+91-9988776655"
}
```

**Expected:** Profile created, elderly directed to claim code entry.

---

### **Step 2: Pair Device (Enter Claim Code)**

**URL:** `http://localhost:5173/elderly/pair`

**What to do:**
1. Go to caregiver side (see below)
2. Generate claim code on dashboard
3. Copy code (e.g., `ABCDE-FGHJK-MNPQR-STVWX-YZ2345`)
4. Paste into elderly device
5. Device pairs, screen redirects to `/elderly/home`

**Expected:** `isPaired=true`, green "Connected" badge

---

### **Step 3: Home Screen - Large Mic Button**

**URL:** `http://localhost:5173/elderly/home`

**What to do:**
1. See large 200px mic button ⭕
2. See greeting in Hindi: "नमस्ते! मैं आपकी सेवा करने के लिए यहाँ हूँ।"
3. Click mic button → record voice

**Test Voice Commands:**
```
"मुझे दवा लेनी है"       → Intent: medicine → Routes to Medicine screen
"परिवार से बात करना"   → Intent: family → Routes to Family screen  
"भजन सुनना"            → Intent: bhajan → Routes to Bhajan screen
"मेरा दिल तेज़ चल रहा है" → Intent: emergency → Auto-sends alert, routes to Emergency screen
```

**Expected:** 
- Voice recorded ✓
- Transcript shown (browser STT fallback for now)
- Intent detected
- Auto-navigates to relevant screen

---

### **Step 4: Medicine Screen - Voice Confirmation**

**URL:** `http://localhost:5173/elderly/medicine` (after voice intent)

**Expected:**
- Shows medicine list with image/name/dosage
- Displays intent: "आपने दवा लेने के बारे में बात की" (You asked about medicine)
- Large "Mark Taken" button
- TTS reads out: "आपकी दवाइयाँ यहाँ हैं। कौन सी लेंगे?" (Your medicines are here. Which will you take?)

**Action:**
- Tap medicine name or "Mark Taken"
- Medicine logged to `medicine_logs` table

---

### **Step 5: Family Screen - Video/Audio Call**

**URL:** `http://localhost:5173/elderly/family` (after voice intent)

**Expected:**
- Shows family contacts
- TTS: "आपका परिवार आपसे बात करने के लिए तैयार है" (Your family is ready to talk)
- Click contact name → initiates connection

---

### **Step 6: Bhajan Screen - Auto-Play on Voice Intent**

**URL:** `http://localhost:5173/elderly/bhajan` (auto-navigates)

**Expected:**
- Automatically plays bhajan audio
- Shows lyrics in Hindi
- Large pause/play button
- Volume control

---

### **Step 7: Emergency Screen**

**URL:** `http://localhost:5173/elderly/emergency` (auto-navigates on emergency intent)

**Expected:**
- Shows emergency contacts (caregiver)
- Auto-sends alert to caregiver backend
- Alert logged to `safety_alerts` table with `status='open'`
- Large SOS button for manual re-alert

---

---

## 👨‍⚕️ **Test Flow: Caregiver Side**

### **Step 1: Caregiver Signs Up**

**URL:** `http://localhost:5173/caregiver/signup`

**Sample Input:**
```json
{
  "email": "rajesh.caregiver@example.com",
  "password": "SecurePass123!",
  "display_name": "Rajesh Kumar",
  "account_type": "caregiver"
}
```

**Expected:** Account created, directed to dashboard.

---

### **Step 2: Generate Claim Code for Elderly**

**URL:** `http://localhost:5173/caregiver/dashboard`

**What to do:**
1. Click "Generate Claim Code" button
2. System generates code (e.g., `ABCDE-FGHJK-MNPQR-STVWX-YZ2345`)
3. Share with elderly (WhatsApp, SMS, etc.)
4. Elderly enters code in their device

**Backend:** `POST /api/pairing/issue` → generates code hash, stores in `pairing_codes` table

**Expected:** Claim code displayed, 15-min TTL

---

### **Step 3: Dashboard - Real-Time Voice Data**

**URL:** `http://localhost:5173/caregiver/dashboard`

**What appears:**
```
┌─────────────────────────────┐
│ Dashboard: Ramesh Kumar     │
├─────────────────────────────┤
│ 📊 Voice Interactions: 5    │ ← From GET /api/caregiver/interactions
│ 😊 Last Mood: Happy        │ ← From latest daily_summaries.mood_label
│ ⏱️ Last Active: 2 hrs ago   │ ← From voice_interactions.created_at
│ 🚨 Pending Alerts: 1       │ ← From safety_alerts.status='open'
│ 📱 Device Status: Connected │ ← From paired_devices.is_active
└─────────────────────────────┘
```

**Refresh:** Auto-refreshes every 30 seconds

---

### **Step 4: Daily Log - Voice Summary & Timeline**

**URL:** `http://localhost:5173/caregiver/daily-log`

**What appears:**
```
📅 Date Picker: [Nov 8, 2024]

📝 Voice Day Summary
─────────────────────
😊 Mood: Happy (avg sentiment 0.7)
📝 Summary: "Ramesh had a good day. Took medicines on time, 
           talked to family for 15 minutes, listened to 2 bhajans."
📊 Stats: 5 interactions, 23 minutes total, 0 emergencies

🎙️ Interaction Timeline
─────────────────────
10:30 AM  "मुझे दवा लेनी है"
          Intent: medicine → Status: Handled
          Response: "आपकी दवाइयाँ तैयार हैं"

11:15 AM  "परिवार से बात करना"
          Intent: family → Status: Handled
          Response: "परिवार से जुड़ रहे हैं..."

... (last 3 interactions shown)
```

**Backend:** `GET /api/caregiver/elders/{elder_id}/daily-summary`
- Aggregates voice_interactions for date
- Calls `summarize_voice_day()` 
- Returns mood_label, summary_text, total_interactions

---

### **Step 5: Emergency Alert - Handle Alert**

**URL:** `http://localhost:5173/caregiver/emergency-alerts`

**When elderly triggers emergency:**

```
🚨 EMERGENCY ALERT
─────────────────────
⏰ Time: Nov 8, 10:45 AM
🔴 Severity: High
📝 Transcript: "मेरा दिल तेज़ चल रहा है"
              (My heart is racing)
📍 Status: Open

[🟢 Acknowledge] [🔵 Resolve] [⚪ False Alarm]
```

**Buttons:**
1. **Acknowledge** → `status='acknowledged'`, caregiver receives notification
2. **Resolve** → `status='resolved'`, closes alert, logs action
3. **False Alarm** → `status='false_alarm'`, marks as misdetected

**Backend:** 
- `POST /api/caregiver/alerts/{alert_id}/acknowledge`
- `POST /api/caregiver/alerts/{alert_id}/resolve`
- `POST /api/caregiver/alerts/{alert_id}/false-positive`

---

---

## 🧪 **Test Scenarios (Complete Flow)**

### **Scenario 1: Medication Reminder** ✅
```
1. Elderly: "मुझे दवा लेनी है"
   ↓
2. System: Detects intent=medicine
   ↓
3. Frontend: Routes to Medicine screen
   ↓
4. Screen: Shows medicines, reads TTS
   ↓
5. Elderly: Clicks "Mark Taken"
   ↓
6. Backend: Logs medicine_logs entry
   ↓
7. Caregiver: Sees updated Daily Log with medicine compliance
```

---

### **Scenario 2: Family Connection** ✅
```
1. Elderly: "परिवार से बात करना"
   ↓
2. System: Detects intent=family
   ↓
3. Frontend: Routes to Family screen
   ↓
4. Screen: Shows family contacts, reads TTS
   ↓
5. Elderly: Clicks contact name
   ↓
6. Backend: Logs voice_interaction with intent=family
   ↓
7. Caregiver: Sees interaction in Daily Log timeline
```

---

### **Scenario 3: Emergency Alert** ✅
```
1. Elderly: "मेरा दिल तेज़ चल रहा है"
   ↓
2. System: Detects intent=emergency
   ↓
3. Backend: Auto-inserts safety_alerts entry
   ↓
4. Frontend: Routes to Emergency screen, shows SOS button
   ↓
5. Caregiver Dashboard: Updates "Pending Alerts: 1" with 🚨 badge
   ↓
6. Caregiver: Clicks alert, sees transcript + options
   ↓
7. Caregiver: Clicks "Acknowledge" or "Resolve"
   ↓
8. Backend: Updates alert status, logs timestamp
```

---

---

## 📊 **Key Database Tables**

### **voice_interactions**
```
id, elder_id, intent, transcript, sentiment_score, 
assistant_response, created_at
```

### **safety_alerts**
```
id, elder_id, severity, transcript, status 
(open/acknowledged/resolved/false_alarm), created_at
```

### **daily_summaries**
```
elder_id, summary_date, mood_score, mood_label, 
medicine_compliance_pct, total_interactions, summary_text, highlights
```

### **medicine_logs**
```
id, elder_id, medicine_id, scheduled_for, status (taken/missed), note, created_at
```

### **paired_devices**
```
id, elder_id, device_token_hash, is_active, created_at
```

---

---

## 🔗 **API Endpoints Tested**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pairing/issue` | POST | Generate claim code |
| `/api/pairing/claim` | POST | Elderly pairs device with code |
| `/api/voice/text` | POST | Process elderly's voice text |
| `/api/caregiver/interactions` | GET | Fetch caregiver's voice interactions |
| `/api/caregiver/alerts` | GET | Fetch safety alerts |
| `/api/caregiver/elders/{id}/daily-summary` | GET | Get daily summary |
| `/api/caregiver/alerts/{id}/acknowledge` | POST | Acknowledge alert |
| `/api/caregiver/alerts/{id}/resolve` | POST | Resolve alert |

---

---

## ✅ **Verification Checklist**

- [ ] Backend starts without errors
- [ ] Frontend builds without errors
- [ ] Caregiver can sign up
- [ ] Caregiver can generate claim code
- [ ] Elderly can pair device with code
- [ ] Elderly home screen shows mic button
- [ ] Voice recording works (browser STT)
- [ ] Intent routing works (medicine/family/bhajan/emergency)
- [ ] Medicine screen displays and logs
- [ ] Family screen shows contacts
- [ ] Emergency sends alert
- [ ] Caregiver dashboard shows real-time data
- [ ] Caregiver daily log shows summary
- [ ] Caregiver emergency alerts page works
- [ ] Alert acknowledge/resolve buttons work
- [ ] Database tables populate correctly

---

## 🎯 **Next Steps**

1. **Add API Keys** (when ready):
   - Groq: `GROQ_API_KEY=...`
   - Gnani: `GNANI_API_KEY=...` 
   - Gemini: `GEMINI_API_KEY=...`

2. **Switch to Hybrid Mode**:
   - Change `AI_MODE=hybrid` in `.env`
   - Restart backend
   - System will use Groq for LLM responses

3. **Production Checks**:
   - Add `DEVICE_PAIRING_PEPPER` (random 32+ chars)
   - Set `AI_MODE=hybrid` or specific provider
   - Configure logging level
   - Enable emergency webhook

