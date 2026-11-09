# Quick Reference: Caregiver-First Auth Design

> Fast lookup guide for developers implementing the new flow.

---

## Route Decision Tree

```
START: App opens (EntryRoute runs)
│
├─ device.isLoading? ──YES──► WAIT (LoadingScreen)
│
└─ device.isLoading? ──NO──► Check next
   │
   ├─ device.isPaired? ──YES──► GO TO /elderly/home ✅
   │
   └─ device.isPaired? ──NO──► Check next
      │
      ├─ device.requiresPairing? ──YES──► GO TO /elderly/pair ✅
      │
      └─ device.requiresPairing? ──NO──► Check next
         │
         ├─ auth.isLoading? ──YES──► WAIT (LoadingScreen)
         │
         └─ auth.isLoading? ──NO──► Check next
            │
            ├─ auth.isAuthenticated && auth.user.account_type === "caregiver"?
            │  ──YES──► GO TO /caregiver/dashboard ✅
            │
            └─ NO ──► GO TO /welcome ✅
```

---

## State Values at Each Route

| Route | device.isPaired | device.requiresPairing | auth.isAuthenticated |
|-------|:---:|:---:|:---:|
| `/elderly/home` | ✅ YES | - | - |
| `/elderly/pair` | ❌ NO | ✅ YES | - |
| `/caregiver/dashboard` | ❌ NO | ❌ NO | ✅ YES |
| `/welcome` | ❌ NO | ❌ NO | ❌ NO |

---

## Component Tree

```
App.tsx
├── EntryRoute() ← REWRITE THIS
│   └── Renders different pages based on device/auth state
│
├── BrowserRouter
│   └── Routes:
│       ├── / ← EntryRoute
│       ├── /signup → Signup.tsx
│       ├── /login → Login.tsx
│       ├── /onboarding → CaregiverOnboarding.tsx ← UPDATE THIS
│       │   ├── CaregiverAccountSetupStep.tsx ← CREATE
│       │   ├── ElderlyProfileCreationStep.tsx ← CREATE
│       │   └── PairingCodeGenerationStep.tsx ← CREATE
│       │
│       ├── /caregiver/dashboard → Dashboard.tsx ← ADD BUTTON
│       ├── /elderly/pair → ClaimCodeEntry.tsx ← NO CHANGE
│       ├── /elderly/home → ElderlyHome.tsx ← NO CHANGE
│       └── ...
│
├── AuthProvider
│   └── useAuth() hook for caregiver JWT
│
└── DeviceProvider
    └── useDevice() hook for device token
```

---

## API Endpoints Needed

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/auth/signup` | POST | Caregiver signup | ✅ Works |
| `/api/caregiver/elderly` | POST | Create elderly profile | ✅ Works |
| `/api/caregiver/elderly` | GET | List elderly profiles | ✅ Works |
| `/api/pairing/issue` | POST | Generate code | ✅ Works |
| `/api/pairing/claim` | POST | Enter code (pair) | ✅ Works |
| `/api/pairing/verify` | GET | Verify token | ✅ Works |

**Request/Response Examples:**

```bash
# 1. Create elderly profile
POST /api/caregiver/elderly
{
  "name": "Ramesh Kumar",
  "age": 75,
  "language": "hi",
  "city": "Mumbai",
  "doctor_name": "Dr. Priya",
  "doctor_phone": "+91-9876543210",
  "medical_conditions": ["diabetes", "hypertension"],
  "emergency_contact": "Rajesh Kumar",
  "emergency_phone": "+91-9988776655"
}
→ Response: { "id": "elder_123", "created_at": "...", ... }

# 2. Generate pairing code
POST /api/pairing/issue
{ "elderly_id": "elder_123" }
→ Response: { "code": "ABCDE-FGHJK", "expires_at": "...", ... }

# 3. Elderly enters code
POST /api/pairing/claim
{
  "code": "ABCDE-FGHJK",
  "device_id": "device_xyz"
}
→ Response: {
    "device_token": "dev_abc123xyz...",
    "elderly_profile": { ... }
  }

# 4. Verify token on return visit
GET /api/pairing/verify
Authorization: Bearer dev_abc123xyz...
→ Response: { "elderly_profile": { ... }, "valid": true }
```

---

## localStorage Keys

```javascript
// Device tokens (elderly devices)
localStorage.getItem('device_token')         // → "dev_abc123xyz..."
localStorage.setItem('device_token', token)

// Caregiver JWT (optional, if caregivers login)
localStorage.getItem('access_token')         // → "jwt_..."
localStorage.setItem('access_token', token)

// Helper function
function getStoredDeviceToken() {
  return localStorage.getItem('device_token');
}

function saveDeviceToken(token) {
  localStorage.setItem('device_token', token);
}

