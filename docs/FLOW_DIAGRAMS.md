# SmritiVani Auth & Onboarding Flow Diagrams

## 1. Current vs New Architecture Comparison

### CURRENT FLOW (Problematic)

```
                            ┌─────────────────────────┐
                            │    User Opens App       │
                            └────────────┬────────────┘
                                         │
                     ┌───────────────────┼───────────────────┐
                     │                   │                   │
                     ▼                   ▼                   ▼
            ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
            │ Check Device │     │ Check Device │    │  Old JWT?    │
            │ (Loading)    │     │ Token Exist? │    │              │
            └──────┬───────┘     └──────┬───────┘    └──────┬───────┘
                   │                    │                   │
         ┌─────────▼─────────┐         │          ┌────────▼────────┐
         │ Still Loading?    │         │          │ Caregiver JWT? │
         └─────┬───────┬─────┘         │          └────────┬────────┘
               │       │                │                  │
              YES      NO              NO                 YES
               │       │                │                  │
               ▼       ▼                ▼                  ▼
            Wait...  Check JWT    Check Old       Show Caregiver
                     (Redundant)  Patient Ready   Dashboard
                                  (Opaque)
                                     │
                          ┌──────────┼──────────┐
                          │          │          │
                         YES        NO        ???
                          │          │
                          ▼          ▼
                     Show Elderly  Show Welcome
                     Pair Page     (Choice)
                     (Code Entry)

❌ PROBLEMS:
   • Confusing decision tree
   • Redundant checks (device token checked twice)
   • isPatientDeviceReady() is opaque
   • Hard to test
   • Easy to introduce routing bugs
```

### NEW FLOW (Device-Token-First)

```
                       ┌──────────────────────────┐
                       │   User Opens App         │
                       │   EntryRoute() called    │
                       └────────────┬─────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  STEP 1: Device Loading?       │
                    │  device.isLoading === true?    │
                    └───────────────┬────────────────┘
                                    │
                         ┌──────────┬──────────┐
                        YES        │         NO
                         │         │          │
                         ▼         │          ▼
                    LoadingScreen  │    ┌──────────────────┐
                                   │    │ STEP 2: Paired?  │
                                   │    │isPaired === true │
                                   │    └────────┬─────────┘
                                   │             │
                                   │        ┌────┴────┐
                                   │       YES        NO
                                   │        │         │
                                   │        ▼         ▼
                                   │   ElderlyHome  ┌──────────────────────┐
                                   │   (Elderly)    │STEP 3: Pairing Failed?│
                                   │                │requiresPairing===true?│
                                   │                └────────┬──────────────┘
                                   │                         │
                                   │                    ┌────┴────┐
                                   │                   YES        NO
                                   │                    │         │
                                   │                    ▼         ▼
                                   │              ClaimCodeEntry ┌────────────────────┐
                                   │              (Elderly)      │STEP 4: Caregiver   │
                                   │                             │Loading?            │
                                   │                             │auth.isLoading===true
                                   │                             └────────┬───────────┘
                                   │                                      │
                                   │                          ┌───────────┴───────────┐
                                   │                         YES                     NO
                                   │                          │                       │
                                   │                          ▼                       ▼
                                   │                     LoadingScreen         ┌─────────────────┐
                                   │                                          │Caregiver Auth?  │
                                   │                                          │isAuthenticated? │
                                   │                                          └─────┬───────────┘
                                   │                                                │
                                   │                                    ┌───────────┴───────────┐
                                   │                                   YES                     NO
                                   │                                    │                       │
                                   │                                    ▼                       ▼
                                   └────────────────────────────── CaregiverDashboard      Welcome

✅ BENEFITS:
   • Linear, top-to-bottom decision tree
   • Device token is PRIMARY routing
   • No redundant checks
   • Easy to trace & debug
   • Clear separation of concerns
   • All states explicitly handled
```

---

## 2. Device Pairing Lifecycle

