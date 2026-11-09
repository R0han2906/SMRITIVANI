# ✅ Routing Test Scenarios

## Test Setup
Before each scenario, **clear browser localStorage**:
```javascript
localStorage.clear();
```

---

## Scenario 1: Fresh Device (npm run dev)

### Expected Flow
```
User opens http://localhost:8443/ for the first time
```

### State Checks
- `localStorage.device_token` = null
- `localStorage.access_token` = null
- `localStorage.PATIENT_DEVICE_READY_KEY` = null

### DeviceContext State
```typescript
requiresPairing = Boolean(getStoredDeviceToken()) = Boolean(null) = false
isPaired = false (default)
isLoading = true (initially)

// After useEffect:
if (!getStoredDeviceToken()) { setIsLoading(false); return; }
// ^ Exits early because no token

Final State:
- device.isLoading = false
- device.requiresPairing = false
- device.isPaired = false
```

### EntryRoute Execution
```typescript
if (device.isLoading) → NO (false)
if (device.isPaired) → NO (false)
if (device.requiresPairing) → NO (false)
if (authLoading) → NO (auth loaded)
if (isAuthenticated && user?.account_type === "caregiver") → NO (not auth)
return <Welcome /> ✅
```

### Expected Result
**✅ Shows Welcome page** (not /elderly/pair)

---

## Scenario 2: Paired Device (Elderly Returns)

### Setup
User previously paired device, so localStorage has:
```javascript
localStorage.device_token = "dev_2ad8f9c7-85a1..."
localStorage.smritivani.elder_id = "eld_abc123"
```

### Expected Flow
```
User opens http://localhost:8443/
Device should be ready in < 500ms
```

### DeviceContext State
```typescript
requiresPairing = Boolean(getStoredDeviceToken()) = Boolean("dev_...") = true
isPaired = false (initially)
isLoading = true

// After useEffect:
if (!getStoredDeviceToken()) → FALSE (token exists!)
  → Continues to getPairedElderProfile()
  
// Backend returns profile successfully
setElderlyProfile(profile)
setIsPaired(true)
setRequiresPairing(false)
setIsLoading(false)

Final State:
- device.isLoading = false
- device.requiresPairing = false
- device.isPaired = true ✅
```

### EntryRoute Execution
```typescript
if (device.isLoading) → NO (false)
if (device.isPaired) → YES ✅
return <ElderlyHome /> ✅
```

### Expected Result
**✅ Shows Elderly Home (Conversation Page)** - instantly, no auth screens

---

## Scenario 3: Device Needs Pairing (Elderly Has Code)

### Setup
Elderly has a pairing code, fresh device with no token.
User opens http://localhost:8443/elderly/pair and enters code.
Backend returns 401 or invalid.

### State
```javascript
localStorage.device_token = null
localStorage.PATIENT_DEVICE_READY_KEY = "true"
localStorage.smritivani.elder_id = null
// OR:
// Caregiver at step 2 and hasn't called /pair yet
```

### DeviceContext State
```typescript
requiresPairing = Boolean(getStoredDeviceToken()) = Boolean(null) = false
isPaired = false
isLoading = true

// After useEffect checks:
if (!getStoredDeviceToken()) { setIsLoading(false); return; }

Final State:
- device.isLoading = false
- device.requiresPairing = false
- device.isPaired = false
```

BUT WAIT - How does `requiresPairing` become TRUE?

Let me trace this more carefully...

Looking at DeviceProvider constructor:
```typescript
const [requiresPairing, setRequiresPairing] = useState(() => Boolean(getStoredDeviceToken()));
```

This ONLY sets requiresPairing based on device token.

So `requiresPairing = true` means:
1. Device token exists in localStorage
2. But `getPairedElderProfile()` failed
3. So we disable the device
4. And set `requiresPairing = true` to route to /elderly/pair

### Actual Flow for This Scenario
```
1. User at /elderly/pair (ClaimCodeEntry page)
2. Enters pairing code
3. pairDevice() called with code
4. Backend validates code → succeeds
5. Device token saved to localStorage
6. User navigates back to / or refreshes
7. Now device.isPaired = true → ElderlyHome
```

### Expected Result
**✅ After entering code successfully: Shows Elderly Home**

If code is invalid:
**✅ Stays on /elderly/pair or shows error (component handles this)**

