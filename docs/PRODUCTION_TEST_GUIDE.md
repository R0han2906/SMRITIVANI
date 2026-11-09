# SmritiVani Production Testing Guide

**Date:** November 8, 2026  
**Status:** Migration Complete - All 5 tables created ✓  
**Backend:** Running (auto-reload enabled)  
**Testing Mode:** End-to-End with 2 users (Caregiver + Elderly)

---

## Quick Start Commands

### Terminal 1: Backend (LEAVE RUNNING)
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python app.py
```
**Expected Output:** `Application startup complete` at port 8020  
**Status:** ✓ Already running (term_1794157118931_vb5ntlhyg0n)

### Terminal 2: Frontend - Caregiver (Port 8443)
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\frontend
$env:VITE_PORT = 8443
$env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8020"
pnpm dev
```
**Access:** `http://localhost:8443`

### Terminal 3: Frontend - Elderly (Port 8444)
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\frontend
$env:VITE_PORT = 8444
$env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8020"
pnpm dev
```
**Access:** `http://localhost:8444`

---

## Test Scenario: Complete Pairing Flow

### Phase 1: Setup (First Run Only)

1. **Verify Database Migration**
   ```powershell
   cd backend
   python check_db.py
   ```
   Should show:
   ```
   ✓ has elder_device_codes table: True
   ✓ has paired_devices table: True
   ✓ has voice_interactions table: True
   ✓ has safety_alerts table: True
   ✓ has daily_summaries table: True
   ```

2. **Verify Backend is Running**
   - Backend should already be running from previous session
   - If needed, restart: `python app.py` in Terminal 1

### Phase 2: Create Test Accounts (Use Real Data Below)

#### Caregiver Account
1. Go to `http://localhost:8443`
2. Click **Sign Up**
3. Enter:
   - **Email:** `caregiver@smritivani.test`
   - **Password:** `Test@123456`
   - **Account Type:** Caregiver
   - **First Name:** Ravi
   - **Last Name:** Kumar
   - **Relationship:** Son
4. Verify: Redirects to `/caregiver/dashboard`

#### Elderly Account
1. Go to `http://localhost:8444` (different port/incognito)
2. Click **Sign Up**
3. Enter:
   - **Email:** `elderly@smritivani.test`
   - **Password:** `Elder@123456`
   - **Account Type:** Elderly
   - **First Name:** Amma
   - **Last Name:** Sharma
4. Verify: First-time elderly → **Onboarding flow**
   - Fill onboarding form with basic info
   - Complete profile setup

### Phase 3: Link Caregiver to Elderly (Backend API Call)

After both accounts exist, run this to create the relationship:

```powershell
cd backend
python -c "
import os
os.environ['DATABASE_URL'] = 'postgresql://postgres.kpdehaqgltaaqphewrph:VIGILai_789\$\$_SAI@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require'

from services.database import get_db_pool
from datetime import datetime, timezone

pool = get_db_pool()

# Get user IDs (from signup above)
caregiver_email = 'caregiver@smritivani.test'
elderly_email = 'elderly@smritivani.test'

with pool.connection() as conn:
    with conn.cursor() as cur:
        # Get caregiver ID
        cur.execute('SELECT id FROM auth.users WHERE email = %s', (caregiver_email,))
        caregiver_id = cur.fetchone()[0]
        print(f'Caregiver ID: {caregiver_id}')
        
        # Get elderly ID
        cur.execute('SELECT id FROM auth.users WHERE email = %s', (elderly_email,))
        elderly_id = cur.fetchone()[0]
        print(f'Elderly ID: {elderly_id}')
        
        # Create elderly profile
        cur.execute(
            'INSERT INTO public.elders (user_id, first_name, last_name) VALUES (%s, %s, %s) ON CONFLICT(user_id) DO NOTHING',
            (elderly_id, 'Amma', 'Sharma')
        )
        
        # Create caregiver access
        cur.execute(
            'INSERT INTO public.elder_memberships (elder_id, user_id, role, created_at) SELECT %s, %s, %s, %s WHERE NOT EXISTS (SELECT 1 FROM public.elder_memberships WHERE elder_id = %s AND user_id = %s)',
            (elderly_id, caregiver_id, 'caregiver', datetime.now(timezone.utc), elderly_id, caregiver_id)
        )
        conn.commit()
        print('✓ Relationship created')
"
```

**OR use browser API call:**
```javascript
// In browser console on caregiver port (8443)
const response = await fetch('/api/access/link', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('sb_access_token')
  },
  body: JSON.stringify({
    elder_email: 'elderly@smritivani.test'
  })
});
console.log(await response.json());
```

### Phase 4: Generate Pairing Code (CAREGIVER)

**Port:** 8443 (Caregiver)

1. Navigate to: `http://localhost:8443/caregiver/settings`
2. Look for **"Device Pairing"** or **"Generate Pairing Code"** button
3. Click **"Generate Code"**
4. **Expected:** 6-character code appears (e.g., `AC7F9B`)
5. **Network Tab Check:**
   - Request: `POST /api/pairing/codes?elder_id=<elderly_id>`
   - Status: **201 Created** (NOT 503)
   - Response body: `{"elder_id": "...", "claim_code": "AC7F9B", "expires_at": "...", "expires_in_seconds": 600}`

