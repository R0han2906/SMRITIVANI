# SmritiVani - Quick Command Reference

Copy & paste ready commands for production testing.

---

## ⚡ ONE-LINE STARTERS

### Terminal 1: Backend (Keep Running)
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend; python app.py
```

### Terminal 2: Caregiver Frontend (Port 8443)
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\frontend; $env:VITE_PORT = 8443; $env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8020"; pnpm dev
```

### Terminal 3: Elderly Frontend (Port 8444)
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\frontend; $env:VITE_PORT = 8444; $env:VITE_API_PROXY_TARGET = "http://127.0.0.1:8020"; pnpm dev
```

---

## 🔍 VERIFICATION COMMANDS

### Check Database Status
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python check_db.py
```

### Verify Migration Applied
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python -c "
import os
from services.database import get_db_pool

os.environ['DATABASE_URL'] = 'postgresql://postgres.kpdehaqgltaaqphewrph:VIGILai_789\$\$_SAI@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require'

pool = get_db_pool()
with pool.connection() as conn:
    with conn.cursor() as cur:
        cur.execute('SELECT COUNT(*) FROM public.elder_device_codes')
        count = cur.fetchone()[0]
        print(f'✓ elder_device_codes table exists with {count} records')
"
```

### Check Backend Status
```powershell
# See if backend is running on port 8020
$result = Test-NetConnection -ComputerName localhost -Port 8020 -InformationLevel Quiet
if ($result) { "✓ Backend running on port 8020" } else { "✗ Backend NOT running" }
```

### Check Frontend Ports
```powershell
# Check if ports 8443 and 8444 are in use
Get-NetTCPConnection -LocalPort 8443 -ErrorAction SilentlyContinue | Select-Object -Property State, OwningProcess
Get-NetTCPConnection -LocalPort 8444 -ErrorAction SilentlyContinue | Select-Object -Property State, OwningProcess
```

---

## 🔧 EMERGENCY COMMANDS

### Force Stop All Python Processes (Use if Stuck)
```powershell
Get-Process python | Stop-Process -Force
```

### Re-run Migration (If Tables Missing)
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python run_migration_0004.py
```

### Check Environment Variables
```powershell
# Show all SmritiVani env vars
Get-ChildItem env:VITE_* | Format-Table
Get-ChildItem env:DATABASE_* | Format-Table
Get-ChildItem env:DEVICE_* | Format-Table
```

### Kill Process Using Specific Port
```powershell
# Kill port 8443
$process = Get-NetTCPConnection -LocalPort 8443 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }

# Kill port 8444
$process = Get-NetTCPConnection -LocalPort 8444 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }
```

---

## 🌐 BROWSER TESTING COMMANDS

### JavaScript: Generate Pairing Code (Caregiver Console)
```javascript
// Copy elderly ID from URL or get it from API first
const elderId = 'ede463e8-a877-4595-812e-ed4fc8ed6b49'; // Replace with actual elderly ID

const token = localStorage.getItem('sb_access_token');
const response = await fetch(`/api/pairing/codes?elder_id=${elderId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Code:', data.claim_code);
```

### JavaScript: Verify Pairing (Elderly Console)
```javascript
const code = 'AC7F9B'; // From caregiver

const response = await fetch('/api/pairing/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Device Token:', data.device_token);

// Device token should be saved automatically by app
if (response.ok) {
  localStorage.setItem('deviceToken', data.device_token);
  console.log('✓ Device token saved');
}
```

### JavaScript: Test Voice Input (Elderly Console)
```javascript
const token = localStorage.getItem('deviceToken');
const response = await fetch('/api/pairing/voice', {
  method: 'POST',
  headers: {
    'X-Device-Token': token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transcript: 'What is my medicine schedule?',
    transcript_lang: 'hi-IN'
  })
});