### Fresh Device → Paired → Return Visit → Unpair → Pair

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        DEVICE PAIRING LIFECYCLE                                │
└────────────────────────────────────────────────────────────────────────────────┘

PHASE 1: FRESH DEVICE
─────────────────────────────────────────────────────────────────────────────────

Device State:
  localStorage.device_token     → ∅ (empty)
  device.isPaired               → false
  device.requiresPairing        → false

App Load:
  1. DeviceProvider useEffect runs
  2. getStoredDeviceToken() → null
  3. Sets isPaired=false, requiresPairing=false, isLoading=false

Entry Route:
  device.isPaired? → NO
  device.requiresPairing? → NO
  → Check caregiver auth (assume not logged in)
  → Route to /welcome

User Action (Elderly):
  1. Clicks "Enter Code" on Welcome
  2. Manually navigates to /elderly/pair
  3. OR app routes to /elderly/pair after clicking "Connect Device"
  4. EntryRoute checks and routes: device not paired → /elderly/pair

ClaimCodeEntry Screen:
  ┌────────────────────────────┐
  │ Enter Code You Received    │
  ├────────────────────────────┤
  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
  │ │  │ │  │ │  │ │  │ │  │ │  │  (6 digit boxes)
  │ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘
  ├────────────────────────────┤
  │ [1] [2] [3] [4] [5] [6]    │
  │ [7] [8] [9] [0] [⌫]        │
  ├────────────────────────────┤
  │ [Connect This Device]      │
  └────────────────────────────┘

User Enters Code (e.g., "123456"):
  1. Frontend: pairDevice("123456")
  2. POST /api/pairing/claim
     {
       "code": "123456",
       "device_id": "ABC123XYZ"
     }
  3. Backend Validates:
     ✅ Code matches pairing_codes table
     ✅ Code not expired (< 15 min)
     ✅ Code maps to elderly_id

Backend Returns:
  {
    "device_token": "dev_abc123xyz...",
    "device_token_hash": "hash(...)",
    "elderly_profile": {
      "id": "elder_123",
      "name": "Ramesh Kumar",
      "age": 75,
      "language": "hi",
      ...
    }
  }

Frontend Saves:
  localStorage.device_token = "dev_abc123xyz..."
  localStorage.device_token_hash = "hash(...)"

Frontend Updates DeviceContext:
  1. pairDevice() callback
  2. saveDevicePairing(response)
  3. setElderlyProfile(response.elderly_profile)
  4. setPaired = true
  5. setRequiresPairing = false

Frontend Navigation:
  navigate("/elderly/home", { replace: true })

┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ PHASE 1 COMPLETE: Device paired, token saved, elderly ready to use app  │
└─────────────────────────────────────────────────────────────────────────────┘


PHASE 2: RETURN VISIT (Same Device)
─────────────────────────────────────────────────────────────────────────────

Device State:
  localStorage.device_token     → "dev_abc123xyz..."
  device.isPaired               → true (from previous session)
  device.requiresPairing        → false

App Load:
  1. User reopens app
  2. DeviceProvider useEffect runs
  3. getStoredDeviceToken() → "dev_abc123xyz..."
  4. POST /api/pairing/verify { token: "dev_abc123xyz..." }

Backend Validates:
  ✅ Token exists in paired_devices table
  ✅ Token not expired
  ✅ Device still active
  → Returns elderly_profile

Frontend Updates DeviceContext:
  1. setPaired = true
  2. setRequiresPairing = false
  3. setElderlyProfile(response.elderly_profile)
  4. setIsLoading = false

Entry Route:
  device.isLoading? → NO
  device.isPaired? → YES ✅
  → Render ElderlyHome directly

ElderlyHome (Conversation Page):
  ┌────────────────────────────────┐
  │ नमस्ते! Ramesh बहुत खुश हूँ   │
  │                                │
  │          ⭕ 🎤                │
  │       (Large Mic Button)       │
  │                                │
  │   Tap to talk or listen...    │
  └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ PHASE 2 COMPLETE: No auth screens, zero friction, immediate access      │
