# SmritiVani Manual Testing Steps

**Current Status:** Database migration ✓ complete, Backend running ✓  
**Test Date:** November 8, 2026

---

## Pre-Test Verification (Do This First)

### 1. Verify Database Tables Exist

```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python check_db.py
```

**Expected Output:**
```
✓ has elder_device_codes table: True
✓ has paired_devices table: True
✓ has voice_interactions table: True
✓ has safety_alerts table: True
✓ has daily_summaries table: True
✓ DEVICE_PAIRING_PEPPER length: 52
```

**If Any Show False:** Run migration again
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python run_migration_0004.py
```

### 2. Verify Backend is Running

Check Terminal 1 output - should show:
```
Application startup complete
```

If not running, start it:
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python app.py
```

---

## Test Phase 1: Setup Frontend Servers (5 minutes)

### Terminal 2: Start Caregiver Frontend (Port 8443)

```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\frontend
$env:VITE_PORT = 8443
$env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8020"
pnpm dev
```

Wait for: "Local: http://localhost:8443/"

### Terminal 3: Start Elderly Frontend (Port 8444)

```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\frontend
$env:VITE_PORT = 8444
$env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8020"
pnpm dev
```

Wait for: "Local: http://localhost:8444/"

---

## Test Phase 2: Create Caregiver Account (3 minutes)

### Step 1: Open Browser
- **URL:** `http://localhost:8443`
- **Browser:** Chrome/Firefox/Edge (any)

### Step 2: Sign Up
1. Click **"Sign up"** link
2. Fill form:
   - **Email:** `caregiver@test.local`
   - **Password:** `Test@123456`
   - **First Name:** `Ravi`
   - **Last Name:** `Kumar`
   - **Account Type:** `Caregiver` (dropdown)
   - **Relationship to Elder:** `Son`
3. Click **"Create account"**

### Step 3: Verify
- **Expected:** Redirects to `/caregiver/dashboard`
- **Shows:** Empty elderly list (no elders linked yet)
- **Check:** localStorage has `sb_access_token` (open DevTools → Storage → localStorage)

---

## Test Phase 3: Create Elderly Account (3 minutes)

### Step 1: Open Incognito/Private Window
- **URL:** `http://localhost:8444`
- **Browser:** Same browser, incognito window (NOT the same window)

### Step 2: Sign Up
1. Click **"Sign up"** link
2. Fill form:
   - **Email:** `elderly@test.local`
   - **Password:** `Elder@123456`
   - **First Name:** `Amma`
   - **Last Name:** `Sharma`
   - **Account Type:** `Elderly` (dropdown)
3. Click **"Create account"**

### Step 3: Onboarding (First Time)
- **Expected:** Redirected to `/onboarding`
- **Complete the form:**
  - Basic info (name, age, city)
  - Medical info (doctor, medicines)
  - Preferences (language, contact method)
- Click **"Continue"** through all screens
- **Final:** Redirects to `/elderly` (home page)

### Step 4: Verify
- **Check:** localStorage has `sb_access_token`
- **Shows:** Voice input area, Events, Medicine, Family, Activities buttons

---

## Test Phase 4: Link Caregiver to Elderly (2 minutes)

### Option A: Using Browser API (Recommended for Testing)

**In Caregiver Browser (Port 8443):**

1. Open DevTools → Console
2. Paste this code:
```javascript
const token = localStorage.getItem('sb_access_token');
const response = await fetch('/api/access/link', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    elder_email: 'elderly@test.local'
  })
});
const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', data);
```

3. **Expected Output:**
```javascript
Status: 200
Response: { message: "Access granted" }
```

4. **Refresh** caregiver dashboard - should now show "Amma Sharma" in elderly list

### Option B: Using Backend Script

```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend

python -c "
import os
import sys
from datetime import datetime, timezone
from services.database import get_db_pool

os.environ['DATABASE_URL'] = 'postgresql://postgres.kpdehaqgltaaqphewrph:VIGILai_789\$\$_SAI@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require'

pool = get_db_pool()

with pool.connection() as conn:
    with conn.cursor() as cur:
        # Get caregiver ID
        cur.execute('SELECT id FROM auth.users WHERE email = %s', ('caregiver@test.local',))
        result = cur.fetchone()
        if not result:
            print('Caregiver not found')
            sys.exit(1)
        caregiver_id = result[0]
        
        # Get elderly ID
        cur.execute('SELECT id FROM auth.users WHERE email = %s', ('elderly@test.local',))
        result = cur.fetchone()
        if not result:
            print('Elderly not found')
            sys.exit(1)
        elderly_id = result[0]
        
        # Create elderly profile if missing
        cur.execute('INSERT INTO public.elders (user_id) VALUES (%s) ON CONFLICT(user_id) DO NOTHING', (elderly_id,))
        
        # Get elderly id from table
        cur.execute('SELECT id FROM public.elders WHERE user_id = %s', (elderly_id,))
        elder_row_id = cur.fetchone()[0]
        
        # Create caregiver access
        cur.execute(
            'INSERT INTO public.elder_memberships (elder_id, user_id, role, created_at) VALUES (%s, %s, %s, %s) ON CONFLICT(elder_id, user_id) DO NOTHING',
            (elder_row_id, caregiver_id, 'caregiver', datetime.now(timezone.utc))
        )
        conn.commit()
        print('✓ Caregiver linked to elderly')
"
```