**If 503 Error:**
- Check backend logs in Terminal 1
- Run: `python check_db.py` - verify all tables exist
- Verify env var: `echo $env:DEVICE_PAIRING_PEPPER`

### Phase 5: Pair Elderly Device

**Port:** 8444 (Elderly - different browser/incognito)

1. Navigate to: `http://localhost:8444/elderly/pair`
2. Elderly sees **"Enter Pairing Code"** form
3. **Copy the code from Caregiver** (e.g., `AC7F9B`)
4. **Paste into Elderly form** and click **"Pair Device"**
5. **Expected:**
   - Network request: `POST /api/pairing/verify`
   - Status: **200 OK**
   - Response: `{"message": "Device paired", "elderly_id": "...", "device_token": "..."}`
   - Device token saved to localStorage as `deviceToken`
   - Redirects to: `http://localhost:8444/elderly` (home page)

**If Pairing Fails:**
- Check browser console for errors
- Verify code is correct (case-insensitive)
- Check if code expired (600 seconds / 10 minutes)
- Backend logs should show attempt

### Phase 6: Verify Pairing Success

**Elderly Device (Port 8444):**
1. Should be on home page: `/elderly`
2. Can click on voice chat, events, medicine, etc.
3. Open DevTools → Storage → localStorage
4. Should have: `deviceToken` (not empty)

**Caregiver (Port 8443):**
1. Navigate to: `http://localhost:8443/caregiver/settings`
2. Should show **"Device paired"** status
3. Should show device details: `User Agent`, `Last seen`, `Paired since`

### Phase 7: Test Elderly Voice Interaction

**Elderly (Port 8444):**
1. Click **"Listening..."** voice icon on home page
2. Record/simulate voice input (or use text for testing)
3. AI should respond
4. **Check network:** `POST /api/pairing/voice`
5. Should use `deviceToken` header: `X-Device-Token: <token>`

**Caregiver (Port 8443):**
1. Navigate to: `/caregiver/dashboard` or appropriate interaction view
2. Should see elderly's recent interactions
3. Should see voice history

---

## Test Data Summary

### Accounts to Create
| Role | Email | Password | First Name | Last Name |
|------|-------|----------|-----------|----------|
| Caregiver | `caregiver@smritivani.test` | `Test@123456` | Ravi | Kumar |
| Elderly | `elderly@smritivani.test` | `Elder@123456` | Amma | Sharma |

### Expected Responses

#### Generate Code (Caregiver)
```json
POST /api/pairing/codes?elder_id=<UUID>
Status: 201
{
  "elder_id": "ede463e8-a877-4595-812e-ed4fc8ed6b49",
  "claim_code": "AC7F9B",
  "expires_at": "2026-11-08T12:34:56.789012+00:00",
  "expires_in_seconds": 600
}
```

#### Verify Pairing (Elderly)
```json
POST /api/pairing/verify
Status: 200
{
  "message": "Device paired successfully",
  "elderly_id": "ede463e8-a877-4595-812e-ed4fc8ed6b49",
  "device_token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

#### Voice Interaction (Elderly)
```json
POST /api/pairing/voice
Headers: X-Device-Token: <token>
Status: 200
{
  "transcript": "user input here",
  "response": "assistant response",
  "intent": "general",
  "is_emergency": false
}
```

---

## Troubleshooting

### 503 Service Unavailable on /api/pairing/codes

**Root Cause:** Missing `elder_device_codes` table  
**Solution:** Run migration (already done ✓)
```powershell
cd backend
python run_migration_0004.py
```

### Device Code Not Generated

**Check:**
1. Caregiver authenticated? (Check JWT token in localStorage)
2. Backend running? (Check Terminal 1 output)
3. Database tables exist? (Run `python check_db.py`)
4. Network tab shows 201? (If 500+, check backend logs)

### Pairing Code Verification Fails

**Check:**
1. Code matches exactly (case-insensitive, 6 digits)
2. Code not expired (max 10 minutes)
3. Only ONE active code per elderly (older codes auto-expired)
4. Elderly account linked to caregiver

### Device Not Appearing in Caregiver Settings

**Check:**
1. Pairing completed on elderly device?
2. Device token in elderly's localStorage?
3. Caregiver has access to elderly profile?
4. Check `/caregiver/settings` page shows "Paired devices" section

---

## Production Checklist

Before deployment:

- [ ] All 5 tables created (run migration 0004)
- [ ] Backend environment variables set:
  - `DATABASE_URL` ✓
  - `SUPABASE_URL` ✓
  - `SUPABASE_PUBLISHABLE_KEY` ✓
  - `DEVICE_PAIRING_PEPPER` (length ≥ 32) ✓
- [ ] Frontend environment variables set:
  - `VITE_API_PROXY_TARGET` = backend URL
  - `VITE_API_URL` = `/api`
- [ ] HTTPS enabled in production (SSL cert)
- [ ] CORS properly configured
- [ ] Rate limiting enabled on pairing endpoints
- [ ] Logging enabled (check backend output)
- [ ] Database backups configured
- [ ] Error monitoring set up (Sentry, etc.)

---

## Notes

- **Device tokens valid for:** 30 days (configurable in code)
- **Pairing codes valid for:** 10 minutes (configurable: `PAIRING_TTL`)
- **Rate limiting:** Max 5 pairing attempts per IP per 15 minutes
- **Elderly can pair multiple devices** (but only 1 active device per elder at a time, oldest deactivated)

