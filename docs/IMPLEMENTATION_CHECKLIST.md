# Implementation Checklist: Caregiver-First Auth Flow

## Overview

This checklist guides developers through implementing the caregiver-first authentication and onboarding flow. Follow the phases in order.

---

## PHASE 1: Entry Route Refactor (Core Foundation)

**Goal:** Make device token the primary routing decision. Clear, linear decision tree.

**Estimated Time:** 2-3 hours  
**Risk Level:** 🔴 Critical (affects all routing)  
**Files to Change:** 1 main file

### Task 1.1: Update `src/App.tsx` - Refactor EntryRoute()

**Current Code:**
```typescript
function EntryRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const device = useDevice();
  if (device.isLoading) return <main className="...">Connecting SmritiVani…</main>;
  if (device.requiresPairing) return <Navigate to="/elderly/pair" replace />;
  if (device.isPaired) return <ElderlyHome />;
  if (isLoading) return <main className="...">Loading SmritiVani…</main>;
  if (isPatientDeviceReady()) return <Navigate to="/elderly/pair" replace />;
  if (isAuthenticated && user?.account_type === "caregiver") return <Dashboard />;
  return <Welcome />;
}
```

**Problems to Fix:**
- ❌ `isPatientDeviceReady()` is opaque and redundant
- ❌ Device loading checked first, but auth loading comes later
- ❌ Hard to trace logic

**New Code Structure:**
```typescript
function EntryRoute() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const device = useDevice();
  
  // STEP 1: Device context still loading?
  if (device.isLoading) return <LoadingScreen message="Connecting SmritiVani…" />;
  
  // STEP 2: Device has valid token? Route elderly
  if (device.isPaired) return <ElderlyHome />;
  
  // STEP 3: Device token exists but invalid? Prompt to re-pair
  if (device.requiresPairing) return <Navigate to="/elderly/pair" replace />;
  
  // STEP 4: No device token. Check caregiver auth
  if (authLoading) return <LoadingScreen message="Loading SmritiVani…" />;
  
  // STEP 5: Caregiver authenticated? Show caregiver dashboard
  if (isAuthenticated && user?.account_type === "caregiver") {
    return <Navigate to="/caregiver/dashboard" replace />;
  }
  
  // STEP 6: Fresh user. Show welcome/signup choice
  return <Welcome />;
}
```

**Checklist:**
- [ ] Replace `EntryRoute()` function with new logic
- [ ] Remove `isPatientDeviceReady()` calls
- [ ] Extract LoadingScreen into separate component (if not exists)
- [ ] Add comments explaining each decision step
- [ ] Verify imports: `useAuth`, `useDevice`, `Dashboard`, `ElderlyHome`, `Welcome`, `ClaimCodeEntry`, `Navigate`
- [ ] Test that code compiles

**Testing:**
```typescript
// Test cases to run after implementing:
1. Fresh device → should show /elderly/pair
2. Paired device → should show /elderly/home
3. Paired device + caregiver auth → should show /elderly/home (device priority)
4. Fresh caregiver → should show /welcome
5. Authenticated caregiver (no device) → should show /caregiver/dashboard
```

**Verification:**
- [ ] Run `npm run build` — no errors
- [ ] Run `npm run dev` — app starts
- [ ] Open app in new tab (no localStorage) → Welcome
- [ ] Manual test each scenario above

---

### Task 1.2: Verify/Update `src/context/DeviceContext.tsx`

**Current Implementation:** Already correct. No changes needed.

**Why:**
- `isPaired` flag is already accurate ✅
- `requiresPairing` flag is already used ✅
- localStorage handling is correct ✅
- State initialization is sound ✅

**Checklist:**
- [ ] Review `DeviceProvider` initialization logic
- [ ] Confirm localStorage keys used: `device_token` (or verify actual key names)
- [ ] Confirm `verifyDevicePairing()` sets `isPaired=false` on 401 error
- [ ] Confirm `disablePatientDevice()` clears localStorage correctly
- [ ] Read through useEffect to ensure it matches PHASE 2 logic from design doc
- [ ] No code changes needed — just verify

