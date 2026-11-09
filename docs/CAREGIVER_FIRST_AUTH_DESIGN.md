# Caregiver-First Authentication & Onboarding Design

## Executive Summary

This document redesigns SmritiVani's authentication and onboarding flow to be **caregiver-centric**, eliminating separate elderly signup/login. Elderly users are now created as profiles by caregivers and access the app immediately via pairing code, with zero friction.

---

## Problem Statement

**Current Flow Issues:**
- ❌ Elderly must sign up separately → Requires email/password (elder-unfriendly)
- ❌ Elderly must login on each device → Confusion and friction
- ❌ Pairing confirmation requires extra step → More screens
- ❌ Caregivers can't create elderly profiles upfront → Fragmented onboarding

**New Approach:**
- ✅ Caregiver creates account + elderly profile **in one onboarding wizard**
- ✅ Caregiver generates pairing code from dashboard
- ✅ Elderly enters code → **Immediately sees conversation page**
- ✅ Device token in localStorage → Skips all auth on return visits
- ✅ No elderly signup, login, or pairing confirmation screens needed

---

## Route & State Flow

### Current Entry Logic (App.tsx)

```typescript
function EntryRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const device = useDevice();
  
  if (device.isLoading) return <Loading />;
  if (device.requiresPairing) return <Navigate to="/elderly/pair" />;
  if (device.isPaired) return <ElderlyHome />;
  if (isLoading) return <Loading />;
  if (isPatientDeviceReady()) return <Navigate to="/elderly/pair" />;
  if (isAuthenticated && user?.account_type === "caregiver") return <Dashboard />;
  return <Welcome />;
}
```

**Problems:**
- `device.requiresPairing` doesn't exist when no device token → Redundant with `isPatientDeviceReady()`
- `isPatientDeviceReady()` is opaque and counterintuitive
- Flow mixes device token logic with caregiver JWT logic
- No clear distinction: "new device" vs "unpaired device"

### NEW Entry Logic (Device-Token-First)

**Principle:** Route based on **device token presence** first, then caregiver JWT.

```typescript
function EntryRoute() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const device = useDevice();
  
  // Step 1: Device context still loading? Hold
  if (device.isLoading) return <LoadingScreen />;
  
  // Step 2: Device has token? It's an elderly device
  if (device.isPaired) return <ElderlyHome />;
  
  // Step 3: Device token doesn't exist but exists in localStorage?
  // (Shouldn't happen in normal flow, but handle stale state)
  if (device.requiresPairing) return <ClaimCodeEntry />;
  
  // Step 4: No device token at all. Check caregiver auth
  if (authLoading) return <LoadingScreen />;
  
  // Step 5: Caregiver authenticated? Caregiver dashboard
  if (isAuthenticated && user?.account_type === "caregiver") 
    return <Navigate to="/caregiver/dashboard" replace />;
  
  // Step 6: Nothing authenticated. Fresh user
  return <Welcome />;
}
```

**Flow Decision Table:**