└─────────────────────────────────────────────────────────────────────────────┘


PHASE 3: TOKEN EXPIRES
─────────────────────────────────────────────────────────────────────────────

Device State (Stale):
  localStorage.device_token     → "dev_abc123xyz..." (expired in backend)
  device.isPaired               → true (from localStorage, not verified)
  device.requiresPairing        → false

Scenario: User on offline device, opens app after token expires

App Load:
  1. DeviceProvider useEffect runs
  2. getStoredDeviceToken() → "dev_abc123xyz..."
  3. POST /api/pairing/verify { token: "dev_abc123xyz..." }
  4. Backend: 401 Unauthorized (token expired or not found)

DeviceProvider Catches Error:
  .catch(() => {
    disablePatientDevice();  // Clears localStorage
    setIsPaired = false;
    setRequiresPairing = true;  // Signal to re-pair
    setElderlyProfile = null;
  })

Entry Route:
  device.isLoading? → NO
  device.isPaired? → NO
  device.requiresPairing? → YES ✅
  → Navigate to /elderly/pair

ClaimCodeEntry Screen:
  "Your device connection expired. Enter new code from your caregiver."
  ┌────────────────────────────┐
  │ Enter New Code             │
  ├────────────────────────────┤
  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
  │ │  │ │  │ │  │ │  │ │  │ │  │
  │ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘
  ├────────────────────────────┤
  │ [1] [2] [3] ... [Connect]  │
  └────────────────────────────┘

User Re-pairs:
  (Same as PHASE 1)

┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ PHASE 3 COMPLETE: Device re-paired with new code                        │
└─────────────────────────────────────────────────────────────────────────────┘


PHASE 4: UNPAIR DEVICE
─────────────────────────────────────────────────────────────────────────────

User Action (from Settings or forced logout):
  1. Tap "Unpair This Device" button
  2. Frontend: unpairDevice()
  3. POST /api/pairing/unpair { device_token: "dev_abc123xyz..." }
  4. Backend: Marks paired_devices.is_active = false

Frontend Updates:
  disablePatientDevice();  // Clears localStorage
  setPaired = false;
  setRequiresPairing = false;
  setElderlyProfile = null;

Entry Route (After Refresh):
  device.isPaired? → NO
  device.requiresPairing? → NO
  → Assume caregiver auth, or go to Welcome
  → Route to Welcome

Welcome Screen:
  User sees choice: "I'm a Caregiver" or "I'm Using an Elderly Device"
  If "Using an Elderly Device":
    → Route to /elderly/pair
    → Back to fresh device state

┌─────────────────────────────────────────────────────────────────────────────┐
│ ✅ PHASE 4 COMPLETE: Device unpaired, back to fresh state                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Caregiver Onboarding Wizard (3 Steps)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                 CAREGIVER ONBOARDING WIZARD (3 STEPS)                        │
└──────────────────────────────────────────────────────────────────────────────┘

ENTRY: Caregiver Signup

User fills:
  Email: rajesh@example.com
  Password: ••••••
  Display Name: Rajesh Kumar
  Account Type: caregiver

  [Sign Up Button]

API Call:
  POST /api/auth/signup
  {
    "email": "rajesh@example.com",
    "password": "...",
    "display_name": "Rajesh Kumar",
    "account_type": "caregiver"
  }

Backend Returns:
  {
    "access_token": "jwt_...",
    "user": {
      "id": "caregiver_123",
      "email": "rajesh@example.com",
      "display_name": "Rajesh Kumar"
    }
  }

Frontend:
  saveSession(response)
  navigate("/onboarding")

┌──────────────────────────────────────────────────────────────────────────────┐

STEP 1: ACCOUNT SETUP (Summary of Signup Info + Optional Details)