function clearDeviceToken() {
  localStorage.removeItem('device_token');
}
```

---

## Code Examples

### EntryRoute (REWRITE THIS)

**Old (❌ Problematic):**
```typescript
function EntryRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const device = useDevice();
  if (device.isLoading) return <Loading />;
  if (device.requiresPairing) return <Navigate to="/elderly/pair" replace />;
  if (device.isPaired) return <ElderlyHome />;
  if (isLoading) return <Loading />;
  if (isPatientDeviceReady()) return <Navigate to="/elderly/pair" replace />;  // ← REDUNDANT
  if (isAuthenticated && user?.account_type === "caregiver") return <Dashboard />;
  return <Welcome />;
}
```

**New (✅ Clear):**
```typescript
function EntryRoute() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const device = useDevice();
  
  // Step 1: Device context loading?
  if (device.isLoading) return <LoadingScreen message="Connecting SmritiVani…" />;
  
  // Step 2: Device paired? (elderly device with valid token)
  if (device.isPaired) return <ElderlyHome />;
  
  // Step 3: Device needs pairing? (token exists but invalid)
  if (device.requiresPairing) return <Navigate to="/elderly/pair" replace />;
  
  // Step 4: Caregiver auth loading?
  if (authLoading) return <LoadingScreen message="Loading SmritiVani…" />;
  
  // Step 5: Caregiver authenticated?
  if (isAuthenticated && user?.account_type === "caregiver") {
    return <Navigate to="/caregiver/dashboard" replace />;
  }
  
  // Step 6: Fresh user
  return <Welcome />;
}
```

---

### Onboarding Wizard State

```typescript
// Main component state
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
  // Step 1
  display_name: '',
  phone: '',
  // Step 2
  elderly: {
    name: '',
    age: '',
    language: 'en',
    city: '',
    doctor_name: '',
    doctor_phone: '',
    medical_conditions: [],
    emergency_contact: '',
    emergency_phone: '',
  },
  // Step 3
  elderly_id: null,
  pairing_code: null,
});

// Navigation
const handleNextStep = () => setCurrentStep(c => c + 1);
const handlePrevStep = () => setCurrentStep(c => Math.max(1, c - 1));

// Render based on step
const renderStep = () => {
  switch (currentStep) {
    case 1: return <CaregiverAccountSetupStep {...props} />;
    case 2: return <ElderlyProfileCreationStep {...props} />;
    case 3: return <PairingCodeGenerationStep {...props} />;
  }
};
```

---

### Pairing Device (Elderly Side)

```typescript
// ClaimCodeEntry.tsx (NO CHANGES NEEDED)
const handleSubmit = async () => {
  try {
    // User entered code (e.g., "ABCDE-FGHJK")
    await pairDevice(code);  // ← Calls useDevice hook
    
    // pairDevice does:
    // 1. POST /api/pairing/claim { code, device_id }
    // 2. Saves device_token to localStorage
    // 3. Updates DeviceContext: isPaired=true
    
    // Then navigate to home
    navigate("/elderly/home", { replace: true });
  } catch (error) {
    setError(error.message);
  }
};
```

---

### Device Context Verification

```typescript
// DeviceProvider initialization
useEffect(() => {
  let active = true;
  setIsLoading(true);

  const deviceToken = getStoredDeviceToken();
  
  if (!deviceToken) {
    // No token at all
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
        setPaired = true;
        setRequiresPairing = false;
      }
    })
    .catch(() => {
      // Token invalid/expired
      if (active) {
        disablePatientDevice();  // Clear localStorage
        setIsPaired = false;
        setRequiresPairing = true;  // Signal to re-pair
        setElderlyProfile = null;
      }
    })
    .finally(() => {
      if (active) setIsLoading(false);
    });

  return () => { active = false; };
}, []);
```

---

## Testing Checklist

### Routing Tests
```typescript
describe('EntryRoute', () => {
  it('routes to /elderly/home if device paired', () => {
    // device.isPaired = true
    // Render EntryRoute
    // Expect ElderlyHome rendered
  });

  it('routes to /elderly/pair if device requires pairing', () => {
    // device.requiresPairing = true
    // Render EntryRoute
    // Expect navigate to /elderly/pair
  });

  it('routes to /caregiver/dashboard if caregiver auth', () => {
    // auth.isAuthenticated = true, account_type = 'caregiver'
    // device.isPaired = false, device.requiresPairing = false
    // Render EntryRoute
    // Expect navigate to /caregiver/dashboard
  });

  it('routes to /welcome if fresh user', () => {
    // auth.isAuthenticated = false
    // device.isPaired = false, device.requiresPairing = false
    // Render EntryRoute
    // Expect Welcome rendered
  });
});
```

---

## Common Issues & Fixes

### Issue: Elderly stuck on signup page
**Cause:** EntryRoute not routing to `/elderly/pair`  
**Fix:** Check `device.isPaired` and `device.requiresPairing` flags  
**Debug:** `console.log({ isPaired: device.isPaired, requiresPairing: device.requiresPairing })`

### Issue: Device token not persisting
**Cause:** localStorage not saved after pairing  
**Fix:** Verify `saveDevicePairing()` is called in `pairDevice()` callback  
**Debug:** Check `localStorage.getItem('device_token')` in DevTools

### Issue: Return visits show auth screens
**Cause:** Device token verification failing  
**Fix:** Verify backend endpoint `/api/pairing/verify` is working  
**Debug:** Check network tab for 401/404 errors

### Issue: Onboarding wizard doesn't progress
**Cause:** Form validation failing or callback not wired  
**Fix:** Check form validation logic, ensure `onNext()` is called  
**Debug:** Add `console.log()` in form submit handlers

### Issue: Code generation fails
**Cause:** Backend endpoint not available or invalid elderly_id  
**Fix:** Verify `/api/pairing/issue` endpoint, check elderly_id format  
**Debug:** Test endpoint directly with curl/Postman

---

## Files Quick Map

| File | Purpose | Changes |
|------|---------|---------|
| `App.tsx` | Main router | 🔴 **REWRITE** EntryRoute |
| `Onboarding.tsx` | Caregiver wizard | 🟡 **CONVERT** to 3-step |
| `CaregiverAccountSetupStep.tsx` | Step 1 | 🟢 **CREATE** |
| `ElderlyProfileCreationStep.tsx` | Step 2 | 🟢 **CREATE** |
| `PairingCodeGenerationStep.tsx` | Step 3 | 🟢 **CREATE** |
| `GenerateCodeModal.tsx` | Dashboard code gen | 🟢 **CREATE** |
| `Dashboard.tsx` | Caregiver main | 🟡 **ADD** button |
| `Welcome.tsx` | Fresh user | 🟡 **UPDATE** routing |
| `ClaimCodeEntry.tsx` | Elderly entry | ✅ **NO CHANGE** |
| `ElderlyHome.tsx` | Conversation page | ✅ **NO CHANGE** |
| `AuthContext.tsx` | Caregiver JWT | ✅ **NO CHANGE** |
| `DeviceContext.tsx` | Device token | ✅ **NO CHANGE** |

---

## Environment Variables

No new environment variables needed. Existing setup works:

```bash
VITE_API_URL=http://localhost:8020
VITE_AI_MODE=mock  # or hybrid/production
# etc.
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feat/caregiver-first-auth