---

## Scenario 4: Caregiver Logs In

### Setup
User opens http://localhost:8443/
User clicks "Login as Caregiver"
Caregiver enters email/password
Backend returns JWT token

### State After Login
```javascript
localStorage.access_token = "eyJhbGc..." (JWT)
localStorage.refresh_token = "ref_..."
localStorage.device_token = null
localStorage.PATIENT_DEVICE_READY_KEY = null
```

### DeviceContext State
```typescript
requiresPairing = Boolean(getStoredDeviceToken()) = Boolean(null) = false
isPaired = false
isLoading = true

// After useEffect:
if (!getStoredDeviceToken()) { setIsLoading(false); return; }

Final State:
- device.isLoading = false
- device.requiresPairing = false
- device.isPaired = false
```

### AuthContext State
```typescript
user = { account_type: "caregiver", email: "...", ... }
isAuthenticated = true
isLoading = false
```

### EntryRoute Execution
```typescript
if (device.isLoading) → NO (false)
if (device.isPaired) → NO (false)
if (device.requiresPairing) → NO (false)
if (authLoading) → NO (false)
if (isAuthenticated && user?.account_type === "caregiver") → YES ✅
return <Navigate to="/caregiver/dashboard" replace /> ✅
```

### Expected Result
**✅ Shows Caregiver Dashboard** (`/caregiver/dashboard`)

---

## Scenario 5: Caregiver Logs In on Elderly's Device

### Setup
1. Elderly device had paired device token: `device_token = "dev_abc..."`
2. Caregiver logs in with JWT: `access_token = "jwt_xyz..."`
3. Both exist in localStorage

### State
```javascript
localStorage.access_token = "jwt_xyz..." (caregiver JWT)
localStorage.device_token = "dev_abc..." (old elderly token)
```

### DeviceContext State
```typescript
requiresPairing = Boolean(getStoredDeviceToken()) = Boolean("dev_abc...") = true
isPaired = false
isLoading = true

// After useEffect:
if (!getStoredDeviceToken()) → FALSE (token exists!)
  → Calls getPairedElderProfile()
  
// Backend validates token
// If valid → returns elderly profile, setIsPaired = true
// If invalid → error, disablePatientDevice(), setRequiresPairing = true

Final State (assuming valid):
- device.isLoading = false
- device.requiresPairing = false
- device.isPaired = true
```

### EntryRoute Execution
```typescript
if (device.isLoading) → NO (false)
if (device.isPaired) → YES ✅
return <ElderlyHome /> ✅
```

### Expected Result
**❌ PROBLEM: Shows Elderly Home, not Caregiver Dashboard!**

This is a **real issue** - if a caregiver logs in on an elderly device, they'll see elderly interface.

**Solution:** EntryRoute should check caregiver auth BEFORE device state:

```typescript
function EntryRoute() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const device = useDevice();
  
  // Device loading?
  if (device.isLoading) return <LoadingScreen />;
  
  // Auth loading?
  if (authLoading) return <LoadingScreen />;
  
  // ✅ PRIORITIZE: Caregiver JWT over device token
  if (isAuthenticated && user?.account_type === "caregiver") {
    return <Navigate to="/caregiver/dashboard" replace />;
  }
  
  // Device paired? Route elderly
  if (device.isPaired) return <ElderlyHome />;
  
  // Device needs pairing? Route to code entry
  if (device.requiresPairing) return <Navigate to="/elderly/pair" replace />;
  
  // Fresh user
  return <Welcome />;
}
```

---

## Summary Table

| Scenario | Fresh Device | Paired Device | Needs Pairing | Caregiver Auth | Caregiver on Elderly Device |
|---|---|---|---|---|---|
| localStorage | empty | device_token | empty | access_token | device_token + access_token |
| Expected Route | /welcome | /elderly | /elderly/pair | /caregiver/dashboard | ❌ NEEDS FIX |
| Current Route | ✅ /welcome | ✅ /elderly | ? | ✅ /caregiver/dashboard | ❌ /elderly |

---

## Action Required

**Update EntryRoute priority:**
1. Check device.isLoading
2. Check authLoading
3. **Check caregiver JWT first** (before device state)
4. Check device.isPaired
5. Check device.requiresPairing
6. Show Welcome

This ensures caregiver always sees dashboard, even if device token exists.