┌────────────────────────────────────────────────────────────┐
│ SmritiVani - Account Setup                          1 of 3 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Let's set up your account                                 │
│                                                            │
│ Email                                                     │
│ rajesh@example.com  [Read-only]                          │
│                                                            │
│ Display Name *                                            │
│ [Rajesh Kumar_______________]                             │
│                                                            │
│ Phone (optional)                                          │
│ [+91-____________]                                        │
│                                                            │
│ [Next →]                                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘

State:
  currentStep = 1
  formData = {
    email: "rajesh@example.com",
    display_name: "Rajesh Kumar",
    phone: "+91-9876543210"  (optional)
  }

On "Next":
  → Validate form
  → Save to state
  → currentStep = 2

┌──────────────────────────────────────────────────────────────────────────────┐

STEP 2: CREATE ELDERLY PROFILE (New in New Flow)

┌────────────────────────────────────────────────────────────┐
│ SmritiVani - Elderly Profile                       2 of 3 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Create Profile for Person You'll Care For                │
│                                                            │
│ Elderly Name *                                            │
│ [Ramesh Kumar__________________]                          │
│                                                            │
│ Age *                                                     │
│ [75___]                                                   │
│                                                            │
│ Preferred Language *                                      │
│ [▼ Hindi ______________________]  (Dropdown)              │
│   - Hindi                                                 │
│   - Marathi                                               │
│   - English                                               │
│                                                            │
│ City / Town                                               │
│ [Mumbai______________________]                            │
│                                                            │
│ ────────────────────────────────────────────────────     │
│ Medical Information                                       │
│ ────────────────────────────────────────────────────     │
│                                                            │
│ Doctor Name                                               │
│ [Dr. Priya Sharma_______________]                         │
│                                                            │
│ Doctor Phone                                              │
│ [+91-9876543210_____________]                             │
│                                                            │
│ Medical Conditions (select all that apply)                │
│ ☑ Diabetes          ☐ Arthritis      ☐ Asthma           │
│ ☑ Hypertension      ☐ Heart Disease  ☐ Kidney Disease   │
│ ☐ Thyroid           ☐ Other                              │
│                                                            │
│ ────────────────────────────────────────────────────     │
│ Emergency Contact                                         │
│ ────────────────────────────────────────────────────     │
│                                                            │
│ Emergency Contact Name                                    │
│ [Rajesh Kumar__________________]                          │
│                                                            │
│ Emergency Phone                                           │
│ [+91-9988776655_____________]                             │
│                                                            │
│ [Back] [Next →]                                          │
│                                                            │
└────────────────────────────────────────────────────────────┘

State:
  currentStep = 2
  formData.elderly = {
    name: "Ramesh Kumar",
    age: 75,
    language: "hi",
    city: "Mumbai",
    doctor_name: "Dr. Priya Sharma",
    doctor_phone: "+91-9876543210",
    medical_conditions: ["diabetes", "hypertension"],
    emergency_contact: "Rajesh Kumar",
    emergency_phone: "+91-9988776655"
  }

On "Next":
  → Validate required fields
  → POST /api/caregiver/elderly
     {
       "name": "Ramesh Kumar",
       "age": 75,
       "language": "hi",
       "city": "Mumbai",
       "doctor_name": "Dr. Priya Sharma",
       "doctor_phone": "+91-9876543210",
       "medical_conditions": ["diabetes", "hypertension"],
       "emergency_contact": "Rajesh Kumar",
       "emergency_phone": "+91-9988776655"
     }
  → Backend creates elderly profile, returns elderly_id
  → formData.elderly_id = "elder_123"
  → currentStep = 3

┌──────────────────────────────────────────────────────────────────────────────┐

STEP 3: GENERATE PAIRING CODE (New in New Flow)

