# 🧪 Multi-Port Testing Guide - SmritiVani

## Why Multi-Port Testing?

Testing the complete caregiver → elderly flow requires **two separate browser sessions** running simultaneously with **different localStorage**. Single-port testing creates localStorage conflicts.

---

## Setup: Run Frontend on Two Ports

### Step 1: Create Port Configuration

You need to run Vite dev server on two different ports. The default is 8443. We'll add 8444 for the elderly device.

**File:** `frontend/vite.config.ts`

Check current config:
```bash
cat frontend/vite.config.ts
```

Look for the `server` section. Update it to allow both ports:

```typescript
// vite.config.ts
export default defineConfig({
  // ... other config ...
  server: {
    port: parseInt(process.env.VITE_PORT || "8443"),
    hmr: {
      host: "localhost",
      port: parseInt(process.env.VITE_PORT || "8443"),
    },
  },
  // ... rest of config ...
});
```

If your config doesn't have a `server` section, add it.

### Step 2: Terminal 1 - Caregiver Frontend (Port 8443)

```bash
cd frontend
npm run dev
# Output: Local: http://localhost:8443/
```

This is the **caregiver interface**.

### Step 3: Terminal 2 - Elderly Frontend (Port 8444)

```bash
cd frontend
VITE_PORT=8444 npm run dev
# Output: Local: http://localhost:8444/
```

This is the **elderly/patient device interface**.

### Step 4: Verify Both Are Running

- Browser tab 1: `http://localhost:8443/` → Should show Welcome page or Caregiver Dashboard
- Browser tab 2: `http://localhost:8444/` → Should show Welcome page or Elderly Home

Both should be **independent** with separate localStorage.

---

## 🚀 Test Flow: Caregiver Setup + Elderly Pairing

### Test Scenario 1: Fresh Start (Everything Empty)

#### Terminal Setup:
- **Terminal 1** (Port 8443): Running caregiver frontend
- **Terminal 2** (Port 8444): Running elderly frontend
- **Backend**: Running on port 8000 (default)

#### Step 1: Caregiver Signs Up

