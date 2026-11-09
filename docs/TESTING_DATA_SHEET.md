# 📋 Testing Data Sheet - Copy & Paste Ready

**Use this sheet while testing. Copy the data directly into the forms.**

---

## 🖥️ URLs

```
Backend:        http://localhost:8000/api
Caregiver:      http://localhost:8443/
Elderly:        http://localhost:8444/
```

---

## 👤 CAREGIVER ACCOUNT

### Signup Form
```
Email:          caregiver@test.com
Password:       Test123!@#
Name:           Ramesh Kumar
Phone:          +919876543210
```

### Alternative Accounts (if you want to test multiple)

**Account 2**:
```
Email:          priya@test.com
Password:       Priya123!@
Name:           Priya Sharma
Phone:          +919999111222
```

**Account 3**:
```
Email:          admin@test.com
Password:       Admin123!@
Name:           Admin User
Phone:          +919888222333
```

---

## 👵 ELDERLY PROFILE (For Account 1)

### Primary Elderly
```
Name:           Meera Devi
Age:            75
Language:       Hindi
City:           Mumbai
Lives Alone:    NO (unchecked)
Doctor Name:    Dr. Patel
Doctor Phone:   +919876543211
```

### Alternative Elderly (if you want 2nd profile)
```
Name:           Harish Kumar
Age:            80
Language:       Hindi
City:           Delhi
Lives Alone:    YES (checked)
Doctor Name:    Dr. Singh
Doctor Phone:   +919765432123
```

---

## 💊 MEDICINES TO ADD

### Medicine Set 1 (for Meera Devi)

**Medicine 1**:
```
Name:           Aspirin
Dosage:         75mg
Frequency:      Once daily
Time:           08:00 AM
Notes:          Blood thinner for heart
```

**Medicine 2**:
```
Name:           Metformin
Dosage:         500mg
Frequency:      Twice daily
Times:          08:00 AM, 08:00 PM
Notes:          Diabetes management
```

**Medicine 3**:
```
Name:           Lisinopril
Dosage:         10mg
Frequency:      Once daily
Time:           09:00 PM
Notes:          Blood pressure
```

**Medicine 4**:
```
Name:           Vitamin D3
Dosage:         2000 IU
Frequency:      Once daily
Time:           08:30 AM
Notes:          Bone health
```

---

## 👨‍👩‍👧 FAMILY CONTACTS TO ADD

### Contact Set 1 (for Meera Devi)

**Contact 1**:
```
Name:           Rajesh Kumar
Relationship:   Son
Phone:          +919999888777
Address:        Mumbai
```

**Contact 2**:
```
Name:           Neha Sharma
Relationship:   Daughter
Phone:          +919888777666
Address:        Bangalore
```

**Contact 3**:
```
Name:           Arjun Kumar
Relationship:   Grandson
Phone:          +919777666555
Address:        Delhi
```

**Contact 4 (Emergency)**:
```
Name:           Dr. Patel
Relationship:   Doctor
Phone:          +919876543211
Address:        Mumbai Clinic
```

---

## 🧠 MEMORIES/EVENTS TO ADD

### Memory Set 1

**Memory 1**:
```
Title:          Wedding Day 1980
Description:    Married at Taj Mahal under moonlight
Date:           1980-06-15
Category:       Wedding
```

**Memory 2**:
```
Title:          First Grandchild Born
Description:    Grandson Arjun born, weight 3.5kg
Date:           2015-05-20
Category:       Family Milestone
```

**Memory 3**:
```
Title:          Trip to Kerala
Description:    Beautiful backwaters, best vacation ever
Date:           2019-03-10
Category:       Travel
```

**Memory 4**:
```
Title:          Silver Anniversary
Description:    Celebrated 25 years of marriage with family
Date:           2005-06-15
Category:       Anniversary
```

---

## 🎤 VOICE TEST INPUTS (Hindi)

### Test 1: Simple Greeting
```
Input:  "नमस्ते, मैं कैसे हूँ?"
English: "Hello, how am I?"
Expected: AI greets in Hindi/Hinglish
```

### Test 2: Name
```
Input:  "मेरा नाम मीरा है"
English: "My name is Meera"
Expected: AI acknowledges the name
```

### Test 3: Story Request
```
Input:  "मुझे कहानी सुनाएं"
English: "Tell me a story"
Expected: AI tells a short Hindi story
```

### Test 4: Weather
```
Input:  "आज मौसम कैसा है?"
English: "How's the weather today?"
Expected: AI responds about weather
```

