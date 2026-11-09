import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
const Dashboard = lazy(() => import("./pages/caregiver/Dashboard"));
const DailyLog = lazy(() => import("./pages/caregiver/DailyLog"));
const EmergencyAlert = lazy(() => import("./pages/caregiver/EmergencyAlert"));
const MemoryBank = lazy(() => import("./pages/caregiver/MemoryBank"));
const Settings = lazy(() => import("./pages/caregiver/Settings"));
const VoiceNotes = lazy(() => import("./pages/caregiver/VoiceNotes"));
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Signup = lazy(() => import("./pages/Signup"));
const ElderlyHome = lazy(() => import("./pages/elderly/ElderlyHome"));
const Listening = lazy(() => import("./pages/elderly/Listening"));
const AISpeaking = lazy(() => import("./pages/elderly/AISpeaking"));
const Medicine = lazy(() => import("./pages/elderly/Medicine"));
const Events = lazy(() => import("./pages/elderly/Events"));
const Family = lazy(() => import("./pages/elderly/Family"));
const Activities = lazy(() => import("./pages/elderly/Activities"));
const Emergency = lazy(() => import("./pages/elderly/Emergency"));
const Recap = lazy(() => import("./pages/elderly/Recap"));
const Bhajan = lazy(() => import("./pages/elderly/Bhajan"));
import ProtectedRoute from "./components/ProtectedRoute";
const CaregiverEvents = lazy(() => import("./pages/caregiver/Events"));
import PatientDeviceRoute from "./components/PatientDeviceRoute";
const PatientSessionExpired = lazy(() => import("./pages/PatientSessionExpired"));
const ClaimCodeEntry = lazy(() => import("./pages/elderly/ClaimCodeEntry"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-cream text-lg font-bold text-ink">Loading SmritiVani…</main>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/patient-session-expired" element={<PatientSessionExpired />} />
          <Route path="/elderly/pair" element={<ClaimCodeEntry />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/caregiver/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/caregiver" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/caregiver/events" element={<ProtectedRoute><CaregiverEvents /></ProtectedRoute>} />
          <Route path="/caregiver/memory" element={<ProtectedRoute><MemoryBank /></ProtectedRoute>} />
          <Route path="/caregiver/notes" element={<ProtectedRoute><VoiceNotes /></ProtectedRoute>} />
          <Route path="/caregiver/emergency" element={<ProtectedRoute><EmergencyAlert /></ProtectedRoute>} />
          <Route path="/caregiver/log" element={<ProtectedRoute><DailyLog /></ProtectedRoute>} />
          <Route path="/caregiver/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/elderly" element={<PatientDeviceRoute><ElderlyHome /></PatientDeviceRoute>} />
          <Route path="/elderly/listening" element={<PatientDeviceRoute><Listening /></PatientDeviceRoute>} />
          <Route path="/elderly/speaking" element={<PatientDeviceRoute><AISpeaking /></PatientDeviceRoute>} />
          <Route path="/elderly/medicine" element={<PatientDeviceRoute><Medicine /></PatientDeviceRoute>} />
          <Route path="/elderly/events" element={<PatientDeviceRoute><Events /></PatientDeviceRoute>} />
          <Route path="/elderly/family" element={<PatientDeviceRoute><Family /></PatientDeviceRoute>} />
          <Route path="/elderly/activities" element={<PatientDeviceRoute><Activities /></PatientDeviceRoute>} />
          <Route path="/elderly/bhajan" element={<PatientDeviceRoute><Bhajan /></PatientDeviceRoute>} />
          <Route path="/elderly/emergency" element={<PatientDeviceRoute><Emergency /></PatientDeviceRoute>} />
          <Route path="/elderly/recap" element={<PatientDeviceRoute><Recap /></PatientDeviceRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