┌────────────────────────────────────────────────────────────┐
│ SmritiVani - Pairing Code                          3 of 3 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Share This Code With Elderly Device                       │
│                                                            │
│ Code for Ramesh Kumar:                                   │
│                                                            │
│         ┌─────────────────────────────┐                  │
│         │   A B C D E - F G H J K     │                  │
│         │                             │                  │
│         │ (Large, monospace, 6 chars) │                  │
│         └─────────────────────────────┘                  │
│                                                            │
│ [📋 Copy Code]   [🔗 Copy Link]   [📱 Share]            │
│                                                            │
│ QR Code (Optional, Nice-to-Have):                        │
│         ┌─────────────────┐                              │
│         │ ▄▄▄▄▄ ▀▀▀ ▄▄▄▄ │                              │
│         │ ▀   ▀ ▀▀▀ ▀   ▀ │                              │
│         │ ▀ ▀ ▀ ▀▀▀ ▀ ▀ ▀ │  (Encoded with code)        │
│         │ ▀▀▀▀▀ ▀ ▀ ▀▀▀▀ │                              │
│         └─────────────────┘                              │
│                                                            │
│ Instructions:                                             │
│ 1. Ask elderly to open SmritiVani app                    │
│ 2. Tap "Enter Code"                                      │
│ 3. They'll type or scan code above                       │
│ 4. Device connects and conversation starts!              │
│                                                            │
│ [← Back] [✓ Complete Onboarding]                         │
│                                                            │
└────────────────────────────────────────────────────────────┘

On Mount (Step 3):
  → POST /api/pairing/issue
     {
       "elderly_id": "elder_123"
     }
  → Backend generates 6-digit code
  → Backend stores in pairing_codes table with TTL=15min
  → Frontend displays code
  → formData.pairing_code = "ABCDE-FGHJK"

Copy Button:
  → navigator.clipboard.writeText("ABCDE-FGHJK")
  → Show toast "Code copied!"

Share Button (WhatsApp, SMS, etc.):
  → window.open("whatsapp://send?text=SmritiVani Code: ABCDE-FGHJK")
  → OR share via messaging app

On "Complete Onboarding":
  → navigate("/caregiver/dashboard", { replace: true })
  → Clear wizard state

┌──────────────────────────────────────────────────────────────────────────────┐

FINAL STATE AFTER ONBOARDING:

Caregiver:
  ✅ Account created
  ✅ Elderly profile created
  ✅ Pairing code generated
  ✅ On dashboard

Elderly:
  ⏳ Receives code from caregiver (via SMS, WhatsApp, etc.)

Elderly Device:
  ⏳ User opens app, enters code
  ⏳ Device pairs
  ⏳ Conversation page loads