### Test 5: Medicine Reminder
```
Input:  "मेरी दवाई का समय क्या है?"
English: "What time is my medicine?"
Expected: AI lists medicine schedule
```

### Test 6: Family Contact
```
Input:  "मेरे बेटे का नाम क्या है?"
English: "What is my son's name?"
Expected: AI responds with contact name
```

---

## 📝 EVENTS TO CREATE

### Event 1
```
Title:          Daily Morning Walk
Date:           Today
Time:           06:00 AM
Repeat:         Daily
Description:    Morning exercise routine
```

### Event 2
```
Title:          Doctor Appointment
Date:           Friday (next)
Time:           10:00 AM
Repeat:         None
Description:    Checkup with Dr. Patel
```

### Event 3
```
Title:          Grandson Visit
Date:           Sunday (next)
Time:           03:00 PM
Repeat:         Weekly
Description:    Arjun visits from Delhi
```

---

## 🔑 TEST CREDENTIALS SUMMARY

### Primary Test User
```
Type:           Caregiver
Email:          caregiver@test.com
Password:       Test123!@#

Elderly:        Meera Devi (75, Mumbai)
Phone:          +919876543210
```

### Quick Copy

**Caregiver Email**: `caregiver@test.com`

**Caregiver Password**: `Test123!@#`

**Elderly Name**: `Meera Devi`

---

## ⏱️ TIMING CHECKLIST

| Event | Expected Time |
|-------|---|
| Signup → Dashboard | < 3 seconds |
| Code Generation | < 2 seconds |
| Code Entry → Device Paired | < 2 seconds |
| Conversation Response | 2-5 seconds |
| Page Refresh (Elderly) | < 1 second |
| Page Refresh (Caregiver) | < 2 seconds |
| Medicine Add | < 2 seconds |
| Contact Add | < 2 seconds |

---

## 🧪 TEST SCENARIO CHECKLIST

### Scenario 1: Fresh Account (15 min)
- [ ] Signup with caregiver@test.com
- [ ] Create Meera Devi profile
- [ ] Add 2 medicines
- [ ] Add 2 contacts
- [ ] Generate code
- [ ] Pair elderly device
- [ ] Elderly sees conversation page

### Scenario 2: Voice Conversation (5 min)
- [ ] Elderly opens microphone
- [ ] Say "Hello in Hindi"
- [ ] AI responds
- [ ] Caregiver sees conversation logged

### Scenario 3: Multiple Actions (10 min)
- [ ] Caregiver adds more medicines
- [ ] Elderly marks medicine as taken
- [ ] Caregiver views elderly's activity
- [ ] Elderly views family contacts
- [ ] Caregiver updates profile

### Scenario 4: Persistence Test (5 min)
- [ ] Page refresh (caregiver)
- [ ] Page refresh (elderly)
- [ ] Device token still valid
- [ ] JWT still valid

### Scenario 5: Logout Test (5 min)
- [ ] Caregiver logout
- [ ] Elderly redirected to pairing
- [ ] Login again
- [ ] Generate new code
- [ ] Re-pair device

---

## 📱 BROWSER CONSOLE COMMANDS

### Check if Caregiver is Logged In
```javascript
localStorage.getItem('smritivani.access_token')
// Should return: eyJ0eXAi... (JWT token)
```

### Check if Elderly Device is Paired
```javascript
localStorage.getItem('smritivani.device_token')
// Should return: device token string
```

### Check Elderly ID
```javascript
localStorage.getItem('smritivani.elder_id')
// Should return: eld_xxx...
```

### Clear All Storage (Fresh Start)
```javascript
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Check All Storage Keys
```javascript
Object.keys(localStorage).forEach(k => console.log(k, localStorage[k]))
```

---

## 🎯 SUCCESS INDICATORS

**Caregiver Tab Successful If**:
- ✅ Can signup
- ✅ Can create profile
- ✅ Can generate code
- ✅ Can add medicines/contacts
- ✅ Can see device paired status
- ✅ Can see conversation logs

**Elderly Tab Successful If**:
- ✅ Can enter code
- ✅ Can see conversation interface
- ✅ Can view medicines
- ✅ Can view contacts
- ✅ Survives page refresh
- ✅ Voice input works (optional)

**Integration Successful If**:
- ✅ Real-time sync
- ✅ Data consistent
- ✅ No 401 errors
- ✅ No redirects
- ✅ Session persists

---

**Print this sheet and use it during testing!** 📋