**Testing:**
- [ ] Add console.log statements to trace state changes (temporary)
- [ ] Verify in browser DevTools that state updates correctly

---

### Task 1.3: Clean Up `src/services/api.ts`

**Check for:**
- [ ] Find `isPatientDeviceReady()` function if it exists
- [ ] If exists, check where it's used (should only be EntryRoute)
- [ ] If removed from EntryRoute, delete the function
- [ ] If not needed elsewhere, delete it

**If function is used elsewhere:**
- Replace all calls with: `getStoredDeviceToken() !== null`
- Delete the function

**Checklist:**
- [ ] Search for `isPatientDeviceReady` usage
- [ ] Delete all references from EntryRoute
- [ ] Delete the function if no longer used
- [ ] Verify no other files call this function
- [ ] Run `npm run build` — no errors

---

### PHASE 1 SUMMARY

**After Phase 1, you should have:**
- ✅ Linear, device-token-first EntryRoute
- ✅ Clear comments explaining each decision
- ✅ Removed ambiguous `isPatientDeviceReady()` call
- ✅ Proper caregiver auth routing
- ✅ All edge cases handled

**Verify:**
- [ ] App compiles and runs
- [ ] Entry routing works for all scenarios
- [ ] No console errors

---

## PHASE 2: Caregiver Onboarding Wizard (Create Elderly Profile)

**Goal:** Allow caregivers to create elderly profiles during signup. 3-step wizard.

**Estimated Time:** 4-6 hours  
**Risk Level:** 🟡 Medium (UX-heavy, backend already supports)  
**Files to Change:** 2-4 files

### Task 2.1: Design Onboarding Component Structure

**Create New Component:** `src/pages/CaregiverOnboarding.tsx` (or rename existing `Onboarding.tsx`)

**Structure:**
```
CaregiverOnboarding.tsx (Main component)
├── useWizardState (custom hook for step management)
├── CaregiverAccountSetupStep.tsx (Step 1)
├── ElderlyProfileCreationStep.tsx (Step 2)
├── PairingCodeGenerationStep.tsx (Step 3)
└── WizardNavigation.tsx (Next/Back buttons)
```

**Checklist:**
- [ ] Create `src/pages/CaregiverOnboarding.tsx`
- [ ] Create `src/pages/onboarding/` subdirectory
- [ ] Create step components (3 files)
- [ ] Create `useWizardState` hook
- [ ] Stub out component structure (no logic yet)

**File Template (CaregiverOnboarding.tsx):**
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CaregiverOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account
    display_name: '',
    phone: '',
    // Step 2: Elderly
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
    // Step 3: Pairing Code
    elderly_id: null,
    pairing_code: null,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = () => setCurrentStep(current => current + 1);
  const handlePrevStep = () => setCurrentStep(current => Math.max(1, current - 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CaregiverAccountSetupStep />;
      case 2:
        return <ElderlyProfileCreationStep />;
      case 3:
        return <PairingCodeGenerationStep />;
      default:
        return null;
    }
  };

  return (
    <div className="wizard-container">
      {renderStep()}
      {/* Navigation */}
    </div>
  );
}
```

---

### Task 2.2: Implement Step 1 - Account Setup

**File:** `src/pages/onboarding/CaregiverAccountSetupStep.tsx`

**Purpose:**
- Display caregiver email (read-only, from auth)
- Allow edit: display_name
- Allow edit: phone (optional)
- Next button

**Implementation:**
```typescript
import { useAuth } from '../../context/AuthContext';