# Phase 1: Entry route
git add src/App.tsx
git commit -m "refactor: device-token-first routing in EntryRoute"

# Phase 2: Onboarding
git add src/pages/Onboarding.tsx src/pages/onboarding/*.tsx
git commit -m "feat: 3-step caregiver onboarding wizard"

# Phase 3: Dashboard
git add src/pages/caregiver/Dashboard.tsx src/components/GenerateCodeModal.tsx
git commit -m "feat: generate pairing code from dashboard"

# Phase 4: Cleanup
git add src/pages/Welcome.tsx
git commit -m "refactor: update Welcome page routing"

# Push and create PR
git push -u origin feat/caregiver-first-auth
```

---

## Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Fresh device load | < 2s | Optimize DeviceContext useEffect |
| Return visit load | < 500ms | Use localStorage device token |
| Code generation | < 1s | Optimize backend endpoint |
| Onboarding complete time | < 3 minutes | Pre-fill fields, streamline wizard |
| Form submission | < 1s | Debounce, optimize validation |

---

## Browser DevTools Tips

### Check Device State
```javascript
// In DevTools Console:
// (Assuming React DevTools is installed)

// Find component and inspect props
// Or use direct hooks:
const store = useDevice();
console.log({
  isPaired: store.isPaired,
  requiresPairing: store.requiresPairing,
  isLoading: store.isLoading,
  profile: store.elderlyProfile
});

// Check localStorage
localStorage.getItem('device_token');  // Should have value if paired
```

### Simulate Pairing
```javascript
// Simulate device token in localStorage
localStorage.setItem('device_token', 'dev_test123...');

// Refresh page and check routing
location.reload();
```

### Clear Device State
```javascript
// Clear device token
localStorage.removeItem('device_token');

// Refresh page
location.reload();
```

---

## Deployment Checklist

- [ ] All phases implemented
- [ ] Tests passing (build: `npm run build`)
- [ ] No console errors
- [ ] localStorage working in all browsers
- [ ] API endpoints responding
- [ ] Caregiver flow end-to-end tested
- [ ] Elderly flow end-to-end tested
- [ ] Return visits working
- [ ] Expired token re-pairing works
- [ ] Documentation updated
- [ ] Code reviewed and approved
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Monitor metrics post-launch

---

## References

For detailed information, see:
- **Design**: `CAREGIVER_FIRST_AUTH_DESIGN.md`
- **Flows**: `FLOW_DIAGRAMS.md`
- **Implementation**: `IMPLEMENTATION_CHECKLIST.md`
- **Summary**: `DESIGN_SUMMARY.md`
- **This file**: `QUICK_REFERENCE.md`

