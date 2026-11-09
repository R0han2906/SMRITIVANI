# ⚡ Quick Start: Test SmritiVani in 5 Minutes

## 🎯 What You'll Test

1. ✅ Caregiver signup
2. ✅ Elderly pairing
3. ✅ Voice interaction (mock mode)
4. ✅ Real-time dashboard
5. ✅ Emergency alert

---

## 🚀 Step 0: Start Servers

### Terminal 1 (Backend)
```bash
cd backend
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8020
```
✓ Wait for: "Uvicorn running on http://127.0.0.1:8020"

### Terminal 2 (Frontend)
```bash
cd frontend
npm run dev
```
✓ Wait for: "Local: http://localhost:5173"

---

## 📋 Sample Data

### **Caregiver 1**
```
Email:    caregiver1@test.com
Password: TestPass123!
Name:     Rajesh Kumar
Role:     Caregiver
```

### **Caregiver 2**
```
Email:    caregiver2@test.com
Password: TestPass123!
Name:     Priya Sharma
Role:     Caregiver
```

### **Elderly 1**
```
Name:            Ramesh Kumar
Age:             75
Language:        Hindi
City:            Mumbai
Doctor Name:     Dr. Naman Sharma
Doctor Phone:    +91-9876543210
Medical History: Diabetes, Hypertension
```

### **Elderly 2**
```
Name:            Lakshmi Devi
Age:             72
Language:        Hindi
City:            Bangalore
Doctor Name:     Dr. Priya Chakraborty
Doctor Phone:    +91-8765432109
Medical History: Arthritis, Asthma
```

---

## 🔄 Full Test Flow (5 minutes)

### **Part A: Caregiver Setup** (~1 min)

1. Open browser: `http://localhost:5173`
2. Click "Sign Up" → "Caregiver"
3. Enter:
   ```
   Email:       caregiver1@test.com
   Password:    TestPass123!
   Confirm:     TestPass123!
   Name:        Rajesh Kumar
   ```
4. Click "Sign Up"
5. ✅ **Expected:** Redirected to Dashboard

---

### **Part B: Create Elderly Profile** (~1 min)

**Note:** Currently you need backend access to create elderly profiles. 
For this test, assuming profile exists (or create via caregiver dashboard "Add Elderly")

Alternative: Use `create_user.py` script:
```bash
cd backend
python create_user.py
# Follow prompts to add elderly profile
```

---

### **Part C: Generate Pairing Code** (~30 sec)

1. **Caregiver Dashboard:** `http://localhost:5173/caregiver/dashboard`
2. Look for "Pair Elderly Device" or "Generate Claim Code"
3. Click button
4. ✅ **Expected:** Code appears (e.g., `ABCDE-FGHJK-MNPQR-STVWX-YZ2345`)
5. **Copy code** (for next step)

---

### **Part D: Elderly Signup & Device Pairing** (~1.5 min)

**New browser tab / incognito window** (simulates different device)

1. Open: `http://localhost:5173/elderly/register`
2. Enter elderly data:
   ```
   Name:            Ramesh Kumar
   Age:             75
   Language:        Hindi
   City:            Mumbai
   Doctor Name:     Dr. Naman Sharma
   Doctor Phone:    +91-9876543210
   ```
3. Click "Register"
4. ✅ **Expected:** Redirected to pairing screen

5. Paste claim code from Part C:
   ```
   Code: ABCDE-FGHJK-MNPQR-STVWX-YZ2345
   ```
6. Click "Pair Device"
7. ✅ **Expected:** 
   - Green "Connected" badge appears
   - Redirected to `/elderly/home`

---

### **Part E: Test Voice Interaction** (~1 min)

**On elderly device:**

1. See large ⭕ **Microphone button**
2. See greeting (Hindi): "नमस्ते! मैं आपकी सेवा करने के लिए यहाँ हूँ।"
3. Click mic button
4. **Speak any of these** (English or Hindi):
   ```
   English:
   - "I need to take my medicine"
   - "Call my family"
   - "Play bhajans"
   - "I'm having chest pain" (triggers emergency)
   
   Hindi:
   - "मुझे दवा लेनी है" (medicine)
   - "परिवार से बात करना" (family)
   - "भजन सुनना" (bhajan)
   - "मेरा दिल तेज़ चल रहा है" (emergency)
   ```

5. ✅ **Expected:**
   - Transcript appears
   - Intent detected (shows on screen)
   - Auto-navigates to relevant screen

**Example Flow:**
```
Elderly speaks:    "मुझे दवा लेनी है"
                   ↓
Browser STT:       Transcribes to text
                   ↓
Intent detected:   medicine
                   ↓
Screen redirects:  → /elderly/medicine
                   ↓
Medicine screen:   Shows medicines with TTS greeting
```

---