export default function CaregiverAccountSetupStep({
  data,
  onDataChange,
  onNext,
  isLoading,
}: {
  data: FormData;
  onDataChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  isLoading: boolean;
}) {
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.display_name.trim()) {
      // Show error
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="...">
      <h2>Account Setup (Step 1 of 3)</h2>
      <fieldset disabled={isLoading}>
        <label>
          Email
          <input type="email" value={user?.email} readOnly />
        </label>

        <label>
          Display Name *
          <input
            type="text"
            value={data.display_name}
            onChange={(e) => onDataChange({ display_name: e.target.value })}
            required
          />
        </label>

        <label>
          Phone (optional)
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onDataChange({ phone: e.target.value })}
          />
        </label>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Next →'}
        </button>
      </fieldset>
    </form>
  );
}
```

**Checklist:**
- [ ] Create component file
- [ ] Display email from AuthContext (read-only)
- [ ] Add input fields: display_name, phone
- [ ] Add form validation (display_name required)
- [ ] Add Next button
- [ ] Wire up to parent component's onDataChange, onNext callbacks
- [ ] Test rendering

---

### Task 2.3: Implement Step 2 - Elderly Profile Creation

**File:** `src/pages/onboarding/ElderlyProfileCreationStep.tsx`

**Purpose:**
- Form: elderly name, age, language, city, doctor info, medical conditions, emergency contact
- Submit to backend: `POST /api/caregiver/elderly`
- Receive: elderly_id
- Next button

**Implementation:**
```typescript
import { useState } from 'react';
import * as api from '../../services/api';

const MEDICAL_CONDITIONS = [
  'diabetes',
  'hypertension',
  'heart_disease',
  'arthritis',
  'asthma',
  'thyroid',
  'kidney_disease',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  // Add more languages
];