**In Browser Tab 1** (http://localhost:8443/):

1. Click "Get started" button on Welcome page
2. Enter signup form:
   - Email: `caregiver@test.com`
   - Password: `Test123!@#`
   - Name: `Ramesh Kumar`
   - Phone: `+919876543210` (optional)
3. Click "Create account"
4. **Expected**: Redirected to Onboarding page (`/onboarding`)

#### Step 2: Caregiver Creates Elderly Profile

**Still in Tab 1** (http://localhost:8443/onboarding):

1. Fill in elderly profile:
   - Name: `Meera Devi`
   - Age: `75`
   - Language: `hindi` or `marathi`
   - City: `Mumbai`
   - Lives alone: ☐ (unchecked = lives with family)
   - Doctor's name: `Dr. Patel`
   - Doctor's phone: `+919876543211`
2. Click "Create profile"
3. **Expected**: Redirected to Dashboard (`/caregiver/dashboard`)
4. Dashboard shows: Meera Devi card with "No device is paired yet"

#### Step 3: Caregiver Generates Pairing Code

**In Tab 1** (http://localhost:8443/caregiver):

**Method A: From Dashboard**
1. Look for "Elderly device pairing" section
2. Click "Create code" button
3. Code appears (6 digits, e.g., `AC7F9B`)
4. **Copy the code** (Ctrl+C or click copy button if available)
5. Message shows: "Pairing code created. It expires in 15 minutes."

**Method B: From Settings**
1. Click sidebar "⚙️ Settings" or navigate to http://localhost:8443/caregiver/settings
2. Scroll to "Pair your loved one's device" section
3. See "Meera Devi" profile
4. Click "Generate pairing code" button
5. Code appears (same code format)
6. **Copy the code**

#### Step 4: Elderly Pairs Fresh Device

**In Browser Tab 2** (http://localhost:8444/):

1. Page should show Welcome screen (fresh device, no pairing)
2. Click "Open patient mode" button
3. **Expected**: Navigated to `/elderly/pair` (code entry page)
4. See prompt: "Enter your pairing code"
5. Paste the code from Step 3 (e.g., `AC7F9B`)
6. Click "Continue" or "Pair device"
7. **Expected**: 
   - Code verification happens (< 2 seconds)
   - Device token saved to localStorage
   - Redirected to `/elderly` (ElderlyHome, conversation page)
   - See: "Listening..." interface (elderly app)

#### Step 5: Elderly Uses the App

**In Tab 2** (http://localhost:8444/elderly):

1. See conversation interface
2. Click microphone or "Listen" button
3. Speak: "Hello, how are you?"
4. AI responds: "नमस्ते! मैं ठीक हूँ। आप कैसे हैं?" (in Hindi)
5. Conversation appears in "Recent voice interactions"

#### Step 6: Caregiver Sees Activity

**In Tab 1** (http://localhost:8443/caregiver):

1. Go back to Dashboard
2. Click "Meera Devi" card
3. See latest interaction
4. See: "1 conversation" in stats
5. Device is now marked as "Device paired on [timestamp]"

---

### Test Scenario 2: Elderly Returns to App (Page Refresh)

**In Browser Tab 2** (http://localhost:8444/):

1. Device token is stored in localStorage
2. Refresh page (Ctrl+R)
3. **Expected**:
   - Page shows "Connecting SmritiVani…" briefly (< 1 second)
   - Redirects to `/elderly` (ElderlyHome) automatically
   - **No** code entry page
   - Device state is restored

---

### Test Scenario 3: Elderly Device Reset (Clear localStorage)

**In Browser Tab 2** (http://localhost:8444/):

1. Open DevTools (F12)
2. Go to "Console" tab
3. Type: `localStorage.clear()`
4. Press Enter
5. Refresh page (Ctrl+R)
6. **Expected**: Shows Welcome page (fresh device again)
7. Must enter code again to pair

---

### Test Scenario 4: Caregiver Logs Out & Logs Back In

**In Tab 1** (http://localhost:8443/caregiver):

1. Click "⚙️ Settings"
2. Click "Log out" button at bottom
3. **Expected**: Redirected to `/login`
4. localStorage and sessionStorage cleared
5. Elderly device data also cleared (localStorage `device_token` removed)

Log back in:
1. Enter credentials: `caregiver@test.com` / `Test123!@#`
2. **Expected**: Redirected to `/caregiver/dashboard`
3. Device pairing data is cleared (won't accidentally show elderly interface)

---

### Test Scenario 5: Caregiver Logs In on Elderly Device (Same Laptop)

**In Tab 2** (http://localhost:8444/):

1. Tab 2 is running elderly frontend (port 8444)
2. Manually navigate to: `http://localhost:8444/login`
3. Enter caregiver credentials: `caregiver@test.com` / `Test123!@#`
4. **Expected**: 
   - Logs in successfully
   - **Redirected to** `/caregiver/dashboard` (NOT confused by device token)
   - Can use full caregiver interface
5. Device token is cleared, caregiver can see all caregiving features

**Return to elderly mode:**
1. Navigate to: `http://localhost:8444/`
2. **Expected**: Shows `/welcome` (device unpaired, caregiver context lost on logout)
3. Must re-pair with new code to return to elderly mode

---

### Test Scenario 6: Multiple Elderly Devices

#### Setup: Create 2nd Elderly Profile

**In Tab 1** (http://localhost:8443/caregiver/settings):

1. Click "Change care profile" or see "Select a profile" dropdown (if available)
2. Or: Click on another elderly name if one exists
3. Create new profile:
   - Name: `Harish Kumar`
   - Age: `80`
   - City: `Delhi`
4. Generate pairing code for this profile

#### Pair 2nd Device

**In Tab 2** (http://localhost:8444):

1. Current session has `Meera Devi` paired
2. Go to Settings (if available in elderly app) → Unpair OR clear localStorage
3. Refresh page
4. Enter new code (for `Harish Kumar`)
5. Device now paired to different elderly profile
6. Caregiver can switch between profiles: Tab 1 → Settings → switch profile

---

## 📊 Testing Checklist

### Routing Tests

- [ ] Fresh browser → Welcome page (not /elderly/pair)
- [ ] Caregiver login → /caregiver/dashboard (not /caregiver)
- [ ] Caregiver page refresh → stays on /caregiver (session persisted)
- [ ] Elderly device paired → /elderly (no code page)
- [ ] Elderly page refresh → /elderly (state persisted)
- [ ] Elderly code entry → /elderly after success
- [ ] Invalid code → error message, stays on /elderly/pair
- [ ] Elderly logout → /welcome (clear localStorage)
- [ ] Caregiver logout → /login

### Code Generation Tests

- [ ] Dashboard "Create code" button works
- [ ] Settings "Generate pairing code" button works
- [ ] Code format is correct (6 alphanumeric)
- [ ] Code expires after 15 minutes (try old code)
- [ ] Code can be used only once (reuse fails)
- [ ] Multiple codes can be generated (replacement codes)

### Device Pairing Tests

- [ ] Valid code pairs device
- [ ] Invalid code shows error
- [ ] Paired device shown in caregiver interface
- [ ] Device can be unpaired
- [ ] After unpair, code entry required again
- [ ] Multiple devices can be paired (same elderly)

### Browser State Tests

- [ ] Session survives page refresh (caregiver)
- [ ] Device token survives page refresh (elderly)
- [ ] Caregiver logout clears device data
- [ ] Browser tab switch maintains state
- [ ] Incognito mode has separate state

### API Tests

- [ ] Code generation hits `/pairing/codes` endpoint
- [ ] Code verification hits `/pairing/verify` endpoint
- [ ] Profile fetch hits `/pairing/profile` endpoint
- [ ] 401 response clears device token and redirects to /elderly/pair
- [ ] 401 response clears JWT and redirects to /login

---

## 🔧 Troubleshooting

### Issue: `/caregiver` shows 404 or blank page

**Solution**: 
- Check that ProtectedRoute is working: `console.log(isAuthenticated, user)` in browser DevTools
- Verify JWT token exists: `localStorage.getItem('smritivani.access_token')`
- Check App.tsx routes for `/caregiver/dashboard` alias

### Issue: "Create code" button doesn't work

**Solution**:
- Check backend is running: `curl http://localhost:8000/api/health`
- Check browser console for errors: F12 → Console tab
- Verify caregiver has an elderly profile created
- Check network tab: POST `/pairing/codes?elder_id=...` should return code

### Issue: Elderly code entry doesn't work

**Solution**:
- Verify code format matches (6 characters)
- Check code expiration: codes expire after 15 minutes
- Try generating new code from caregiver side
- Check backend `/pairing/verify` endpoint logs

### Issue: Page refresh loses data

**Solution**:
- Check localStorage: F12 → Application → Local Storage → `http://localhost:8443`
- Verify tokens are present:
  - Caregiver: `smritivani.access_token` and `smritivani.refresh_token`
  - Elderly: `smritivani.device_token` and `smritivani.elder_id`
- Check DeviceContext/AuthContext initialization logic

### Issue: Two ports interfere with each other

**Solution**:
- Ensure both are running: `npm run dev` (port 8443) and `VITE_PORT=8444 npm run dev` (port 8444)
- Check that each uses different localStorage (they should, different ports = different origins)
- Clear cache: DevTools → Ctrl+Shift+Delete

---

## 🏃 Quick Start Commands

```bash
# Terminal 1: Caregiver frontend (port 8443)
cd ~/coding/ai_projects/smritivani/SMRITIVANI
cd frontend
npm run dev

# Terminal 2: Elderly frontend (port 8444)
cd ~/coding/ai_projects/smritivani/SMRITIVANI
cd frontend
VITE_PORT=8444 npm run dev

# Terminal 3: Backend (if not already running)
cd ~/coding/ai_projects/smritivani/SMRITIVANI/backend
python app.py
```

Then:
- Caregiver: http://localhost:8443/
- Elderly: http://localhost:8444/

---

## 📱 Production Deployment Notes

For production:
- Deploy frontend to separate domains (or subdomains) to maintain separate localStorage
- Example: `caregiver.smritiv ani.com` and `patient.smritivani.com`
- Or use path-based routing with service workers to separate storage
- Same backend for both clients