---

## Test Phase 5: Generate Pairing Code (2 minutes)

### Step 1: Caregiver Goes to Settings
- **Browser:** Port 8443 (Caregiver)
- **URL:** `http://localhost:8443/caregiver/settings`

### Step 2: Find "Pair your loved one's device"
- Look for section with **heart icon** ❤️
- Shows: `Amma Sharma` care profile

### Step 3: Click "Generate pairing code"
1. Button says: **"Generate pairing code"**
2. Click it
3. Wait 1-2 seconds

### Step 4: Verify Code Appears
- **Expected:** Large 6-character code displayed (e.g., `A7F3KC`)
- **Format:** Monospace, large font, uppercase letters
- **Message:** "Pairing code created. It expires in 15 minutes and can be used once."
- **Check Network Tab:**
  - Request: `POST /api/pairing/codes?elder_id=...`
  - Status: **201 Created** (NOT 503)
  - Response body should have the code

**If 503 Error:**
- Check backend console (Terminal 1)
- Look for error messages
- Run `python check_db.py` again to verify tables exist
- If tables missing, run `python run_migration_0004.py`

### Step 5: Copy the Code
- Highlight and copy the code (or just memorize it)
- Example: `A7F3KC`

---

## Test Phase 6: Elderly Pairs Device (3 minutes)

### Step 1: Elderly Navigates to Pairing Page
- **Browser:** Port 8444 (Elderly, different window)
- **Current URL:** Should be `http://localhost:8444/elderly` (home)
- **Navigate to:** `http://localhost:8444/elderly/pair`

### Step 2: Enter Pairing Code
- See a form titled: **"Enter Pairing Code"**
- Input field shows: "Code (6 digits/letters)"
- **Paste the code** from caregiver (e.g., `A7F3KC`)
- **Code is case-insensitive** (can be lowercase)

### Step 3: Click "Pair Device"
1. Click button: **"Pair Device"** or **"Connect Device"**
2. Show loading state: "Pairing..." or spinner
3. Wait 2-3 seconds

### Step 4: Verify Pairing Success
- **Expected:** Page redirects to `http://localhost:8444/elderly`
- **Shows:** Home page with voice chat area
- **Check DevTools → Storage → localStorage:**
  - New key: `deviceToken` (should have a long JWT-like string)
  - NOT empty, NOT "undefined"

**If Still on Pairing Page:**
- Check browser console for errors
- Check network tab for error response
- Verify code is correct (case-insensitive)
- Verify code hasn't expired (max 10 minutes)

**If 400/404 Error in Network:**
- Error likely: "Invalid code" or "Code expired"
- Go back to caregiver, generate new code
- Repeat pairing

---

## Test Phase 7: Verify Pairing in Caregiver Settings (2 minutes)

### Step 1: Go Back to Caregiver Settings
- **Browser:** Port 8443 (Caregiver)
- **URL:** `http://localhost:8443/caregiver/settings`
- **Section:** "Pair your loved one's device"

### Step 2: Check Device Status
- **Button changes from:** "Generate pairing code" → "Generate replacement code"
- **Shows:** "Device paired on [timestamp]. Last active [timestamp]."
- **Button appears:** "Unpair device" (red button)

### Step 3: Verify Device Details
- If available, check for:
  - Device user agent
  - First paired date/time
  - Last seen timestamp

---

## Test Phase 8: Test Elderly Voice Input (2 minutes)

### Step 1: Elderly Interacts
- **Browser:** Port 8444 (Elderly)
- **URL:** `http://localhost:8444/elderly`
- **Click:** Voice input area or **"Listening..."** button

### Step 2: Provide Input
- **Say something** or **type text** (depending on implementation)
- Example: "What's the weather?" or "Play a song"
- Wait for AI response

### Step 3: Check Network
- Open DevTools → Network tab
- Look for request: `POST /api/pairing/voice` or similar
- **Headers should include:** `X-Device-Token: <token>`
- **Status:** 200 OK
- **Response:** Contains transcript and AI response

### Step 4: Caregiver Sees Interaction
- **Browser:** Port 8443 (Caregiver)
- **Navigate to:** Dashboard or appropriate interaction view
- Should see elderly's recent interactions
- Should show timestamps and content

---

## Test Phase 9: Verify End-to-End Flow

### Caregiver Side (Port 8443)
- [ ] Can sign up with email
- [ ] Sees elderly in dashboard after linking
- [ ] Can navigate to Settings
- [ ] Can generate pairing code (status 201, code appears)
- [ ] Code is 6 characters, uppercase
- [ ] After elderly pairs, status shows "Device paired"
- [ ] Can view paired device details
- [ ] Can see elderly's voice interactions/activity