export default function ElderlyProfileCreationStep({
  data,
  onDataChange,
  onNext,
  onBack,
  isLoading,
}: {
  data: FormData;
  onDataChange: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConditionToggle = (condition: string) => {
    const current = data.elderly.medical_conditions || [];
    const updated = current.includes(condition)
      ? current.filter((c) => c !== condition)
      : [...current, condition];
    onDataChange({
      elderly: { ...data.elderly, medical_conditions: updated },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate required fields
      if (
        !data.elderly.name?.trim() ||
        !data.elderly.age ||
        !data.elderly.language
      ) {
        throw new Error('Please fill all required fields.');
      }

      // Call backend to create elderly profile
      const response = await api.post('/api/caregiver/elderly', data.elderly);
      
      // Update parent state with elderly_id
      onDataChange({ elderly_id: response.id });

      // Proceed to next step
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="...">
      <h2>Create Elderly Profile (Step 2 of 3)</h2>

      <fieldset disabled={isLoading || submitting}>
        <label>
          Elderly Name *
          <input
            type="text"
            value={data.elderly.name}
            onChange={(e) =>
              onDataChange({
                elderly: { ...data.elderly, name: e.target.value },
              })
            }
            required
          />
        </label>

        <label>
          Age *
          <input
            type="number"
            min="1"
            max="150"
            value={data.elderly.age}
            onChange={(e) =>
              onDataChange({
                elderly: { ...data.elderly, age: parseInt(e.target.value) },
              })
            }
            required
          />
        </label>

        <label>
          Preferred Language *
          <select
            value={data.elderly.language}
            onChange={(e) =>
              onDataChange({
                elderly: { ...data.elderly, language: e.target.value },
              })
            }
            required
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          City / Town
          <input
            type="text"
            value={data.elderly.city}
            onChange={(e) =>
              onDataChange({ elderly: { ...data.elderly, city: e.target.value } })
            }
          />
        </label>

        <fieldset className="group">
          <legend>Doctor Information</legend>
          <label>
            Doctor Name
            <input
              type="text"
              value={data.elderly.doctor_name}
              onChange={(e) =>
                onDataChange({
                  elderly: { ...data.elderly, doctor_name: e.target.value },
                })
              }
            />
          </label>

          <label>
            Doctor Phone
            <input
              type="tel"
              value={data.elderly.doctor_phone}
              onChange={(e) =>
                onDataChange({
                  elderly: { ...data.elderly, doctor_phone: e.target.value },
                })
              }
            />
          </label>
        </fieldset>

        <fieldset className="group">
          <legend>Medical Conditions (select all that apply)</legend>
          {MEDICAL_CONDITIONS.map((condition) => (
            <label key={condition}>
              <input
                type="checkbox"
                checked={data.elderly.medical_conditions?.includes(condition) || false}
                onChange={() => handleConditionToggle(condition)}
              />
              {condition.replace(/_/g, ' ').toUpperCase()}
            </label>
          ))}
        </fieldset>

        <fieldset className="group">
          <legend>Emergency Contact</legend>
          <label>
            Contact Name
            <input
              type="text"
              value={data.elderly.emergency_contact}
              onChange={(e) =>
                onDataChange({
                  elderly: {
                    ...data.elderly,
                    emergency_contact: e.target.value,
                  },
                })
              }
            />
          </label>

          <label>
            Contact Phone
            <input
              type="tel"
              value={data.elderly.emergency_phone}
              onChange={(e) =>
                onDataChange({
                  elderly: { ...data.elderly, emergency_phone: e.target.value },
                })
              }
            />
          </label>
        </fieldset>

        {error && <p role="alert" className="error">{error}</p>}

        <div className="button-group">
          <button type="button" onClick={onBack} disabled={isLoading || submitting}>
            ← Back
          </button>
          <button type="submit" disabled={isLoading || submitting}>
            {submitting ? 'Creating Profile...' : 'Next →'}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
```

**Checklist:**
- [ ] Create component file
- [ ] Add form fields for all elderly profile data
- [ ] Add medical conditions checkboxes
- [ ] Add form validation (required fields)
- [ ] Implement backend call: `POST /api/caregiver/elderly`
- [ ] Handle errors and display error message
- [ ] On success, save elderly_id to parent state
- [ ] Add Back and Next buttons
- [ ] Test form submission and error handling

**Backend Integration Check:**
- [ ] Verify backend endpoint exists: `POST /api/caregiver/elderly`
- [ ] Verify required fields match: name, age, language
- [ ] Verify response includes `id` (elderly_id)
- [ ] Test backend directly with curl/Postman if needed

---

### Task 2.4: Implement Step 3 - Pairing Code Generation

**File:** `src/pages/onboarding/PairingCodeGenerationStep.tsx`

**Purpose:**
- On mount: Generate pairing code via `POST /api/pairing/issue`
- Display code in large, copyable format
- Show share buttons (copy, QR, SMS, etc.)
- Complete button to finish onboarding

**Implementation:**
```typescript
import { useState, useEffect } from 'react';
import * as api from '../../services/api';

export default function PairingCodeGenerationStep({
  elderly_id,
  elderly_name,
  onComplete,
  isLoading,
}: {
  elderly_id: string;
  elderly_name: string;
  onComplete: () => void;
  isLoading: boolean;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const generateCode = async () => {
      try {
        const response = await api.post('/api/pairing/issue', {
          elderly_id,
        });
        setCode(response.code || response.pairing_code);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to generate code'
        );
      } finally {
        setGenerating(false);
      }
    };

    void generateCode();
  }, [elderly_id]);

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy code');
    }
  };

  const handleShareSMS = () => {
    if (!code) return;
    const message = `SmritiVani Code: ${code}`;
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  const handleShareWhatsApp = () => {
    if (!code) return;
    const message = `SmritiVani Code: ${code}`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  if (generating) {
    return (
      <div className="step-container">
        <p>Generating pairing code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="step-container">
        <p role="alert" className="error">
          {error}
        </p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="step-container">
      <h2>Share Pairing Code (Step 3 of 3)</h2>

      <p>Share this code with {elderly_name}'s device:</p>

      {code && (
        <div className="code-display">
          <div className="code-box">
            <code className="code-text">{code}</code>
          </div>

          <div className="code-actions">
            <button onClick={handleCopyCode} className="btn-copy">
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>

            <button onClick={handleShareSMS} className="btn-share">
              📱 Share via SMS
            </button>

            <button onClick={handleShareWhatsApp} className="btn-share">
              💬 Share via WhatsApp
            </button>
          </div>
        </div>
      )}

      <div className="instructions">
        <h3>Instructions:</h3>
        <ol>
          <li>Ask {elderly_name} to open SmritiVani on their device</li>
          <li>They'll tap "Enter Code"</li>
          <li>They'll type or scan the code above</li>
          <li>Their device connects and they'll see the conversation page!</li>
        </ol>
      </div>

      <button
        onClick={onComplete}
        disabled={isLoading}
        className="btn-complete"
      >
        ✓ Complete Onboarding
      </button>
    </div>
  );
}
```

**Checklist:**
- [ ] Create component file
- [ ] Implement useEffect to generate code on mount
- [ ] Call `POST /api/pairing/issue` with elderly_id
- [ ] Display code in large, readable format
- [ ] Implement copy to clipboard button
- [ ] Implement SMS share button
- [ ] Implement WhatsApp share button (nice-to-have)
- [ ] Show instructions for elderly user
- [ ] Add Complete button
- [ ] Handle loading and error states
- [ ] Test code generation and sharing

**Backend Integration Check:**
- [ ] Verify backend endpoint: `POST /api/pairing/issue`
- [ ] Verify request body: { elderly_id }
- [ ] Verify response includes: code (or pairing_code)
- [ ] Verify code format and TTL (should be 15 min)

---

### Task 2.5: Update Main `CaregiverOnboarding.tsx`

**Now integrate the 3 step components into main onboarding component:**

```typescript
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CaregiverAccountSetupStep from './onboarding/CaregiverAccountSetupStep';
import ElderlyProfileCreationStep from './onboarding/ElderlyProfileCreationStep';
import PairingCodeGenerationStep from './onboarding/PairingCodeGenerationStep';

interface OnboardingFormData {
  display_name: string;
  phone: string;
  elderly: {
    name: string;
    age: number | string;
    language: string;
    city: string;
    doctor_name: string;
    doctor_phone: string;
    medical_conditions: string[];
    emergency_contact: string;
    emergency_phone: string;
  };
  elderly_id: string | null;
}

export default function CaregiverOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    display_name: '',
    phone: '',
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
    elderly_id: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateFormData = useCallback((updates: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  const handleComplete = useCallback(() => {
    navigate('/caregiver/dashboard', { replace: true });
  }, [navigate]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CaregiverAccountSetupStep
            data={formData}
            onDataChange={handleUpdateFormData}
            onNext={handleNextStep}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <ElderlyProfileCreationStep
            data={formData}
            onDataChange={handleUpdateFormData}
            onNext={handleNextStep}
            onBack={handlePrevStep}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <PairingCodeGenerationStep
            elderly_id={formData.elderly_id || ''}
            elderly_name={formData.elderly.name}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      {renderStep()}
    </div>
  );
}
```

**Checklist:**
- [ ] Update `src/pages/Onboarding.tsx` to new multi-step structure
- [ ] Wire up all callbacks
- [ ] Test navigation between steps
- [ ] Test form data persistence across steps
- [ ] Test form submission at each step

---

### Task 2.6: Update `src/App.tsx` - Route to CaregiverOnboarding

**Current Route:**
```typescript
<Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
```

**Check:**
- [ ] Verify route exists
- [ ] Verify component import is correct
- [ ] Verify ProtectedRoute wrapper is applied (only caregivers should see this)
- [ ] Test that `/onboarding` is accessible after caregiver signup
- [ ] Test that non-authenticated users are redirected from `/onboarding`

---

### PHASE 2 SUMMARY

**After Phase 2, you should have:**
- ✅ 3-step onboarding wizard
- ✅ Caregiver can create elderly profile
- ✅ Pairing code generated automatically
- ✅ Code is shareable (copy, SMS, WhatsApp)
- ✅ Seamless redirect to dashboard after completion

**Verify:**
- [ ] Run `npm run build` — no errors
- [ ] Complete full onboarding flow manually
- [ ] Verify elderly profile created in backend
- [ ] Verify pairing code generated
- [ ] Verify code is valid on elderly device
- [ ] Verify redirect to dashboard

---

## PHASE 3: Dashboard "Generate Code" Feature

**Goal:** Allow caregivers to generate codes from dashboard for existing elderly profiles.

**Estimated Time:** 2-3 hours  
**Risk Level:** 🟡 Medium (isolated feature)  
**Files to Change:** 2-3 files

### Task 3.1: Add "Generate Code" Button to Dashboard

**File:** `src/pages/caregiver/Dashboard.tsx`

**Add Button:**
```typescript
<button onClick={handleGenerateCode} className="btn-primary">
  📱 Generate Pairing Code
</button>
```

**Or as Modal Trigger:**
```typescript
const [showCodeModal, setShowCodeModal] = useState(false);

return (
  <>
    <button onClick={() => setShowCodeModal(true)}>
      Generate Code
    </button>
    {showCodeModal && (
      <GenerateCodeModal onClose={() => setShowCodeModal(false)} />
    )}
  </>
);
```

**Checklist:**
- [ ] Locate Dashboard component
- [ ] Add button to UI (appropriate location)
- [ ] Create state for modal/form visibility
- [ ] Wire up click handler

---

### Task 3.2: Create `GenerateCodeModal.tsx`

**File:** `src/components/GenerateCodeModal.tsx`

**Purpose:**
- Fetch list of elderly profiles for caregiver
- Allow selection of which elderly
- Call `POST /api/pairing/issue`
- Display generated code with share options

**Implementation:**
```typescript
import { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function GenerateCodeModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState<'select' | 'display'>('select');
  const [elderlyList, setElderlyList] = useState<Array<any>>([]);
  const [selectedElderly, setSelectedElderly] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchElderlyProfiles = async () => {
      try {
        const response = await api.get('/api/caregiver/elderly');
        setElderlyList(response.elderly || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch elderly profiles'
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchElderlyProfiles();
  }, []);

  const handleGenerateCode = async () => {
    if (!selectedElderly) {
      setError('Please select an elderly profile');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/pairing/issue', {
        elderly_id: selectedElderly,
      });
      setCode(response.code || response.pairing_code);
      setStep('display');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy code');
    }
  };

  const selectedElderlyName =
    elderlyList.find((e) => e.id === selectedElderly)?.name || '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="btn-close">
          ✕
        </button>

        {step === 'select' ? (
          <>
            <h2>Generate Pairing Code</h2>

            {loading && <p>Loading elderly profiles...</p>}

            {!loading && error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}

            {!loading && elderlyList.length === 0 && (
              <p>No elderly profiles found. Create one in the onboarding.</p>
            )}

            {!loading && elderlyList.length > 0 && (
              <>
                <label>
                  Select Elderly Profile:
                  <select
                    value={selectedElderly || ''}
                    onChange={(e) => setSelectedElderly(e.target.value)}
                  >
                    <option value="">-- Choose --</option>
                    {elderlyList.map((elderly) => (
                      <option key={elderly.id} value={elderly.id}>
                        {elderly.name} (Age {elderly.age})
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  onClick={handleGenerateCode}
                  disabled={!selectedElderly || loading}
                  className="btn-primary"
                >
                  {loading ? 'Generating...' : 'Generate Code'}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <h2>Code for {selectedElderlyName}</h2>

            {code && (
              <>
                <div className="code-display">
                  <code>{code}</code>
                </div>

                <button onClick={handleCopyCode} className="btn-secondary">
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </>
            )}

            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Checklist:**
- [ ] Create modal component
- [ ] Fetch elderly profiles list
- [ ] Add selection dropdown
- [ ] Implement code generation
- [ ] Display code with copy button
- [ ] Handle loading and error states
- [ ] Test end-to-end

---

### Task 3.3: Connect Modal to Dashboard

**Update Dashboard.tsx:**
```typescript
import GenerateCodeModal from '../../components/GenerateCodeModal';

export default function Dashboard() {
  const [showCodeModal, setShowCodeModal] = useState(false);

  return (
    <>
      {/* Existing dashboard content */}
      
      <button onClick={() => setShowCodeModal(true)}>
        📱 Generate Pairing Code
      </button>

      {showCodeModal && (
        <GenerateCodeModal onClose={() => setShowCodeModal(false)} />
      )}
    </>
  );
}
```

**Checklist:**
- [ ] Import GenerateCodeModal
- [ ] Add state for modal visibility
- [ ] Add button to trigger modal
- [ ] Test modal opens/closes
- [ ] Test code generation from dashboard

---

### PHASE 3 SUMMARY

**After Phase 3, you should have:**
- ✅ Dashboard button to generate codes
- ✅ Modal to select elderly and generate code
- ✅ Share options from dashboard
- ✅ Re-usable code generation for any elderly

**Verify:**
- [ ] Dashboard button visible and clickable
- [ ] Modal opens and shows elderly list
- [ ] Can select elderly and generate code
- [ ] Code is copyable
- [ ] Generated code works on elderly device

---

## PHASE 4: Welcome Page Update (Optional)

**Goal:** Update Welcome page to reflect new flow options.

**Estimated Time:** 1 hour  
**Risk Level:** 🟢 Low (UX only)

### Task 4.1: Update `src/pages/Welcome.tsx`

**Current:** Shows "I'm a Caregiver" and "I'm an Elderly Person" choices

**New:**
- Keep "I'm a Caregiver" → routes to /signup or /login
- Keep "I'm Using an Elderly Device" → routes to /elderly/pair
- Remove elderly signup/login references

**Checklist:**
- [ ] Review Welcome component
- [ ] Verify routes are correct
- [ ] Update any messaging for clarity
- [ ] Remove elderly signup link if present
- [ ] Test both buttons work

---

## PHASE 5: Testing & Verification

**Goal:** Complete end-to-end testing of all flows.

**Estimated Time:** 2-3 hours

### Checklist: Manual Testing

**Caregiver Signup + Onboarding:**
- [ ] Navigate to `/signup`
- [ ] Fill signup form (email, password, display name)
- [ ] Submit
- [ ] Auto-redirects to `/onboarding`
- [ ] Complete Step 1 (account setup)
- [ ] Complete Step 2 (elderly profile creation)
- [ ] Verify backend creates elderly profile
- [ ] Complete Step 3 (code generation)
- [ ] Verify code is generated and copyable
- [ ] Click "Complete" → redirects to `/caregiver/dashboard`
- [ ] Dashboard visible with elderly profile info

**Caregiver Dashboard - Generate Code:**
- [ ] Login as caregiver
- [ ] See Dashboard
- [ ] Click "Generate Pairing Code" button
- [ ] Modal opens
- [ ] Select elderly profile from dropdown
- [ ] Click "Generate Code"
- [ ] Code displays
- [ ] Copy button works
- [ ] Modal closes

**Elderly Device - Fresh:**
- [ ] Open app in fresh browser/device (no localStorage)
- [ ] Should auto-route to `/elderly/pair`
- [ ] See ClaimCodeEntry screen
- [ ] Enter code from caregiver
- [ ] Submit
- [ ] Device pairs
- [ ] Auto-redirects to `/elderly/home`
- [ ] Conversation page displays
- [ ] localStorage has device_token
- [ ] Mic button works

**Elderly Device - Return Visit:**
- [ ] Close app
- [ ] Reopen app
- [ ] Should route directly to `/elderly/home`
- [ ] NO auth screens
- [ ] NO loading delays (or minimal)
- [ ] Immediate access to conversation page

**Elderly Device - Expired Token:**
- [ ] Manually expire device token (backend or localStorage manipulation)
- [ ] Refresh page
- [ ] Should route to `/elderly/pair`
- [ ] Can re-enter code and pair

**Cross-Device Scenarios:**
- [ ] Caregiver login on Device A (desktop)
- [ ] Route to `/caregiver/dashboard` ✅
- [ ] Generate code on Device A
- [ ] Elderly enters code on Device B (tablet)
- [ ] Device B pairs and routes to `/elderly/home` ✅
- [ ] Caregiver can monitor on Device A ✅

### Checklist: Automated Tests

**EntryRoute Tests:**
- [ ] Test: Fresh device → `/elderly/pair`
- [ ] Test: Paired device → `/elderly/home`
- [ ] Test: No device + caregiver auth → `/caregiver/dashboard`
- [ ] Test: No device + no auth → `/welcome`
- [ ] Test: Loading states handled

**DeviceContext Tests:**
- [ ] Test: Reads localStorage on mount
- [ ] Test: Sets isPaired on valid token
- [ ] Test: Sets requiresPairing on invalid token
- [ ] Test: Clears state on unpair

**API Integration Tests:**
- [ ] Test: `POST /api/auth/signup` creates caregiver
- [ ] Test: `POST /api/caregiver/elderly` creates elderly profile
- [ ] Test: `POST /api/pairing/issue` generates code
- [ ] Test: `POST /api/pairing/claim` pairs device
- [ ] Test: `GET /api/pairing/verify` validates token

### Checklist: Build & Deploy

- [ ] Run `npm run build` — no errors
- [ ] Run `npm run preview` — app loads correctly
- [ ] Check for console errors or warnings
- [ ] Test all routes are accessible
- [ ] Test API endpoints are reachable
- [ ] Verify localStorage works in incognito/private mode

---

## PHASE 6: Cleanup & Documentation

**Goal:** Remove old code, update documentation.

**Estimated Time:** 1-2 hours

### Checklist: Code Cleanup

- [ ] Delete any unused elderly auth pages (if they exist)
- [ ] Delete `isPatientDeviceReady()` function if unused
- [ ] Search codebase for hardcoded elderly signup/login routes
- [ ] Remove any outdated comments or TODOs
- [ ] Update README with new flow diagram
- [ ] Update inline code comments

### Checklist: Documentation

- [ ] Update README.md with new onboarding flow
- [ ] Update API documentation
- [ ] Add troubleshooting guide for common issues
- [ ] Document device pairing token lifecycle
- [ ] Add QA testing checklist

---

## Final Verification Checklist

Before marking complete, verify:

- [ ] **Routing:** All routes correct, no dead links
- [ ] **Auth:** Caregiver auth works, elderly device token works
- [ ] **Onboarding:** 3-step wizard completes, data saved
- [ ] **Device Pairing:** Code generation and entry works
- [ ] **Return Visits:** No auth screens on repeat visits
- [ ] **State Management:** Contexts work correctly
- [ ] **Styling:** UI is clean and responsive
- [ ] **Accessibility:** Forms are labeled, errors are clear
- [ ] **Performance:** No unnecessary re-renders
- [ ] **Error Handling:** Errors are caught and displayed
- [ ] **Edge Cases:** Expired tokens, network errors handled
- [ ] **Testing:** Manual and automated tests pass
- [ ] **Documentation:** Design, flow, and code documented

---

## Success Criteria

✅ **Flow is Complete When:**
1. Caregivers can sign up and create elderly profile in one flow
2. Caregivers can generate pairing codes from dashboard
3. Elderly enters code and immediately sees conversation page
4. Elderly returns to device with zero auth friction
5. All routes are clear and linear
6. No elderly signup/login pages needed
7. DeviceContext and AuthContext work together correctly
8. All tests pass

---

## Rollback Plan (If Needed)

If critical issues arise:
1. Git revert commits from each phase
2. Start with most recent working phase
3. Identify issue before proceeding
4. Consider feature flags for gradual rollout

---

## Post-Launch Monitoring

After launch, monitor:
- [ ] Entry route logic (no unexpected redirects)
- [ ] Device pairing success rate
- [ ] Onboarding completion rate
- [ ] Return visit behavior
- [ ] Error logs for auth/device issues
- [ ] User feedback on UX