const data = await response.json();
console.log('Status:', response.status);
console.log('Response:', data.response);
```

---

## 📊 DATABASE QUERY COMMANDS

### Python: List All Users
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python -c "
import os
from services.database import get_db_pool

os.environ['DATABASE_URL'] = 'postgresql://postgres.kpdehaqgltaaqphewrph:VIGILai_789\$\$_SAI@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require'

pool = get_db_pool()
with pool.connection() as conn:
    with conn.cursor() as cur:
        cur.execute('SELECT email, account_type, created_at FROM auth.users LIMIT 10')
        for row in cur.fetchall():
            print(f'{row[0]} ({row[1]}) - {row[2]}')
"
```

### Python: Check Pairing Codes
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python -c "
import os
from services.database import get_db_pool

os.environ['DATABASE_URL'] = 'postgresql://postgres.kpdehaqgltaaqphewrph:VIGILai_789\$\$_SAI@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require'

pool = get_db_pool()
with pool.connection() as conn:
    with conn.cursor() as cur:
        cur.execute('SELECT id, elder_id, consumed_at, expires_at FROM public.elder_device_codes ORDER BY created_at DESC LIMIT 5')
        for row in cur.fetchall():
            status = 'USED' if row[2] else 'ACTIVE'
            print(f'{status} - Code {row[0][:8]}... for elder {row[1]} (expires {row[3]})')
"
```

### Python: Check Paired Devices
```powershell
cd d:\coding\ai_projects\smritivani\SMRITIVANI\backend
python -c "
import os
from services.database import get_db_pool

os.environ['DATABASE_URL'] = 'postgresql://postgres.kpdehaqgltaaqphewrph:VIGILai_789\$\$_SAI@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require'

pool = get_db_pool()
with pool.connection() as conn:
    with conn.cursor() as cur:
        cur.execute('SELECT id, elder_id, is_active, first_paired_at, last_seen_at FROM public.paired_devices ORDER BY first_paired_at DESC LIMIT 5')
        for row in cur.fetchall():
            status = 'ACTIVE' if row[2] else 'INACTIVE'
            print(f'{status} - Device {row[0][:8]}... for elder {row[1]} (last seen {row[4]})')
"
```

---

## 🔗 BROWSER URLS

| Purpose | URL |
|---------|-----|
| Caregiver Home | `http://localhost:8443` |
| Caregiver Settings | `http://localhost:8443/caregiver/settings` |
| Caregiver Dashboard | `http://localhost:8443/caregiver/dashboard` |
| Elderly Home | `http://localhost:8444/elderly` |
| Elderly Pairing | `http://localhost:8444/elderly/pair` |
| Elderly Onboarding | `http://localhost:8444/onboarding` |

---

## 📋 TEST DATA TO USE

```
Caregiver:
  Email: caregiver@test.local
  Password: Test@123456
  Name: Ravi Kumar
  Relationship: Son

Elderly:
  Email: elderly@test.local
  Password: Elder@123456
  Name: Amma Sharma
  Age: 65 (example)
```

---

## ✅ SUCCESS INDICATORS

After running all commands, you should see:

1. **Backend Terminal:**
   ```
   Application startup complete
   ```

2. **Database Check:**
   ```
   ✓ has elder_device_codes table: True
   ✓ DEVICE_PAIRING_PEPPER length: 52
   ```

3. **Frontend Terminals (Both):**
   ```
   Local: http://localhost:8443/
   Local: http://localhost:8444/
   ```

4. **Pairing Code Generation:**
   - Network Status: **201 Created**
   - Response has: `claim_code: "XXXXXX"`
   - No 503 errors

---

## ⚠️ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| 503 on pairing code | Run: `python check_db.py` → verify tables exist |
| Port already in use | `Get-Process -Port 8443 \| Stop-Process` |
| Backend won't start | Check DATABASE_URL env var is set |
| Frontend won't load | Check VITE_PORT env var is set correctly |
| Device token missing | Check browser console for errors |
| Code won't verify | Generate new code (old one may have expired) |

---

## 📞 Final Notes

- **Pairing codes expire in:** 10 minutes
- **Device tokens valid for:** 30 days
- **Rate limit:** 5 attempts per 15 minutes per IP
- **Backend auto-reloads** on file changes (watch enabled)
- **Frontend hot-reloads** on file changes (Vite enabled)