| Scenario | Device Token | Device Paired | Caregiver Auth | Route | Action |
|----------|:---:|:---:|:---:|---|---|
| 1. Fresh elderly device | ❌ | ❌ | ❌ | `/elderly/pair` | Show claim code entry |
| 2. Elderly device, paired | ✅ | ✅ | N/A | `/elderly/home` | Show conversation page |
| 3. Elderly, unpaired token stale | ✅ | ❌ | N/A | `/elderly/pair` | Ask to re-pair |
| 4. Fresh caregiver | ❌ | ❌ | ❌ | `/welcome` | Show welcome screen |
| 5. Caregiver returning | ❌ | ❌ | ✅ | `/caregiver/dashboard` | Show dashboard |
| 6. Caregiver + device (shouldn't happen) | ✅ | ✅ | ✅ | `/elderly/home` | Prioritize device (they lent phone) |

---

## Context Providers

### AuthContext (Caregiver Only)

**No changes needed.** Remains JWT-based for caregiver authentication.

```typescript
type AuthContextValue = {
  user: CaregiverUser | null;              // email, display_name, account_type='caregiver'
  token: string | null;                     // JWT
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials) => Promise<CaregiverUser>;
  signup: (data) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data) => Promise<CaregiverUser>;
};
```

---

### DeviceContext (Elderly Device Token)

**No changes needed.** Already handles device tokens correctly.

```typescript
type DeviceContextValue = {
  isPaired: boolean;                        // device_token valid & profile loaded
  requiresPairing: boolean;                 // device_token in localStorage but invalid
  isLoading: boolean;
  elderlyProfile: ElderlyProfile | null;    // name, age, language, doctor, etc.
  pairDevice: (code: string) => Promise<void>;
  unpairDevice: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};
```

**Storage:**
- `localStorage.getItem('device_token')` → raw token string
- `localStorage.getItem('device_token_hash')` → hash (for backend comparison)

---

## New Component Structure

### Pages to REMOVE

- ❌ `pages/elderly/ElderlySignup.tsx` (didn't exist, but would have)
- ❌ `pages/elderly/ElderlyLogin.tsx` (didn't exist, but would have)
- ❌ `pages/elderly/PairingConfirmation.tsx` (didn't exist, but would have)

### Pages to KEEP/MODIFY

| Page | Current | New | Reason |
|------|---------|-----|--------|
| `Welcome.tsx` | Shows caregiver/elderly choice | Only show caregiver paths | Elderly route via code only |
| `Signup.tsx` | Caregiver signup form | Add "Create Elderly Profile" wizard step | Unified onboarding |
| `Login.tsx` | Caregiver login | No change | Same |
| `ClaimCodeEntry.tsx` | Enter code to pair | Move to `/elderly` (entry point) | Make it the elderly entry route |
| `ElderlyHome.tsx` | Conversation page | No change | Already correct |
| `Onboarding.tsx` | Caregiver post-signup | **Rename to CaregiverOnboarding** | Create multi-step wizard |
| `Dashboard.tsx` | Caregiver dashboard | Add "Generate Code" button | Already mostly correct |

### NEW: Caregiver Onboarding Wizard

**Route:** `/onboarding` (POST-signup)

**Steps:**
1. **Step 1: Account Setup** (Pre-filled from signup)
   - Email (read-only)
   - Display Name (editable)
   - Phone (optional)
   - Next → Step 2

2. **Step 2: Elderly Profile Creation** ← **NEW**
   - Name
   - Age
   - Language (dropdown)
   - City
   - Doctor Name
   - Doctor Phone
   - Medical Conditions (multi-select)
   - Emergency Contact
   - Emergency Phone
   - Next → Step 3

3. **Step 3: Generate Pairing Code** ← **NEW**
   - Show generated code in large, copyable format
   - QR code (optional, nice-to-have)
   - "Share with Elderly Device" button
   - "Copy Code" button
   - "SMS to Device" button (nice-to-have)
   - Complete → Redirect to `/caregiver/dashboard`

**Backend:** Already supports `POST /api/caregiver/elderly` to create profile.

---

## Device Pairing Flow (Detailed)

### Elderly Device Entry Point

```
Fresh Device
    ↓
EntryRoute checks: device.isPaired? → false
EntryRoute checks: device.requiresPairing? → false
EntryRoute checks: caregiver auth? → false
    ↓
Redirect to ClaimCodeEntry (/elderly/pair)
    ↓
Elderly sees: "Code daalein" (Enter code)
    ↓
Elderly enters 6-digit code
    ↓
Frontend: pairDevice(code)
    ├─ POST /api/pairing/claim { code, device_token? }
    ├─ Backend returns: { device_token, elderly_profile, ... }
    └─ Frontend saves: localStorage.device_token
    ↓
Frontend: Navigate to /elderly/home
    ↓
useDevice() hook refreshes → isPaired = true
    ↓
ElderlyHome renders: Conversation page, mic button
```

### Subsequent Visits (Same Device)

```
Device with localStorage.device_token
    ↓
EntryRoute checks: device.isLoading? (DeviceContext initializing)
    ├─ useEffect in DeviceContext reads localStorage.device_token
    ├─ Calls GET /api/pairing/verify { token }
    ├─ Backend validates token, returns elderly_profile
    └─ Sets isPaired = true
    ↓
EntryRoute checks: device.isPaired? → true
    ↓
Redirect to ElderlyHome (/elderly/home)
    ↓
Immediate render: Conversation page
    ↓
✅ Zero auth screens
```

### If Device Token Expires

```
localStorage.device_token exists but invalid
    ↓
useDevice() hook detects: verifyDevicePairing() fails
    ├─ Catches 401 or 404 error
    └─ Sets requiresPairing = true, isPaired = false
    ↓
EntryRoute checks: device.requiresPairing? → true
    ↓
Redirect to ClaimCodeEntry (/elderly/pair)
    ↓
Elderly enters new code
    ↓
✅ Re-pairing flow works
```

---

## State Decision Logic

### DeviceContext Initialization (useEffect)

```typescript
useEffect(() => {
  let active = true;
  setIsLoading(true);

  const deviceToken = getStoredDeviceToken();
  
  if (!deviceToken) {
    // No device token at all
    setIsPaired(false);
    setRequiresPairing(false);
    setIsLoading(false);
    return;
  }

  // Token exists, verify it
  verifyDevicePairing()
    .then((result) => {
      if (active) {
        setElderlyProfile(result.elderly_profile);
        setIsPaired(true);
        setRequiresPairing(false);
      }
    })
    .catch(() => {
      // Token invalid/expired
      if (active) {
        disablePatientDevice();
        setIsPaired(false);
        setRequiresPairing(true);
        setElderlyProfile(null);
      }
    })
    .finally(() => {
      if (active) setIsLoading(false);
    });

  return () => { active = false; };
}, []);
```

---

## Caregiver Dashboard Changes

### New Button: "Generate Pairing Code"

**Location:** Dashboard top-right or main action area

**Flow:**
```
Click "Generate Code"
    ↓
Modal: "Create New Elderly Profile or Use Existing?"
    ├─ Option A: "New Profile" → Onboarding wizard
    └─ Option B: "Existing Profile" → Dropdown list
    ↓
Backend: POST /api/pairing/issue { elderly_id }
    ├─ Generates 6-digit code
    ├─ Stores in pairing_codes table
    ├─ TTL: 15 minutes
    └─ Returns code
    ↓
Frontend: Show code in modal
    ├─ Large, monospace display
    ├─ Copy button → clipboard
    ├─ QR code (optional)
    └─ "Share" dropdown (SMS, Email, WhatsApp)
    ↓
✅ Code ready to share with elderly
```

---

## Implementation Sequence

### Phase 1: Entry Route Refactor (Foundation)

**Goal:** Make device token the primary routing decision.

**Files to Change:**
1. `src/App.tsx` → Update `EntryRoute()` logic
2. `src/context/DeviceContext.tsx` → Verify state flags are clear
3. Delete `src/services/api.ts::isPatientDeviceReady()` if it exists (replace with `getStoredDeviceToken()`)

**Changes:**
- EntryRoute checks `device.isPaired` before `device.requiresPairing`
- Removes `isPatientDeviceReady()` call
- Routes based on decision table above

**Testing:**
- Fresh device → `/elderly/pair`
- Device with valid token → `/elderly/home`
- Device with stale token → `/elderly/pair`
- Caregiver logged in → `/caregiver/dashboard`
- Fresh user → `/Welcome`

---

### Phase 2: Caregiver Onboarding Wizard (Create Elderly Profile)

**Goal:** Allow caregivers to create elderly profiles during signup.

**Files to Change:**
1. `src/pages/Onboarding.tsx` → Rename to `CaregiverOnboarding.tsx`, add multi-step wizard
2. `src/App.tsx` → Update route import/reference
3. `src/pages/Signup.tsx` → Redirect to `/onboarding` on successful signup (already does this)

**New Component Structure:**
```
CaregiverOnboarding.tsx
├─ Step 1: Account Setup (display name, phone)
│  └─ Form component: CaregiverAccountForm.tsx
├─ Step 2: Elderly Profile (name, age, language, doctor, conditions)
│  └─ Form component: ElderlyProfileForm.tsx
├─ Step 3: Generate Code
│  └─ Component: CodeGenerationStep.tsx
└─ Wizard state manager: useState for currentStep, formData
```

**Changes:**
- Split onboarding into 3 steps
- Step 2 calls `POST /api/caregiver/elderly` to create profile
- Step 3 calls `POST /api/pairing/issue` to generate code
- Final redirect to `/caregiver/dashboard`

**Testing:**
- Complete full 3-step wizard
- Verify elderly profile created in backend
- Verify code generated
- Verify caregiver sees dashboard after completion

---

### Phase 3: ClaimCodeEntry as Elderly Entry Point

**Goal:** Make code entry the default entry point for elderly devices.

**Files to Change:**
1. `src/pages/elderly/ClaimCodeEntry.tsx` → Already exists, no major changes
2. `src/App.tsx` → Route `/elderly/pair` → `ClaimCodeEntry` (already correct)

**Current State:**
- ✅ Already exists at `/elderly/pair`
- ✅ Already calls `pairDevice(code)`
- ✅ Already navigates to `/elderly/home` on success

**No changes needed** — This component is already correct for the new flow.

---

### Phase 4: Dashboard "Generate Code" Feature

**Goal:** Allow caregivers to generate codes from dashboard.

**Files to Change:**
1. `src/pages/caregiver/Dashboard.tsx` → Add "Generate Code" button
2. Create new component: `src/components/GenerateCodeModal.tsx` (if needed)
3. Update API integration to call `POST /api/pairing/issue`

**Changes:**
- Add button to dashboard (or modal trigger)
- Allow selection of elderly profile
- Call backend to generate code
- Display code in large, copyable format
- Show share options (copy, QR, SMS, etc.)

**Testing:**
- Click "Generate Code" button
- Select elderly profile
- Code generates successfully
- Code is copyable
- Share options work

---

### Phase 5: Remove Elderly Auth Pages (Cleanup)

**Goal:** Remove any elderly signup/login pages if they exist.

**Files to Delete (if exist):**
- `src/pages/elderly/ElderlySignup.tsx`
- `src/pages/elderly/ElderlyLogin.tsx`
- `src/pages/elderly/PairingConfirmation.tsx`

**Routes to Remove (App.tsx):**
- `/elderly/register` (elderly signup)
- `/elderly/login` (elderly login)
- `/elderly/confirm-pairing` (pairing confirmation)

**Testing:**
- Verify these routes redirect or return 404
- Verify no broken links reference these pages

---

## Files to Modify (Detailed Checklist)

### High Priority (Core Flow)

| File | Changes | Impact |
|------|---------|--------|
| `src/App.tsx` | Rewrite `EntryRoute()` function | 🔴 Critical |
| `src/pages/Onboarding.tsx` | Convert to 3-step wizard with elderly profile creation | 🔴 Critical |
| `src/context/DeviceContext.tsx` | Verify state flags (no code changes likely needed) | 🟡 Medium |
| `src/pages/caregiver/Dashboard.tsx` | Add "Generate Code" button & modal | 🟡 Medium |

### Medium Priority (UX Polish)

| File | Changes | Impact |
|------|---------|--------|
| `src/pages/Welcome.tsx` | Update to only show caregiver paths | 🟡 Medium |
| `src/pages/elderly/ClaimCodeEntry.tsx` | Minor UX tweaks if needed | 🟢 Low |
| `src/pages/caregiver/Settings.tsx` | Add option to manage elderly profiles | 🟢 Low |

### Low Priority (Cleanup)

| File | Changes | Impact |
|------|---------|--------|
| `src/services/api.ts` | Remove `isPatientDeviceReady()` if unused | 🟢 Low |
| Route cleanup | Delete elderly signup/login routes if they exist | 🟢 Low |

---

## Data Flow Diagrams

### Current Architecture (Problematic)

```
┌─────────────────────────────────────────────────────────┐
│ App Entry                                               │
│                                                         │
│  ┌──────────────────┐                                  │
│  │ Check Auth JWT   │                                  │
│  │ (Caregiver)      │                                  │
│  └────────┬─────────┘                                  │
│           │                                            │
│    ┌──────▼────────┐                                  │
│    │ Not Auth?     │──Yes──► Welcome (Choice Page)    │
│    │ Go to /login  │                                  │
│    └──────┬────────┘                                  │
│           │ No                                        │
│    ┌──────▼──────────────┐                            │
│    │ Caregiver Dashboard │                            │
│    └─────────────────────┘                            │
│                                                        │
│  ┌──────────────────────┐                            │
│  │ Check Device Token   │                            │
│  │ (Elderly)            │                            │
│  └────────┬─────────────┘                            │
│           │                                          │
│    ┌──────▼────────┐                                │
│    │ No Token?     │──Yes──► ClaimCodeEntry        │
│    │              │         (Code Entry Page)       │
│    └──────┬────────┘                                │
│           │ No                                      │
│    ┌──────▼──────────────┐                          │
│    │ ElderlyHome        │                           │
│    │ (Conversation)     │                           │
│    └────────────────────┘                           │
│                                                     │
│ ❌ PROBLEM: Mixing two separate concerns            │
│    JWT (caregiver) and Device Token (elderly)       │
│    Route logic is hard to follow & test             │
└─────────────────────────────────────────────────────┘
```

### New Architecture (Device-Token-First)

```
┌─────────────────────────────────────────────────────────┐
│ App Entry: EntryRoute()                                 │
│                                                         │
│ Step 1: Check Device Context Loading                   │
│  ┌──────────────────────────────────┐                 │
│  │ device.isLoading? (Read localStorage) │            │
│  └────────┬───────────────────────────┘              │
│           │ Yes                                       │
│           └──► LoadingScreen (Hold)                   │
│           │ No                                        │
│           ▼                                           │
│  ┌──────────────────────────────────┐                │
│  │ device.isPaired?                 │                │
│  │ (token valid + profile loaded)   │                │
│  └────────┬───────────────────────────┘              │
│           │ Yes                                      │
│           └──► ElderlyHome (Conversation Page) ✅    │
│           │ No                                       │
│           ▼                                          │
│  ┌──────────────────────────────────┐               │
│  │ device.requiresPairing?          │               │
│  │ (token exists but invalid)       │               │
│  └────────┬───────────────────────────┘             │
│           │ Yes                                     │
│           └──► ClaimCodeEntry (Code Entry) ✅      │
│           │ No (No device token at all)             │
│           ▼                                         │
│ Step 2: Check Caregiver Auth (Only if no device)   │
│  ┌──────────────────────────────────┐              │
│  │ auth.isLoading?                  │              │
│  └────────┬───────────────────────────┘            │
│           │ Yes                                    │
│           └──► LoadingScreen (Hold)                │
│           │ No                                     │
│           ▼                                        │
│  ┌──────────────────────────────────┐             │
│  │ auth.isAuthenticated &&          │             │
│  │ user.account_type === "caregiver"│             │
│  └────────┬───────────────────────────┘           │
│           │ Yes                                   │
│           └──► CaregiverDashboard ✅             │
│           │ No                                    │
│           ▼                                       │
│ Step 3: Fresh User                               │
│  └──► Welcome (Choice/Sign Up) ✅                │
│                                                  │
│ ✅ BENEFITS:                                     │
│    • Clear, linear decision tree                 │
│    • Device token is PRIMARY routing decision    │
│    • Elderly & caregiver concerns are separated  │
│    • Easy to test each branch                    │
│    • No ambiguous state combinations             │
└─────────────────────────────────────────────────┘
```

---

## Onboarding Wizard Flow (Visual)

```
Fresh Caregiver Registration
    │
    ├─► Click "Sign Up"
    ├─► Fill email, password, display name
    ├─► Submit signup form
    └─► Redirect to /onboarding
        │
        ├─► STEP 1: Account Setup
        │   ├─ Display email (read-only)
        │   ├─ Edit display name
        │   ├─ Optional phone number
        │   └─ Next button
        │   │
        │   └─► STEP 2: Elderly Profile Creation ← NEW
        │       ├─ Elderly name *
        │       ├─ Age *
        │       ├─ Language dropdown *
        │       ├─ City
        │       ├─ Doctor name
        │       ├─ Doctor phone
        │       ├─ Medical conditions (multi-select)
        │       ├─ Emergency contact
        │       ├─ Emergency phone
        │       ├─ Submit to backend: POST /api/caregiver/elderly
        │       └─ Next button
        │       │
        │       └─► STEP 3: Generate Pairing Code ← NEW
        │           ├─ Display generated code (6 digits)
        │           ├─ Large, monospace, copyable
        │           ├─ QR code (nice-to-have)
        │           ├─ "Copy Code" button
        │           ├─ "Share via SMS" button
        │           ├─ "Share via Email" button
        │           └─ "Complete" button
        │           │
        │           └─► Redirect to /caregiver/dashboard
        │               │
        │               └─► Caregiver sees dashboard
        │                   │
        │                   └─► Shares code with elderly device
        │                       │
        │                       └─► Elderly enters code
        │                           │
        │                           └─► Device pairs
        │                               │
        │                               └─► ElderlyHome
        │                                   (Conversation Page)
        │
        └─► ✅ COMPLETE FLOW
```

---

## State Decision Table (Extended)

### All Possible Combinations

| device.isPaired | device.requiresPairing | device.isLoading | auth.isAuthenticated | Route | Rationale |
|:---:|:---:|:---:|:---:|---|---|
| - | - | ✅ | - | LoadingScreen | Device context still loading localStorage |
| ✅ | ❌ | ❌ | - | `/elderly/home` | Elderly device with valid token |
| ❌ | ✅ | ❌ | - | `/elderly/pair` | Device token exists but invalid |
| ❌ | ❌ | ❌ | ✅ | `/caregiver/dashboard` | Caregiver authenticated |
| ❌ | ❌ | ❌ | ❌ | `/welcome` | Fresh user, no auth |
| ✅ | ❌ | ❌ | ✅ | `/elderly/home` | Prioritize device (shouldn't happen, but handle it) |
| ❌ | ✅ | ❌ | ✅ | `/elderly/pair` | Caregiver's phone, but token invalid (share scenario) |

---

## Backend Integration (No Changes Needed)

The backend **already supports** this flow:

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/auth/signup` | POST | Caregiver signup | ✅ Works |
| `/api/auth/login` | POST | Caregiver login | ✅ Works |
| `/api/caregiver/elderly` | POST | Create elderly profile | ✅ Works |
| `/api/pairing/issue` | POST | Generate pairing code | ✅ Works |
| `/api/pairing/claim` | POST | Elderly enters code | ✅ Works |
| `/api/pairing/verify` | POST | Verify device token | ✅ Works |

**No backend changes required** — Frontend routing changes only.

---

## Testing Strategy

### Unit Tests (Context Providers)

```typescript
describe('EntryRoute Decision Logic', () => {
  it('routes to ElderlyHome if device is paired', () => { ... });
  it('routes to ClaimCodeEntry if device requires pairing', () => { ... });
  it('routes to CaregiverDashboard if caregiver is authenticated', () => { ... });
  it('routes to Welcome if no auth and no device', () => { ... });
  it('holds on LoadingScreen while device context loads', () => { ... });
  it('prioritizes device over caregiver auth (edge case)', () => { ... });
});

describe('DeviceContext Initialization', () => {
  it('reads device token from localStorage on mount', () => { ... });
  it('sets isPaired=true if token is valid', () => { ... });
  it('sets requiresPairing=true if token is invalid', () => { ... });
  it('sets isPaired=false if no token exists', () => { ... });
});
```

### Integration Tests (Full Flow)

```typescript
describe('Full Caregiver + Elderly Flow', () => {
  it('allows caregiver to signup and complete onboarding', () => {
    // 1. Sign up
    // 2. Complete 3-step wizard
    // 3. Verify dashboard shows
    // 4. Verify elderly profile created
    // 5. Verify code generated
  });

  it('allows elderly to enter code on fresh device', () => {
    // 1. Open app on fresh device (no localStorage)
    // 2. Should route to /elderly/pair
    // 3. Enter code from caregiver
    // 4. Should route to /elderly/home
    // 5. Should save device token to localStorage
  });

  it('allows elderly to return to app on same device', () => {
    // 1. Close app
    // 2. Reopen app
    // 3. Should load device token from localStorage
    // 4. Should verify token with backend
    // 5. Should route directly to /elderly/home (no auth screens)
  });

  it('handles expired device token', () => {
    // 1. Device token exists but is expired
    // 2. Backend returns 401
    // 3. DeviceContext should set requiresPairing=true
    // 4. EntryRoute should route to /elderly/pair
    // 5. Elderly enters new code
  });
});
```

### Manual Testing (User Experience)

1. **Caregiver Signup → Onboarding Wizard**
   - [ ] Complete step 1 (account setup)
   - [ ] Complete step 2 (create elderly profile)
   - [ ] Verify elderly profile created in backend
   - [ ] Complete step 3 (generate code)
   - [ ] Verify code displayed and copyable
   - [ ] Verify redirected to dashboard

2. **Elderly Device — Fresh**
   - [ ] Open app on fresh device
   - [ ] Should route to `/elderly/pair` automatically
   - [ ] Enter code from caregiver
   - [ ] Should route to `/elderly/home`
   - [ ] Should see conversation page
   - [ ] Device token should be in localStorage

3. **Elderly Device — Return Visit**
   - [ ] Close app
   - [ ] Reopen app
   - [ ] Should route directly to `/elderly/home` (no auth screens)
   - [ ] Should not show loading screens or auth pages

4. **Elderly Device — Token Expired**
   - [ ] Manually expire device token (backend or localStorage manipulation)
   - [ ] Refresh page
   - [ ] Should route to `/elderly/pair`
   - [ ] Enter new code
   - [ ] Should pair successfully

5. **Caregiver Dashboard — Generate Code**
   - [ ] Click "Generate Code" button
   - [ ] Select elderly profile
   - [ ] Code should generate
   - [ ] Code should be displayable and copyable
   - [ ] Should be shareable (copy/SMS/etc.)

---

## Success Criteria

✅ **Elderly Flow:**
- Elderly lands on ClaimCodeEntry automatically (no signup/login)
- Elderly enters code and immediately sees conversation page
- On return visits, elderly skips all auth screens
- Elderly can unpair device and re-pair with new code

✅ **Caregiver Flow:**
- Caregiver completes signup + creates elderly profile in one wizard
- Caregiver generates codes from dashboard
- Caregiver can manage multiple elderly profiles
- Caregiver dashboard shows real-time status

✅ **Routing:**
- EntryRoute is clear, testable, linear
- Device token is primary routing decision
- No ambiguous state combinations
- All edge cases handled

✅ **UX:**
- Zero friction for elderly (code → conversation in 10 seconds)
- Seamless return visits (localStorage handles auth)
- Clear labeling and messaging
- Accessible, readable interfaces

---

## Migration Notes

### For Existing Users

If the app already has elderly users who signed up separately:

1. **Backward Compatibility:** The new flow doesn't break existing auth.
   - Existing JWT tokens still work
   - Existing device tokens still work
   - No data migration needed

2. **Optional Migration:**
   - Existing elderly users can opt-in to device-token-only flow
   - OR keep JWT tokens for backward compatibility
   - OR provide migration path in settings

### For Fresh Deployment

Deploy this flow as-is. No data migration required.

---

## Summary: What Changes

| Component | Current | New | Impact |
|-----------|---------|-----|--------|
| **EntryRoute** | Mixed JWT + device logic | Device-token-first | 🔴 Critical refactor |
| **AuthContext** | No change | No change | ✅ None |
| **DeviceContext** | No change | Verify state flags | ✅ Minimal |
| **Onboarding** | Single step | 3-step wizard | 🟡 Major feature |
| **Dashboard** | No code generation | Add code gen button | 🟡 New feature |
| **Elderly Signup** | Exists | **Removed** | 🔴 Delete pages |
| **Elderly Login** | Doesn't exist | Doesn't exist | ✅ None |
| **ClaimCodeEntry** | Entry point | Entry point | ✅ None |

---

## Next Steps

1. **Review this design** with team
2. **Implement Phase 1** (EntryRoute refactor)
3. **Test Phase 1** (routing logic)
4. **Implement Phase 2** (onboarding wizard)
5. **Test full flow** (caregiver + elderly)
6. **Deploy & monitor**

