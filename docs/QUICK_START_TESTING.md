# 🚀 Quick Start: Testing SmritiVani Flow

## 30-Second Setup

```bash
# Terminal 1: Caregiver frontend
cd frontend && npm run dev
# → Open: http://localhost:8443/

# Terminal 2: Elderly frontend  
cd frontend && VITE_PORT=8444 npm run dev
# → Open: http://localhost:8444/

# Terminal 3: Backend (if needed)
cd backend && python app.py
```

---

## 5-Minute End-to-End Test

### Step 1: Caregiver Signs Up (Tab 1: 8443)
```
1. Click "Get started"
2. Email: caregiver@test.com
3. Password: Test123!@#
4. Name: Ramesh Kumar
5. Click "Create account"
→ Redirected to Onboarding
```

### Step 2: Create Elderly Profile (Tab 1: 8443)
```
1. Fill form:
   - Name: Meera Devi
   - Age: 75
   - Language: hindi
   - City: Mumbai
   - Doctor: Dr. Patel
2. Click "Create profile"
→ Redirected to Dashboard
```

### Step 3: Generate Code (Tab 1: 8443)
```
1. On Dashboard, find "Pair your loved one's device"
2. Click "Create code"
3. 6-character code appears (e.g., AC7F9B)
4. Copy the code
```

### Step 4: Pair Elderly Device (Tab 2: 8444)
```
1. Fresh page shows Welcome
2. Click "Open patient mode"
→ Navigate to /elderly/pair
3. Paste code from Step 3
4. Click "Continue"
→ Redirected to /elderly (Conversation page)
5. See microphone interface
```

### Step 5: Verify Connection
```
1. Tab 1: See device marked as "paired"
2. Tab 2: Can use conversation interface
3. Both tabs stay independent
```

---

## What Each Tab Represents

| Tab | URL | Mode | localStorage |
|-----|-----|------|--------------|
| 1 | http://localhost:8443/ | Caregiver | JWT auth |
| 2 | http://localhost:8444/ | Elderly | Device token |

Each tab has **completely independent** localStorage. No conflicts.

---

## Common Test Scenarios

### Test 1: Elderly Returns (Page Refresh)
```
Tab 2 → Press Ctrl+R
→ Should load /elderly directly (< 1 second)
→ NO code entry page
```

### Test 2: Caregiver Logout
```
Tab 1 → Settings → "Log out"
→ All data cleared
→ Back to /login
→ Tab 2 device data also cleared (auto-paired)
```

### Test 3: Fresh Device
```
Tab 2 → Open DevTools → Console
→ localStorage.clear()
→ Refresh page
→ Should show Welcome (needs code again)
```

### Test 4: Multiple Profiles
```
Tab 1 → Settings → Create new elderly profile
Tab 1 → Generate code for new profile
Tab 2 → Unpair (or clear localStorage)
Tab 2 → Enter new code
→ Now paired to different elder
```

---

## Debugging

### Is caregiver logged in?
```javascript
// Tab 1 DevTools Console:
localStorage.getItem('smritivani.access_token')
// Should show JWT token (long string starting with eyJ...)
```

### Is elderly device paired?
```javascript
// Tab 2 DevTools Console:
localStorage.getItem('smritivani.device_token')
// Should show device token
```

### Why isn't code button working?
```javascript
// Tab 1 DevTools Console:
localStorage.getItem('smritivani.elder_id')
// Should have elder ID (eld_...)
// If missing: Create elderly profile first
```

### Is backend working?
```bash
curl http://localhost:8000/api/health
# Should return 200 OK
```

---

## Expected Behavior

### ✅ Correct Flow
- Fresh load (Tab 1) → Welcome page
- Fresh load (Tab 2) → Welcome page
- Caregiver signs up → Redirected to Onboarding
- Create elder profile → Redirected to Dashboard
- Generate code → Code appears in large font
- Elderly enters code → Redirected to Conversation page
- Page refresh (Tab 2) → Stays in Conversation (< 1 second)
- Caregiver logout → Both tabs cleared

### ❌ Common Mistakes
- Forgetting to create elder profile before generating code
- Code expires after 15 minutes (try new code)
- Using same code twice (one-time use only)
- Running both on same port (use 8443 and 8444)
- Not having backend running (get 401s)

---

## Quick Commands

```bash
# Start caregiver (port 8443)
cd frontend && npm run dev

# Start elderly (port 8444)
cd frontend && VITE_PORT=8444 npm run dev

# Build for production
cd frontend && npm run build

# Check backend health
curl http://localhost:8000/api/health

# Clear caregiver storage (Tab 1 DevTools)
localStorage.clear()

# Clear elderly storage (Tab 2 DevTools)
localStorage.clear()
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm run dev` fails | Install deps: `npm install` |
| Backend 501 error | Ensure backend is running on port 8000 |
| Code entry fails | Try generating new code (old one may have expired) |
| `/caregiver` blank page | Check JWT token: `localStorage.getItem('smritivani.access_token')` |
| Elderly stuck on pairing | Clear localStorage and try fresh code |
| Both tabs interfering | Verify each uses different port (8443 vs 8444) |

---

## Next: Production Testing

Once this works locally:
1. See `PRODUCTION_ROUTING_CHECKLIST.md` for full pre-prod checklist
2. See `MULTI_PORT_TESTING_GUIDE.md` for advanced scenarios
3. See `FINAL_ROUTING_SUMMARY.md` for architecture overview

**All routing is production-ready! 🚀**