### **Part F: Test Dashboard in Real-Time** (~1 min)

**Back to caregiver browser (original tab):**

1. Refresh Dashboard: `http://localhost:5173/caregiver/dashboard`
2. ✅ **Expected:** New data appears:
   ```
   Voice Interactions: 1 ↑ (from 0)
   Last Mood:         Happy (or detected from interaction)
   Last Active:       Just now
   Pending Alerts:    0 (unless emergency triggered)
   Device Status:     Connected ✓
   ```

3. Click "View Interactions"
4. ✅ **Expected:** Timeline shows:
   ```
   10:30 AM | "मुझे दवा लेनी है"
   Intent: medicine
   Response: "आपकी दवाइयाँ तैयार हैं"
   ```

---

### **Part G: Test Emergency Alert** (~1 min)

**On elderly device:**

1. Go back to `/elderly/home`
2. Click mic again
3. Speak: **"मेरा दिल तेज़ चल रहा है"** (My heart is racing)
4. ✅ **Expected:**
   - Emergency alert created
   - Screen redirects to `/elderly/emergency`
   - Shows emergency contacts (caregiver)
   - Large SOS button appears
5. Click "Send Alert" or "SOS"
6. ✅ **Expected:** Alert sent to backend

**On caregiver dashboard:**

1. Refresh dashboard
2. ✅ **Expected:**
   ```
   🚨 Pending Alerts: 1
   (Red badge appears)
   ```

3. Click "Emergency Alerts"
4. ✅ **Expected:** Alert appears:
   ```
   🚨 EMERGENCY ALERT
   Time:       Nov 8, 10:45 AM
   Severity:   High
   Transcript: "मेरा दिल तेज़ चल रहा है"
   Status:     Open
   
   [Acknowledge] [Resolve] [False Alarm]
   ```

5. Click "Acknowledge"
6. ✅ **Expected:** Status changes to "Acknowledged"

---

## ✅ Success Criteria

| Step | What to Check | Status |
|------|---------------|--------|
| Backend starts | No errors on port 8020 | ✓ or ✗ |
| Frontend starts | Loads on port 5173 | ✓ or ✗ |
| Caregiver signup | Account created, JWT in localStorage | ✓ or ✗ |
| Elderly pairing | Device connected, green badge | ✓ or ✗ |
| Voice recording | Transcript appears | ✓ or ✗ |
| Intent routing | Navigates to correct screen | ✓ or ✗ |
| Dashboard updates | Real-time data visible | ✓ or ✗ |
| Emergency alert | Alert created, caregiver sees it | ✓ or ✗ |
| Alert handling | Can acknowledge/resolve | ✓ or ✗ |

---

## 🐛 Troubleshooting

### **Backend won't start**
```bash
# Check Python version
python --version  # Should be 3.11+

# Check dependencies
pip install -r backend/requirements.txt

# Check database connection
# Verify DATABASE_URL in .env
```

### **Frontend won't build**
```bash
# Clear cache
rm -rf frontend/node_modules
npm install

# Check Node version
node --version  # Should be 18+
```

### **Microphone not working**
```
1. Check browser permissions (click lock icon in URL bar)
2. Allow microphone access for localhost:5173
3. Refresh page
4. Try again
```

### **Device not pairing**
```
1. Copy EXACT claim code (with hyphens)
2. Check elderly email matches database
3. Verify DEVICE_PAIRING_PEPPER in .env is set
4. Restart backend
```

### **No data in caregiver dashboard**
```
1. Verify caregiver is linked to elderly profile
2. Check database paired_devices table
3. Ensure voice_interactions table has entries
4. Refresh dashboard (should auto-refresh every 30s)
```

---

## 🎯 Next: Enable Full ML

Once you're comfortable:

### **Switch to Hybrid Mode**
```bash
# backend/.env
AI_MODE=hybrid

# Restart backend
```

### **This will enable:**
- ✅ Groq LLM responses (instead of mock)
- ✅ Better intent classification
- ✅ Caregiver summaries from LLM
- ✅ Real AI conversation

### **Keys already in .env:**
- GROQ_API_KEY ✓
- GNANI_API_KEY ✓

No additional setup needed!

---

## 📚 Full Documentation

- **Architecture:** `docs/ARCHITECTURE.md`
- **API Reference:** `docs/API_REFERENCE.md`
- **End-to-End Test:** `docs/END_TO_END_TEST_FLOW.md`
- **API Keys:** `docs/API_KEYS_STATUS.md`
- **Known Issues:** `docs/KNOWN_ISSUES.md`

---

## ✨ You're Ready!

```
✅ Backend ready on :8020
✅ Frontend ready on :5173
✅ API keys configured
✅ Database connected
✅ All systems go

👉 Start with Part A above!
```

Good luck! 🚀