┌──────────────────────────────────────────────────────────────────────────────┐
```

---

## 4. Complete End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE CAREGIVER-FIRST FLOW                                │
│           (From Fresh User → Caregiver & Elderly Using App)                     │
└──────────────────────────────────────────────────────────────────────────────────┘

DAY 0: SETUP PHASE
═════════════════════════════════════════════════════════════════════════════════

Time: 10:00 AM

CAREGIVER (Rajesh) opens app for first time:
  1. Navigates to https://smritivani.app
  2. EntryRoute: No auth, no device → Welcome page
  3. Clicks "I'm a Caregiver"
  4. Routes to /signup
  5. Fills form:
     - Email: rajesh.caregiver@example.com
     - Password: SecurePass123!
     - Display Name: Rajesh Kumar
  6. Clicks "Sign Up"
  7. Backend creates caregiver account
  8. Frontend saves JWT to localStorage
  9. Routes to /onboarding

CAREGIVER completes 3-step wizard:
  Step 1: Confirms email, updates phone number
  Step 2: Creates elderly profile for "Ramesh Kumar" (age 75, Hindi, diabetic, etc.)
  Step 3: Generates pairing code: "ABCDE-FGHJK"
         - Code shown in large, copyable format
         - Code sent to elderly via WhatsApp

Result:
  ✅ Caregiver account created
  ✅ Elderly profile (Ramesh Kumar) created in DB
  ✅ Pairing code generated (valid for 15 min)
  ✅ Caregiver redirected to Dashboard
  ✅ Elderly received code on phone

────────────────────────────────────────────────────────────────────────────────

DAY 0 (cont): ELDERLY DEVICE SETUP PHASE
═════════════════════════════════════════════════════════════════════════════════

Time: 10:15 AM

ELDERLY (Ramesh) receives code on phone:
  Message: "नमस्ते! SmritiVani कोड: ABCDE-FGHJK"

ELDERLY's TABLET (Fresh device, never used before):
  Device state:
    localStorage.device_token = ∅
    device.isPaired = false
    device.requiresPairing = false

ELDERLY opens SmritiVani app on tablet:
  1. EntryRoute runs
  2. DeviceContext initializes:
     - Reads localStorage.device_token → null
     - Sets isPaired = false, requiresPairing = false
  3. EntryRoute logic:
     - device.isPaired? → NO
     - device.requiresPairing? → NO
     - Check caregiver auth (assume no)
     - Route to /welcome
  4. Welcome page shows:
     - "Welcome to SmritiVani"
     - "I'm a Caregiver" button
     - "I'm Using an Elderly Device" button

ELDERLY (or caregiver helping) taps "I'm Using an Elderly Device":
  Routes to /elderly/pair (ClaimCodeEntry)

ELDERLY sees claim code entry screen:
  "Code daalein" (Enter code)
  [Large 6-digit input boxes]
  [Numeric keypad: 1-9, 0, backspace]

ELDERLY types/enters code: "ABCDE-FGHJK" (or scans QR)

Frontend calls:
  pairDevice("ABCDEFGHJK")
    → POST /api/pairing/claim
       {
         "code": "ABCDEFGHJK",
         "device_id": "tablet_ramesh_001"
       }

Backend validates:
  ✅ Code exists in pairing_codes table
  ✅ Code not expired (< 15 min old)
  ✅ Code maps to elderly_id "elder_123"
  ✅ Generate device_token: "dev_abc123xyz..."
  ✅ Store in paired_devices table

Backend returns:
  {
    "device_token": "dev_abc123xyz...",
    "elderly_profile": {
      "id": "elder_123",
      "name": "Ramesh Kumar",
      "age": 75,
      "language": "hi",
      ...
    }
  }

Frontend:
  1. Saves: localStorage.device_token = "dev_abc123xyz..."
  2. Calls: pairDevice callback
  3. Updates DeviceContext:
     - setElderlyProfile(response.elderly_profile)
     - setPaired = true
     - setRequiresPairing = false
  4. Navigates: /elderly/home

ElderlyHome (Conversation Page) renders:
  ┌──────────────────────────────┐
  │ नमस्ते! Ramesh                │
  │ Good morning, how are you?   │
  │                              │
  │         ⭕ 🎤               │
  │     (Tap to Talk)            │
  │                              │
  │ मुझे दवा लेनी है              │ (Suggestion)
  │ परिवार से बात करना           │ (Suggestion)
  │ भजन सुनना                     │ (Suggestion)
  └──────────────────────────────┘

Result:
  ✅ Device paired
  ✅ Elderly sees conversation page
  ✅ Zero authentication friction
  ⏱️  Total time: < 1 minute

────────────────────────────────────────────────────────────────────────────────

DAY 0 (cont): ELDERLY USING APP
═════════════════════════════════════════════════════════════════════════════════

Time: 10:20 AM

ELDERLY (Ramesh) taps mic button and says:
  "मुझे दवा लेनी है" (I need to take medicine)

Frontend:
  1. Records voice
  2. Sends to backend: POST /api/voice/text
     { "audio": "...", "language": "hi" }
  3. Backend processes:
     - Speech to text: "मुझे दवा लेनी है"
     - Intent detection: intent = "medicine"
     - Stores in voice_interactions table

Frontend receives intent, routes to Medicine screen:
  /elderly/medicine

MedicineScreen renders:
  ┌────────────────────────────────┐
  │ आपकी दवाइयाँ                   │
  │ Your Medicines                 │
  │                                │
  │ ┌──────────────────────────┐  │
  │ │ [IMG] Aspirin 75mg       │  │
  │ │ After dinner            │  │
  │ │ [✓ Mark Taken]          │  │
  │ └──────────────────────────┘  │
  │                                │
  │ ┌──────────────────────────┐  │
  │ │ [IMG] Metformin 500mg    │  │
  │ │ Before breakfast        │  │
  │ │ [✓ Mark Taken]          │  │
  │ └──────────────────────────┘  │
  └────────────────────────────────┘

ELDERLY taps "Mark Taken" for Aspirin:
  Frontend:
    POST /api/medicine/log
    {
      "medicine_id": "med_123",
      "status": "taken",
      "timestamp": "2024-11-08T10:20:00Z"
    }

Backend:
  Creates medicine_logs entry
  Updates elderly's medicine compliance

Frontend routes back to ElderlyHome (conversation page)

Result:
  ✅ Voice command processed
  ✅ Medicine logged
  ✅ Seamless experience

────────────────────────────────────────────────────────────────────────────────

DAY 1: RETURN VISIT (SAME DEVICE)
═════════════════════════════════════════════════════════════════════════════════

Time: 11:00 AM (Next morning)

ELDERLY (Ramesh) opens app again on same tablet:

Device state:
  localStorage.device_token = "dev_abc123xyz..."
  device.isPaired = true (from prev session)
  device.requiresPairing = false

App loads:
  1. DeviceProvider useEffect runs
  2. Reads localStorage.device_token → "dev_abc123xyz..."
  3. POST /api/pairing/verify { token: "dev_abc123xyz..." }
  4. Backend validates token → ✅ Valid
  5. Returns elderly_profile
  6. DeviceContext:
     - setPaired = true
     - setElderlyProfile(response.elderly_profile)
     - setIsLoading = false

EntryRoute logic:
  device.isLoading? → NO
  device.isPaired? → YES ✅
  → Render ElderlyHome directly

Result:
  ✅ NO auth screens
  ✅ NO loading delays
  ✅ Direct to conversation page
  ✅ < 500ms total load time

────────────────────────────────────────────────────────────────────────────────

CAREGIVER DASHBOARD (REAL-TIME MONITORING)
═════════════════════════════════════════════════════════════════════════════════

Caregiver (Rajesh) logs in (from another device/browser):
  1. Routes to /login
  2. Enters email & password
  3. Gets JWT token
  4. Routes to /caregiver/dashboard

Dashboard shows (real-time):
  ┌─────────────────────────────────────────┐
  │ Dashboard: Ramesh Kumar                 │
  │                                         │
  │ 📊 Voice Interactions: 5                │
  │ 😊 Mood: Happy (Sentiment: 0.85)      │
  │ ⏱️  Last Active: 10 mins ago            │
  │ 🚨 Pending Alerts: 0                   │
  │ 📱 Device Status: Connected ✓          │
  │                                         │
  │ [▶ Daily Log] [👥 Contacts] [⚙️ Settings]
  └─────────────────────────────────────────┘

Caregiver clicks "Daily Log":
  Routes to /caregiver/daily-log
  Shows:
  - Date picker: "Nov 8, 2024"
  - Mood: Happy
  - Summary: "Ramesh had a good day. Took medicines on time..."
  - Timeline of 5 voice interactions
  - Medicine compliance
  - Family contact logs

Result:
  ✅ Caregiver sees real-time activity
  ✅ Can monitor elderly well-being
  ✅ Can react to issues

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ✅ COMPLETE FLOW SUCCESS                                                        │
│                                                                                  │
│  • Caregiver setup: 5 minutes                                                   │
│  • Elderly onboarding: 1 minute                                                 │
│  • Elderly return visits: < 1 second (localStorage)                             │
│  • No friction, no confusion, intuitive flow                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. State Transition Matrix

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                  STATE TRANSITION MATRIX (All Combinations)                    │
└────────────────────────────────────────────────────────────────────────────────┘

Current State               User Action                     New State              Route
─────────────────────────────────────────────────────────────────────────────────────

[Device: Fresh, No Auth]
device.isPaired = ❌
requiresPairing = ❌
auth = ❌                  Open app                        device.isPaired = ❌    /welcome
                                                           requiresPairing = ❌
                                                           auth = ❌

                          Click "Using Device"            device.isPaired = ❌    /elderly/pair
                                                          requiresPairing = ❌
                                                          auth = ❌

[Elderly Device: Entry]
device.isPaired = ❌
requiresPairing = ❌
auth = ❌                  Enter code                      device.isPaired = ✅    /elderly/home
                                                          requiresPairing = ❌
                                                          auth = ❌
                          (Backend validates & pairs)
                          (Frontend saves token)

[Elderly Device: Paired]
device.isPaired = ✅
requiresPairing = ❌
auth = ❌                  Return visit / Refresh         device.isPaired = ✅    /elderly/home
                          (localStorage verified)        requiresPairing = ❌
                                                          auth = ❌

                          Unpair device                    device.isPaired = ❌    /welcome
                                                          requiresPairing = ❌
                                                          auth = ❌

                          Token expires                    device.isPaired = ❌    /elderly/pair
                          (Backend 401)                  requiresPairing = ✅
                                                          auth = ❌

[Elderly Device: Token Expired]
device.isPaired = ❌
requiresPairing = ✅
auth = ❌                  Enter new code                  device.isPaired = ✅    /elderly/home
                                                          requiresPairing = ❌
                                                          auth = ❌

[Caregiver: Fresh]
device.isPaired = ❌
requiresPairing = ❌
auth = ❌                  Click "Caregiver"               device.isPaired = ❌    /signup
                                                          requiresPairing = ❌
                                                          auth = ❌

[Caregiver: Signup Complete]
device.isPaired = ❌
requiresPairing = ❌
auth = ✅                 Complete signup                 device.isPaired = ❌    /onboarding
                                                          requiresPairing = ❌    (Step 1)
                                                          auth = ✅

[Caregiver: Onboarding Complete]
device.isPaired = ❌
requiresPairing = ❌
auth = ✅                 Click "Complete"                device.isPaired = ❌    /caregiver/dashboard
                                                          requiresPairing = ❌
                                                          auth = ✅

[Caregiver: Dashboard]
device.isPaired = ❌
requiresPairing = ❌
auth = ✅                 Click "Generate Code"           device.isPaired = ❌    /caregiver/dashboard
                                                          requiresPairing = ❌    (Modal)
                                                          auth = ✅
                          (Code generated in backend)

                          Logout                          device.isPaired = ❌    /welcome
                                                          requiresPairing = ❌
                                                          auth = ❌

[Caregiver & Device Token]
device.isPaired = ✅
requiresPairing = ❌
auth = ✅                 Open app                        device.isPaired = ✅    /elderly/home
                          (Device token takes priority)   requiresPairing = ❌    (Prioritize device)
                                                          auth = ✅

                          Click "Back to Caregiver"       device.isPaired = ✅    /elderly/home
                          (Scenario: shared phone)        requiresPairing = ❌

                          Unpair device                   device.isPaired = ❌    /caregiver/dashboard
                                                          requiresPairing = ❌
                                                          auth = ✅

───────────────────────────────────────────────────────────────────────────────────

KEY PRINCIPLES:
  1️⃣  Device token (isPaired) takes priority over caregiver auth
      → If device is paired, always go to /elderly/home (shared device scenario)

  2️⃣  If device token missing entirely (requiresPairing = false), check caregiver auth
      → Caregiver JWT determines route

  3️⃣  Fresh users with no tokens/auth go to /welcome
      → Let them choose: "Caregiver" or "Device"

  4️⃣  Device loading state blocks all other logic
      → Don't route until localStorage is verified

  5️⃣  Old, expired tokens set requiresPairing = true
      → Signal to user: "Re-enter code"
```