### Elderly Side (Port 8444)
- [ ] Can sign up with email
- [ ] Completes onboarding first time
- [ ] Can navigate to `/elderly/pair`
- [ ] Can enter and submit pairing code
- [ ] Receives device token in localStorage
- [ ] Redirects to home page after pairing
- [ ] Can see voice input interface
- [ ] Can submit voice input
- [ ] Receives AI response

### API Endpoints (Check Network Tab)
- [ ] `POST /api/pairing/codes` → 201 with code
- [ ] `POST /api/pairing/verify` → 200 with device_token
- [ ] `POST /api/pairing/voice` → 200 with response
- [ ] All responses have correct headers and body structure

---

## If Something Fails

### 503 Service Unavailable on Pairing Code Generation

**Symptoms:** Click "Generate code" → Error "503 Service Unavailable"

**Fixes (in order):**
1. Check database tables exist:
   ```powershell
   python check_db.py
   ```
   - If `elder_device_codes` shows `False`, run migration

2. Check backend is running:
   - Terminal 1 should show "Application startup complete"
   - If not, restart: `python app.py`

3. Check backend logs for actual error:
   - Look at Terminal 1 output when you click the button
   - Copy any error messages

4. Check environment variables:
   ```powershell
   $env:DEVICE_PAIRING_PEPPER
   # Should output: smritivani_dev_pepper_secret_change_in_prod_12345678
   ```

5. Check database connectivity:
   ```powershell
   python check_db.py
   # Should show all tables and ✓ marks
   ```

### Pairing Code Won't Verify (400 Invalid Code)

**Fixes:**
1. Verify code is correct (copy-paste, not re-type)
2. Verify code hasn't expired (max 10 minutes)
3. Generate new code and try again
4. Check console for specific error message

### Device Token Not Saved

**Fixes:**
1. Open DevTools → Console, check for errors
2. Check Network tab → Response body for the token
3. If token present in response but not in localStorage, browser privacy settings may block it
4. Try in normal (not private) window

### Can't Access Frontend

**If Port 8443 or 8444 won't load:**
1. Check if port is in use:
   ```powershell
   Get-NetTCPConnection -LocalPort 8443 -ErrorAction SilentlyContinue
   ```
2. Kill existing process:
   ```powershell
   Get-Process | Where-Object {$_.Port -eq 8443} | Stop-Process
   ```
3. Restart frontend server with different port:
   ```powershell
   $env:VITE_PORT = 8445
   pnpm dev
   ```

---

## Success Criteria (PRODUCTION GRADE)

All of these must pass:

- [ ] Caregiver can generate code without errors (201 status)
- [ ] Code is 6 alphanumeric characters, uppercase
- [ ] Code expires after 10 minutes
- [ ] Elderly can enter code and pair device
- [ ] Device token saved to localStorage after pairing
- [ ] Caregiver can see device paired status
- [ ] Elderly can use voice/text input after pairing
- [ ] No error messages in browser console
- [ ] No error messages in backend (Terminal 1)
- [ ] All network requests return correct status codes
- [ ] Works consistently on refresh/reopening browsers

---

## Database Records to Check After Testing

```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend

python -c "
import os
from services.database import get_db_pool

os.environ['DATABASE_URL'] = 'postgresql://postgres.kpdehaqgltaaqphewrph:VIGILai_789\$\$_SAI@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require'

pool = get_db_pool()

with pool.connection() as conn:
    with conn.cursor() as cur:
        print('=== CAREGIVER ===')
        cur.execute('SELECT id, email FROM auth.users WHERE email = %s', ('caregiver@test.local',))
        if result := cur.fetchone():
            print(f'Caregiver: {result[1]} ({result[0]})')
        
        print('\\n=== ELDERLY ===')
        cur.execute('SELECT u.id, u.email, e.id FROM auth.users u JOIN public.elders e ON u.id = e.user_id WHERE u.email = %s', ('elderly@test.local',))
        if result := cur.fetchone():
            print(f'Elderly: {result[1]} ({result[0]})')
            print(f'Elder Record: {result[2]}')
        
        print('\\n=== MEMBERSHIPS ===')
        cur.execute('SELECT COUNT(*) FROM public.elder_memberships WHERE role = %s', ('caregiver',))
        print(f'Caregiver memberships: {cur.fetchone()[0]}')
        
        print('\\n=== PAIRING CODES ===')
        cur.execute('SELECT COUNT(*) FROM public.elder_device_codes WHERE consumed_at IS NULL')
        print(f'Active (unused) codes: {cur.fetchone()[0]}')
        
        print('\\n=== PAIRED DEVICES ===')
        cur.execute('SELECT COUNT(*) FROM public.paired_devices WHERE is_active = true')
        print(f'Active paired devices: {cur.fetchone()[0]}')
"
```

